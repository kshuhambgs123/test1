import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { addCredits } from '../db/user';
import userAuth from "../middleware/supabaseAuth";
import { stripeClient } from "../payments/stripe";
import { StripePaymentMetadata } from '../types/interfaces';
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express.Router();

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

app.post("/searchLeadsConfirmPayment", async (req: Request, res: Response) => {
    try {
        // Webhook route
        try {
            const sig = req.headers['stripe-signature'];

            if (!sig) {
                return res.status(200).json({ error: 'Missing Stripe signature' });
            }

            let event: Stripe.Event;

            const payload = req.body;
            const payloadString = JSON.stringify(payload, null, 2);
            const secret = endpointSecret;
            const header = stripeClient.webhooks.generateTestHeaderString({
                payload: payloadString,
                secret,
            })

            event = stripeClient.webhooks.constructEvent(payloadString, header, secret);

            // Handle payment_intent.succeeded event
            if (event.type === "payment_intent.succeeded") {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                //
                console.log("-- PAYMENT INTENT ID :", paymentIntent.id);

                if(paymentIntent.metadata.version != "v1") return res
                    .status(200)
                    .json({ received: true, reason: "Not for v1", current_version: paymentIntent.metadata.version });

                // Skip subscription-related payments - handled by invoice webhook
                if (paymentIntent.invoice || paymentIntent.metadata?.subscriptionPlan ||
                        paymentIntent.description?.toLowerCase().includes("subscription")
                    /* paymentIntent.description === "Subscription update" ||
                    paymentIntent.description?.includes("subscription")
                */) {
                    console.log(
                    `Skipping subscription payment intent: ${paymentIntent.id}`
                    );
                    return res
                    .status(200)
                    .json({ received: true, subscription_handled_elsewhere: true });
                }
                //
                if (paymentIntent.description === "Payment for EnrichMinion Credits") {
                    return res.status(200).json({ received: true, reason: "for enrichminion" });
                }
                const metadata = paymentIntent.metadata as unknown as StripePaymentMetadata;

                if (metadata) {
                    if (metadata && !metadata.subscriptionPlan && metadata.credits) {
                        console.log("single payment");
                        if (!metadata.credits) {
                            return res.status(200).json({ error: 'Missing credits in metadata' });
                        }
                        const updatedCredits = await addCredits(parseFloat(metadata.credits), metadata.userId);
                        if (!updatedCredits) {
                            return res.status(200).json({ error: 'Internal Server Error' });
                        }
                        return res.status(200).json({ received: true });
                    }
                }
            }
            return res.status(200).json({ error: 'Internal Server Error' });
        } catch (error: any) {
            console.error('Unexpected error:', error);
            return res.status(200).json({ error: `Internal Server Error ${error.message}` });
        }
    } catch (error: any) {
        res.status(200).json({ message: error.message });
    }
})

app.post("/paymentCancelledIntent", userAuth, async (req: Request, res: Response) => {
    try {
        const { paymentIntentId, cancellationReason } = req.body;
        const paymentIntent = await stripeClient.paymentIntents.cancel(paymentIntentId, {
            cancellation_reason: cancellationReason, // reason to cancel
        });
        res.status(200).json({ paymentIntent });
        
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
})

app.post("/retrieveCoupon", userAuth, async (req: Request, res: Response) => {
    try {
        const { couponCode } = req.body;
        const coupon = await stripeClient.coupons.retrieve(couponCode);
        res.status(200).json({ coupon });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
})

app.post("/deleteCustomer", userAuth, async (req: Request, res: Response) => {
    try {
        const { customerId } = req.body;
        const deletedCustomer = await stripeClient.customers.deleteDiscount(customerId);
        res.status(200).json({ deletedCustomer });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
})

app.post("/updateCouponCode", userAuth, async (req: Request, res: Response) => {
    try {
        const { customerId, couponCode } = req.body;
        const updatedCustomer = await stripeClient.customers.update(customerId, {
            coupon: couponCode
        });

        res.status(200).json({ updatedCustomer });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
})

app.post("/createCustomer", userAuth, async (req: Request, res: Response) => {
    try {
        const { name, email, couponID } = req.body;
        const customer = await stripeClient.customers.create({
            name: name,
            email: email,
            coupon: couponID
        })

        res.status(200).json({ customer });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
})

app.post("/createPaymentIntent", userAuth, async (req: Request, res: Response) => {
    try {
        const {currency,costumerID,description,automaticPayment, referral,credits,userID,cientName,couponCode} = req.body;

      if (!currency || !credits) {
        return res.status(400).json({ message: "Invalid currency or credits" });
      }

      const selectedCurrency = currency.toUpperCase();
      const perThousandCredit = process.env.COSTPERLEAD || 5;
      // Base conversion: 1000 credits = $5
      const amountInUSD = parseInt(credits) * Number(perThousandCredit);

      const amountInUSDPerThousandCredit = amountInUSD / 1000;
      // console.log("amount :: ", credits, currency, selectedCurrency, perThousandCredit, amountInUSD, amountInUSDPerThousandCredit);
      // Fallback rates if env is not set
      const defaultRates: Record<string, number> = {
        USD: 1,
        INR: 88.188049,
        GBP: 0.74502,
        EUR: 0.859295,
      };

      const rates: Record<string, number> = {
        USD: parseFloat(process.env.USD_RATE || defaultRates.USD.toString()),
        INR: parseFloat(process.env.INR_RATE || defaultRates.INR.toString()),
        GBP: parseFloat(process.env.GBP_RATE || defaultRates.GBP.toString()),
        EUR: parseFloat(process.env.EUR_RATE || defaultRates.EUR.toString()),
      };

      const currencyRate = rates[selectedCurrency] ? rates[selectedCurrency] : defaultRates[selectedCurrency];

      // Calculate amount for Stripe (in smallest currency unit)
      const amountCalculated = Math.round(amountInUSDPerThousandCredit * currencyRate * 100);

      
      const coupon = couponCode ? await stripeClient.coupons.retrieve(couponCode) : null;

      let discountedAmount = 0;

      if (coupon) {
         const updateUser =  await stripeClient.customers.update(costumerID, {
            coupon: couponCode,
          });

          if(updateUser) { 
            if(coupon.percent_off && coupon.percent_off > 0) {
             discountedAmount =
                Number(amountCalculated) -
                Number(amountCalculated) * (coupon.percent_off / 100);
            } 
            else if(coupon.amount_off && coupon.amount_off > 0){
              discountedAmount =
                  Number(amountCalculated) -
                  Number(coupon.amount_off);
            }
          }
      }

      console.log("discounted price v1 :: ", amountCalculated, discountedAmount)


        const paymentIntent = await stripeClient.paymentIntents.create({
            amount: discountedAmount ? discountedAmount : amountCalculated,
            currency: currency,
            customer: costumerID,
            description: description,
            automatic_payment_methods: {
                enabled: automaticPayment
            },
            metadata: {
                _afficoneRef: referral || null,
                credits: credits,
                currency: currency,
                userId: userID,
                clientName: cientName,
                version: "v1",
            },
        });
        
        res.status(200).json({ paymentIntent });
    } catch (error: any) {
        res.status(500).json({ message: error.message });        
    }
});

app.post("/findCustomerByEmail", userAuth, async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const customers = await stripeClient.customers.list({
            email: email,
            limit: 1, // Limit to 1 result for efficiency
        });

        if (customers.data.length > 0) {
            res.status(200).json({ customerId: customers.data[0].id });
        } else {
            res.status(404).json({ message: "Customer not found" });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default app;

