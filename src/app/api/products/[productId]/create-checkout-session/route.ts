import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { env } from "~/env";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

const YOUR_DOMAIN = "http://localhost:3000";

const createCheckoutSessionSchema = z.object({
  lookup_key: z.string(),
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const body = Object.fromEntries(formData.entries()) as z.infer<
    typeof createCheckoutSessionSchema
  >;
  const isRequestValid = createCheckoutSessionSchema.safeParse(body);

  if (!isRequestValid.success) {
    return NextResponse.json("Invalid request", { status: 400 });
  }

  const prices = await stripe.prices.list({
    lookup_keys: [body.lookup_key],
    expand: ["data.product"],
  });

  if (prices.data[0]?.id == null) {
    return NextResponse.json("Price not found", { status: 404 });
  }

  const session = await stripe.checkout.sessions.create({
    billing_address_collection: "auto",
    line_items: [
      {
        price: prices.data[0]?.id,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${YOUR_DOMAIN}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
  });

  if (session?.url == null)
    return NextResponse.json("Session not found", { status: 404 });

  return NextResponse.redirect(session.url, 303);
}
