"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { FREE_LIMITS } from "@/lib/subscription";

interface BillingSectionProps {
  isPro: boolean;
  hasStripeCustomer: boolean;
  itemCount: number;
  collectionCount: number;
}

export default function BillingSection({
  isPro,
  hasStripeCustomer,
  itemCount,
  collectionCount,
}: BillingSectionProps) {
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingYearly, setLoadingYearly] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  async function handleCheckout(priceId: string, yearly: boolean) {
    const setLoading = yearly ? setLoadingYearly : setLoadingMonthly;
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  async function handlePortal() {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoadingPortal(false);
      }
    } catch {
      setLoadingPortal(false);
    }
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Billing</h2>
      <div className="rounded-lg border border-border p-6 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Billing</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your subscription and billing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Current plan:</span>
          <Badge variant={isPro ? "default" : "secondary"}>
            {isPro ? "Pro" : "Free"}
          </Badge>
        </div>

        {isPro ? (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Unlimited items and collections.
            </p>
            {hasStripeCustomer && (
              <Button
                variant="outline"
                onClick={handlePortal}
                disabled={loadingPortal}
              >
                {loadingPortal && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Manage Subscription
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">
                {itemCount}/{FREE_LIMITS.MAX_ITEMS} items
              </p>
              <p className="text-muted-foreground">
                {collectionCount}/{FREE_LIMITS.MAX_COLLECTIONS} collections
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  handleCheckout(
                    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY!,
                    false
                  )
                }
                disabled={loadingMonthly || loadingYearly}
              >
                {loadingMonthly && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Upgrade RM29/mo
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  handleCheckout(
                    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY!,
                    true
                  )
                }
                disabled={loadingMonthly || loadingYearly}
              >
                {loadingYearly && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Upgrade RM252/yr (save 25%)
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
