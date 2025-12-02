import { Redis } from "@upstash/redis";
import { stripe } from "./stripe";
import type { Stripe } from "stripe";

export const redis = Redis.fromEnv();

export const STRIPE_SUB_CACHE_KV = {
  generateKey(stripeCustomerId: string) {
    return `stripe:customer:${stripeCustomerId}:stripe-sub-status`;
  },
  async get(stripeCustomerId: string): Promise<STRIPE_SUB_CACHE> {
    const response = await redis.get<string>(
      this.generateKey(stripeCustomerId),
    );
    if (!response) {
      return { status: "none" };
    }

    return JSON.parse(response) as STRIPE_SUB_CACHE;
  },
  async set(stripeCustomerId: string, data: STRIPE_SUB_CACHE) {
    await redis.set(this.generateKey(stripeCustomerId), JSON.stringify(data));
  },
};

export const STRIPE_CUSTOMER_ID_KV = {
  generateKey(userId: string) {
    return `user:${userId}:stiripe-customer-id`;
  },
  async get(userId: string) {
    return await redis.get<string>(this.generateKey(userId));
  },
  async set(userId: string, customerId: string) {
    await redis.set(this.generateKey(userId), customerId);
  },
};

export async function getStripeSubByUserId(userId: string) {
  const stripeCustomerId = await STRIPE_CUSTOMER_ID_KV.get(userId);
  console.log(
    "[Stripe][Get Sub] - Retrieved Stripe Customer ID:",
    stripeCustomerId,
  );
  if (!stripeCustomerId) {
    return null;
  }
  return stripeCustomerId;
}

export async function syncStripeDataToKv(stripeCustomerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "all",
    limit: 1,
    expand: ["data.default_payment_method"],
  });

  if (subscriptions.data[0] == null) {
    const subData = { status: "none" };
    return subData;
  }

  const subscription = subscriptions.data[0];

  // Store complete subscription state
  const subData = {
    subscriptionId: subscription.id,
    status: subscription.status,
    priceId: subscription.items.data[0]?.price.id ?? null,
    currentPeriodEnd: subscription.items.data[0]?.current_period_end ?? null, //should not be subscription.current_period_end ??
    currentPeriodStart:
      subscription.items.data[0]?.current_period_start ?? null, // subscription.current_period_start ??
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    paymentMethod:
      subscription.default_payment_method &&
      typeof subscription.default_payment_method !== "string"
        ? {
            brand: subscription.default_payment_method.card?.brand ?? null,
            last4: subscription.default_payment_method.card?.last4 ?? null,
          }
        : null,
  };
  await STRIPE_SUB_CACHE_KV.set(stripeCustomerId, subData);
  return subData;
}

export type STRIPE_SUB_CACHE =
  | {
      subscriptionId: string | null;
      status: Stripe.Subscription.Status;
      priceId: string | null;
      currentPeriodStart: number | null;
      currentPeriodEnd: number | null;
      cancelAtPeriodEnd: boolean;
      paymentMethod: {
        brand: string | null; // e.g., "visa", "mastercard"
        last4: string | null; // e.g., "4242"
      } | null;
    }
  | {
      status: "none";
    };
