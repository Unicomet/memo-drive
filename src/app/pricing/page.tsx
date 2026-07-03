import { Check } from "lucide-react";
import { Button } from "~/components/ui/button";
import { createCheckoutSession } from "~/server/subscriptions/actions/actions";

const subscriptionTiers = [
  {
    name: "Starter",
    description: "Perfect for getting started",
    price: 12,
    subscriptionType: "starter_monthly",
    features: ["Extended usage", "Faster processing", "Spaces"],
  },
  {
    name: "Pro",
    description: "For power users who need more",
    price: 20,
    subscriptionType: "pro_monthly",
    features: ["Unlimited usage", "No rate limits", "Unlimited spaces"],
    highlighted: true,
  },
];

export default function PricingPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center gap-4 px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-foreground text-4xl font-bold tracking-tight">
          Pricing
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Choose the plan that works best for you
        </p>
      </div>

      <div className="grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        {subscriptionTiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative flex flex-col rounded-2xl border p-8 shadow-sm ${
              tier.highlighted
                ? "border-primary bg-primary/5 ring-primary ring-2"
                : "border-border bg-card"
            }`}
          >
            {tier.highlighted && (
              <span className="bg-primary text-primary-foreground absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-sm font-medium">
                Popular
              </span>
            )}

            <div className="mb-6">
              <h2 className="text-foreground text-2xl font-bold">
                {tier.name}
              </h2>
              <p className="text-muted-foreground mt-2">{tier.description}</p>
              <div className="mt-4">
                <span className="text-foreground text-4xl font-bold">
                  ${tier.price}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>

            <ul className="mb-8 flex-1 space-y-4">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <Check className="text-primary h-5 w-5 flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <form action={createCheckoutSession}>
              <input
                type="hidden"
                name="subscription_type"
                value={tier.subscriptionType}
              />
              <Button
                type="submit"
                className="w-full"
                variant={tier.highlighted ? "default" : "outline"}
              >
                Subscribe to {tier.name}
              </Button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
