"use server";

import { auth } from "@clerk/nextjs/server";
import { getStripeSubByUserId } from "../store";

export async function getSubtierForUser(): Promise<"free" | "starter" | "pro"> {
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

  const subTier = subData.subscriptionTier;
  if (subTier === "starter" || subTier === "pro") {
    return subTier;
  }

  return "free";
}
