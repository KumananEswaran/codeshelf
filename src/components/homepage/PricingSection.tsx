"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ScrollFadeIn } from "./ScrollFadeIn";

const FREE_FEATURES = [
  { text: "50 items", included: true },
  { text: "3 collections", included: true },
  { text: "Basic search", included: true },
  { text: "Image uploads", included: true },
  { text: "File uploads", included: false },
  { text: "AI features", included: false },
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

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-30">
      <div className="max-w-[1200px] mx-auto px-6">
        <ScrollFadeIn className="text-center">
          <h2 className="text-[clamp(2rem,5vw,3rem)] font-extrabold leading-[1.15] tracking-[-0.02em] mb-4">
            Simple, Developer-Friendly<br />
            <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-lg text-[#71717a] max-w-[540px] mx-auto mb-10">
            Start free. Upgrade when you need more power.
          </p>
        </ScrollFadeIn>

        {/* Toggle */}
        <ScrollFadeIn className="flex items-center justify-center mb-12">
          <div className="inline-flex items-center bg-[#1e1e2e] rounded-full p-1 gap-1">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-1.5 rounded-full text-[0.875rem] font-medium transition-all ${
                !isYearly
                  ? "bg-[#e4e4e7] text-[#0a0a0f]"
                  : "text-[#71717a] hover:text-[#e4e4e7]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-1.5 rounded-full text-[0.875rem] font-medium transition-all flex items-center gap-2 ${
                isYearly
                  ? "bg-[#e4e4e7] text-[#0a0a0f]"
                  : "text-[#71717a] hover:text-[#e4e4e7]"
              }`}
            >
              Yearly
              <span className="px-2 py-0.5 bg-[#22c55e]/15 text-[#22c55e] text-xs font-semibold rounded-full">
                Save 25%
              </span>
            </button>
          </div>
        </ScrollFadeIn>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[720px] mx-auto">
          {/* Free */}
          <ScrollFadeIn>
            <div className="bg-[#16161f] border border-[#1e1e2e] rounded-xl p-9 h-full">
              <h3 className="text-xl font-bold mb-4">Free</h3>
              <div className="flex items-baseline gap-1 mb-7">
                <span className="text-5xl font-extrabold tracking-tight leading-none max-sm:text-[2.5rem]">RM0</span>
                <span className="text-base text-[#71717a]">forever</span>
              </div>
              <ul className="flex flex-col gap-3.5 mb-8">
                {FREE_FEATURES.map((f) => (
                  <li key={f.text} className={`flex items-center gap-2.5 text-[0.9375rem] ${f.included ? "" : "text-[#52525b]"}`}>
                    {f.included ? (
                      <Check className="size-[18px] text-[#22c55e] shrink-0" strokeWidth={2.5} />
                    ) : (
                      <X className="size-[18px] text-[#475569] shrink-0" strokeWidth={2} />
                    )}
                    {f.text}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full border-[#2a2a3a] bg-transparent text-[#e4e4e7] hover:bg-[#16161f] hover:border-[#52525b]"
                )}
              >
                Get Started
              </Link>
            </div>
          </ScrollFadeIn>

          {/* Pro */}
          <ScrollFadeIn>
            <div className="bg-[#16161f] border border-[#3b82f6] rounded-xl p-9 relative shadow-[0_0_40px_rgba(59,130,246,0.1)] h-full">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#3b82f6] text-white text-xs font-bold uppercase tracking-wider rounded-full">
                Most Popular
              </span>
              <h3 className="text-xl font-bold mb-4">Pro</h3>
              <div className="flex items-baseline gap-1 mb-7">
                <span className="text-5xl font-extrabold tracking-tight leading-none max-sm:text-[2.5rem]">
                  {isYearly ? "RM21" : "RM29"}
                </span>
                <span className="text-base text-[#71717a]">
                  {isYearly ? "/mo, billed yearly" : "/month"}
                </span>
              </div>
              <ul className="flex flex-col gap-3.5 mb-8">
                {PRO_FEATURES.map((text) => (
                  <li key={text} className="flex items-center gap-2.5 text-[0.9375rem]">
                    <Check className="size-[18px] text-[#22c55e] shrink-0" strokeWidth={2.5} />
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={cn(
                  buttonVariants(),
                  "w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white"
                )}
              >
                Upgrade to Pro
              </Link>
            </div>
          </ScrollFadeIn>
        </div>
      </div>
    </section>
  );
}
