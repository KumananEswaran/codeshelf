"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const FREE_FEATURES = [
  { text: "50 items", included: true },
  { text: "3 collections", included: true },
  { text: "Basic search", included: true },
  { text: "Image uploads", included: true },
  { text: "File uploads", included: false },
  { text: "AI features", included: false },
  { text: "Custom item types", included: false },
  { text: "Export", included: false },
];

const PRO_FEATURES = [
  "Unlimited items",
  "Unlimited collections",
  "Full-text search",
  "File uploads",
  "AI auto-tag, summarize, explain",
  "Custom item types",
  "Export (JSON / ZIP)",
];

export default function UpgradePricing() {
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleUpgrade() {
    setLoading(true);
    try {
      const priceId = isYearly
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY;

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      if (data.url) {
        router.push(data.url);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Toggle */}
      <div className="flex items-center justify-center mb-10">
        <div className="inline-flex items-center bg-muted rounded-full p-1 gap-1">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
              !isYearly
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
              isYearly
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Yearly
            <span className="px-2 py-0.5 bg-green-500/15 text-green-500 text-xs font-semibold rounded-full">
              Save 25%
            </span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[720px] mx-auto">
        {/* Free - current plan */}
        <div className="bg-card border border-border rounded-xl p-8 h-full relative flex flex-col">
          <span className="absolute -top-3 left-6 px-3 py-0.5 bg-muted text-muted-foreground text-xs font-medium rounded-full">
            Current Plan
          </span>
          <h3 className="text-xl font-bold mb-4">Free</h3>
          <div className="flex items-baseline gap-1 mb-7">
            <span className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none">
              RM0
            </span>
            <span className="text-base text-muted-foreground">forever</span>
          </div>
          <ul className="flex flex-col gap-3 mb-8 flex-1">
            {FREE_FEATURES.map((f) => (
              <li
                key={f.text}
                className={`flex items-center gap-2.5 text-sm ${
                  f.included ? "" : "text-muted-foreground"
                }`}
              >
                {f.included ? (
                  <Check
                    className="size-4 text-green-500 shrink-0"
                    strokeWidth={2.5}
                  />
                ) : (
                  <X
                    className="size-4 text-muted-foreground/50 shrink-0"
                    strokeWidth={2}
                  />
                )}
                {f.text}
              </li>
            ))}
          </ul>
          <div
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full pointer-events-none opacity-50"
            )}
          >
            Current Plan
          </div>
        </div>

        {/* Pro */}
        <div className="bg-card border border-blue-500 rounded-xl p-8 relative shadow-[0_0_40px_rgba(59,130,246,0.08)] h-full flex flex-col">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-full">
            Recommended
          </span>
          <h3 className="text-xl font-bold mb-4">Pro</h3>
          <div className="flex items-baseline gap-1 mb-7">
            <span className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none">
              {isYearly ? "RM21" : "RM29"}
            </span>
            <span className="text-base text-muted-foreground">
              {isYearly ? "/mo, billed yearly" : "/month"}
            </span>
          </div>
          {isYearly && (
            <p className="text-sm text-muted-foreground -mt-5 mb-7">
              RM252/year (save RM96)
            </p>
          )}
          <ul className="flex flex-col gap-3 mb-8 flex-1">
            {PRO_FEATURES.map((text) => (
              <li
                key={text}
                className="flex items-center gap-2.5 text-sm"
              >
                <Check
                  className="size-4 text-green-500 shrink-0"
                  strokeWidth={2.5}
                />
                {text}
              </li>
            ))}
          </ul>
          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
          >
            {loading ? (
              "Redirecting..."
            ) : (
              <>
                <Zap className="size-4 mr-1.5" />
                Upgrade to Pro — {isYearly ? "RM252/yr" : "RM29/mo"}
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
