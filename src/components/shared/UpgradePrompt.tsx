"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UpgradePromptProps {
  feature: string;
}

export default function UpgradePrompt({ feature }: UpgradePromptProps) {
  return (
    <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-6 text-center">
      <Crown className="h-8 w-8 text-blue-500 mx-auto mb-3" />
      <h3 className="text-lg font-semibold mb-2">Upgrade to Pro</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Upgrade your plan to {feature}.
      </p>
      <Link
        href="/settings"
        className={cn(
          buttonVariants(),
          "bg-blue-600 hover:bg-blue-700 text-white"
        )}
      >
        Upgrade Now
      </Link>
    </div>
  );
}
