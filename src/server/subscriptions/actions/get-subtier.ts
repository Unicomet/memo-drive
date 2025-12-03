"use server";

import { auth } from "@clerk/nextjs/server";
import { getStripeSubByUserId } from "../store";

export async function getSubtierForUser() {
  const session = await auth();
  if (!session.userId) {
    return "free";
  }

  const subData = await getStripeSubByUserId(session.userId);
  if (!subData) {
    return "free";
  }

  if (subData.status !== "active") {
    return "free";
  }

  return subData.subscriptionTier ?? "free";
}
