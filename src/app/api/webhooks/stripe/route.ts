import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import {
  activateProSubscription,
  deactivateProSubscription,
  getUserByStripeCustomerId,
} from "@/lib/db/subscription";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (userId && customerId && subscriptionId) {
          await activateProSubscription(userId, customerId, subscriptionId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        if (
          subscription.status === "active" ||
          subscription.status === "trialing"
        ) {
          const user = await getUserByStripeCustomerId(customerId);
          if (user) {
            await activateProSubscription(
              user.id,
              customerId,
              subscription.id
            );
          }
        } else if (
          subscription.status === "canceled" ||
          subscription.status === "unpaid"
        ) {
          await deactivateProSubscription(customerId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        await deactivateProSubscription(customerId);
        break;
      }

      case "invoice.payment_failed": {
        // No-op: Stripe handles dunning emails
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
