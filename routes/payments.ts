import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { addCredits } from '../db/user';
import { stripeClient } from "../payments/stripe";
import {  StripePaymentMetadata } from '../types/interfaces';

const app = express.Router();

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

app.post("/searchLeadsConfirmPayment", async (req: Request, res: Response) => {
    try {
        // Webhook route
        try {
            const sig = req.headers['stripe-signature'];

            if (!sig) {
                return res.status(400).json({ error: 'Missing Stripe signature' });
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
                            return res.status(400).json({ error: 'Missing credits in metadata' });
                        }
                        const updatedCredits = await addCredits(parseFloat(metadata.credits), metadata.userId);
                        if (!updatedCredits) {
                            return res.status(500).json({ error: 'Internal Server Error' });
                        }
                        return res.status(200).json({ received: true });
                    }
                }
            }
            return res.status(500).json({ error: 'Internal Server Error' });
        } catch (error: any) {
            console.error('Unexpected error:', error);
            return res.status(500).json({ error: `Internal Server Error ${error.message}` });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
})

export default app;