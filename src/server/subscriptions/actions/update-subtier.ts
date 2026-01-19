"use server";

import { auth } from "@clerk/nextjs/server";
import { STRIPE_CUSTOMER_ID_KV, syncStripeDataToKv } from "../store";

export async function triggerSyncForUser() {
  const session = await auth();
  if (!session.userId) {
    return;
  }

  const stripeCustomerId = await STRIPE_CUSTOMER_ID_KV.get(session.userId);
  if (!stripeCustomerId) {
    return;
  }

  return await syncStripeDataToKv(stripeCustomerId);
}
