import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { addCredits } from '../db/user';
import userAuth from "../middleware/supabaseAuth";
import { stripeClient } from "../payments/stripe";
import { StripePaymentMetadata } from '../types/interfaces';

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
                if (paymentIntent.description === "Payment for EnrichMinion Credits") {
                    return res.status(200).json({ received: true, reason: "for enrichminion" });
                }
                const metadata = paymentIntent.metadata as unknown as StripePaymentMetadata;

                if (metadata) {
                    if (!metadata.subscriptionPlan) {
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
        const {amount, currency,costumerID,description,automaticPayment, referral,credits,userID,cientName} = req.body;

        const paymentIntent = await stripeClient.paymentIntents.create({
            amount: amount,
            currency: currency,
            customer: costumerID,
            description: description,
            automatic_payment_methods: {
                enabled: automaticPayment
            },
            metadata: {
                referral: referral || null,
                credits: credits,
                currency: currency,
                userId: userID,
                clientName: cientName
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

