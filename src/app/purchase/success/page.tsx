import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  STRIPE_CUSTOMER_ID_KV,
  syncStripeDataToKv,
} from "~/server/subscriptions/store";

export default async function PaymentSuccessPage() {
  const session = await auth();
  if (!session.userId) {
    redirect("/sign-in");
  }

  const stripeCustomerId = await STRIPE_CUSTOMER_ID_KV.get(session.userId);
  if (!stripeCustomerId) {
    redirect("/drive");
  }

  await syncStripeDataToKv(stripeCustomerId);
  redirect("/drive");

  // return (
  //   <section>
  //     <div className="product Box-root">
  //       <div className="description Box-root">
  //         <h3>Subscription to Starter plan successful!</h3>
  //       </div>
  //     </div>
  //     <form action="/create-portal-session" method="POST">
  //       <input type="hidden" id="session-id" name="session_id" value="" />
  //       <button id="checkout-and-portal-button" type="submit">
  //         Manage your billing information
  //       </button>
  //     </form>
  //   </section>
  // );
}
