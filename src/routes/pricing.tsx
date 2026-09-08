import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button, Card } from "@/components/ui/primitives";
import { pricingPlans } from "@/data/mock";

export const Route = createFileRoute("/pricing")({ component: PricingPage });

function PricingPage() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3.5 py-1.5 text-xs font-semibold text-primary-deep">
            <Sparkles className="h-3.5 w-3.5" /> Simple plans for every conversation
          </span>
          <h1 className="mt-5 text-3xl font-bold sm:text-4xl">Choose how you use MindLink</h1>
          <p className="mt-3 text-muted-foreground">Start for free, then go deeper when you are ready.</p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col p-6 ${plan.highlighted ? "border-primary shadow-lift" : ""}`}
            >
              {plan.highlighted ? (
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              ) : null}
              <h2 className="text-xl font-bold">{plan.name}</h2>
              <p className="mt-2 min-h-10 text-sm text-muted-foreground">{plan.blurb}</p>
              <p className="mt-6 text-4xl font-bold">
                {plan.price}
                <span className="text-sm font-medium text-muted-foreground">
                  {plan.price === "$0" ? "" : " / month"}
                </span>
              </p>
              <ul className="mt-7 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm">
                    <Check className="h-4 w-4 shrink-0 text-success" /> {feature}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="mt-8">
                <Button variant={plan.highlighted ? "primary" : "outline"} className="w-full">
                  {plan.cta}
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
