import { Button } from "~/components/ui/button";
import { env } from "~/env";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "stripe-pricing-table": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

export default function PricingPage() {
  const publishableKey = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const pricingTableId = env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID;

  return (
    <div className="bg-background flex min-h-screen flex-col items-center gap-4 px-4 py-16">
      <script async src="https://js.stripe.com/v3/pricing-table.js"></script>

      <div className="mb-12 text-center">
        <h1 className="text-foreground text-4xl font-bold tracking-tight">
          Pricing
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Choose the plan that works best for you
        </p>
      </div>

      <div className="w-full max-w-5xl">
        <stripe-pricing-table
          pricing-table-id={pricingTableId}
          publishable-key={publishableKey}
          client-reference-id="user_1234"
        ></stripe-pricing-table>
      </div>
      <form
        action={"/api/products/starter-d1cb1df/create-checkout-session"}
        method="POST"
        className="text-center"
      >
        <input
          type="hidden"
          id="lookup_key"
          name="lookup_key"
          value="starter_monthly"
        />
        <Button id="checkout-and-portal-button" type="submit">
          Suscribe to Starter Plan
        </Button>
      </form>
    </div>
  );
}
