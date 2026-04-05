import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import UpgradePricing from "@/components/upgrade/UpgradePricing";

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[900px] mx-auto px-6 py-12">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium mb-4">
            <Sparkles className="size-3.5" />
            Upgrade to Pro
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Unlock the full power of{" "}
            <span className="text-blue-500">CodeShelf</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-[500px] mx-auto">
            Unlimited items, AI features, file uploads, and more.
          </p>
        </div>

        <UpgradePricing />
      </div>
    </div>
  );
}
