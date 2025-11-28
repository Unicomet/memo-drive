import stripe from "stripe";
import { env } from "~/env";

export async function POST(request: Request) {
  const endpointSecret = env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!signature || !endpointSecret) {
    console.log("Missing signature or endpoint secret.");
    return new Response("Bad Request", { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      endpointSecret,
    );
    let subscription;
    let status;
    // Handle the event

    switch (event.type) {
      case "customer.subscription.trial_will_end":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription trial ending.
        // handleSubscriptionTrialEnding(subscription);
        break;
      case "customer.subscription.deleted":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription deleted.
        // handleSubscriptionDeleted(subscriptionDeleted);
        break;
      case "customer.subscription.created":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription created.
        // handleSubscriptionCreated(subscription);
        break;
      case "customer.subscription.updated":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription update.
        // handleSubscriptionUpdated(subscription);
        break;
      case "entitlements.active_entitlement_summary.updated":
        subscription = event.data.object;
        console.log(
          `Active entitlement summary updated for ${subscription.customer}.`,
        );
        // Then define and call a method to handle active entitlement summary updated
        // handleEntitlementUpdated(subscription);
        break;
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}.`);
    }
  } catch (err) {
    if (err instanceof Error) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
    }
    return new Response("Bad Request", { status: 400 });
  }

  // Return a 200 response to acknowledge receipt of the event
  return new Response("OK", { status: 200 });
}
