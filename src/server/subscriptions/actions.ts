"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { STRIPE_CUSTOMER_ID_KV } from "./store";
import { redirect } from "next/navigation";
import { env } from "~/env";
import { stripe } from "./stripe";

const domain = "http://localhost:3000";

export async function createCheckoutSession(formData: FormData) {
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  const return_url = formData.get("return_url")?.toString() ?? "/drive";
  const session = await auth();
  if (!session.userId) {
    redirect("/login");
  }

  // Check if user has already an active subscription
  // const existingSub = await getStripeSubByUserId(session.userId);
  // if (existingSub) {
  //   throw new Error("You already have an active subscription");
  // }

  let stripeCustomerId =
    (await STRIPE_CUSTOMER_ID_KV.get(session.userId)) ?? undefined;

  console.log(
    "[Stripe][Checkout Session] - Stripe ID from KV:",
    stripeCustomerId,
  );

  const clerkClientInstance = await clerkClient();
  const userInfo = await clerkClientInstance.users.getUser(session.userId);

  if (userInfo.emailAddresses[0]?.emailAddress == null) {
    throw new Error("User does not have a valid email address");
  }

  if (!stripeCustomerId) {
    const newCustomer = await stripe.customers.create({
      email: userInfo.emailAddresses[0]?.emailAddress,
      metadata: { userId: session.userId },
    });

    // Store the relation between userId and stripeCustomerId in your KV
    await STRIPE_CUSTOMER_ID_KV.set(session.userId, newCustomer.id);
    stripeCustomerId = newCustomer.id;
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    success_url: `${domain}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${domain}${return_url}`,
    subscription_data: {
      metadata: {
        userId: session.userId,
      },
    },
    allow_promotion_codes: true,
    mode: "subscription",
    line_items: [
      {
        price: env.STRIPE_PRICE_ID_STARTER_MONTHLY,
        quantity: 1,
      },
    ],
  });

  redirect(checkoutSession.url ?? "/drive");
}
