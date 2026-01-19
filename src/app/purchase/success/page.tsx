import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { tryCatch } from "~/lib/utils";
import { triggerSyncForUser } from "~/server/subscriptions/actions/update-subtier";

export const dynamic = "force-dynamic";

export async function ConfirmStripeSessionComponent() {
  const session = await auth();
  if (!session.userId) {
    return <div>No user, please log in</div>;
  }
  console.log("[Stripe/sucess] user: ", session);

  const { error } = await tryCatch(triggerSyncForUser());

  if (error) {
    console.error("[Stripe/sucess] Error syncing Stripe data:", error);
    return <div>Failed to sync to stripe: {error.message}</div>;
  }

  return redirect("/drive");
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id: string | undefined }>;
}) {
  const params = await searchParams;

  console.log("[Stripe/sucess] Checkout session ID:", params.session_id);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<div>Loading...</div>}>
        <ConfirmStripeSessionComponent />
      </Suspense>
    </div>
  );
}
