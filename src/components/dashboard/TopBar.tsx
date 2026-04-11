"use client";

import Link from "next/link";
import { Search, Star, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import NewItemDialog from "@/components/dashboard/NewItemDialog";
import NewCollectionDialog from "@/components/dashboard/NewCollectionDialog";

interface TopBarProps {
  onSearchClick?: () => void;
  isPro?: boolean;
}

export default function TopBar({ onSearchClick, isPro = false }: TopBarProps) {
  return (
    <div className="flex items-center justify-between flex-1 min-w-0">
      {/* Full search bar on sm+, icon-only on mobile */}
      <button
        type="button"
        onClick={onSearchClick}
        className="relative max-w-sm w-full hidden sm:flex items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span>Search items...</span>
        <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </button>
      <button
        type="button"
        onClick={onSearchClick}
        className="sm:hidden inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
        aria-label="Search items"
      >
        <Search className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-2">
        {!isPro && (
          <Link
            href="/dashboard/upgrade"
            className={buttonVariants({ variant: "ghost", className: "text-muted-foreground hover:text-blue-400 gap-1.5 text-sm" })}
          >
            <Zap className="size-3.5" />
            <span className="hidden sm:inline">Upgrade</span>
          </Link>
        )}
        <Link
          href="/dashboard/favorites"
          className={buttonVariants({ variant: "ghost", size: "icon", className: "text-muted-foreground hover:text-yellow-500" })}
        >
          <Star className="h-4 w-4" />
          <span className="sr-only">Favorites</span>
        </Link>
        <NewCollectionDialog />
        <NewItemDialog isPro={isPro} />
      </div>
    </div>
  );
}
