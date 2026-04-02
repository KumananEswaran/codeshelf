"use client";

import { Search } from "lucide-react";
import NewItemDialog from "@/components/dashboard/NewItemDialog";
import NewCollectionDialog from "@/components/dashboard/NewCollectionDialog";

interface TopBarProps {
  onSearchClick?: () => void;
}

export default function TopBar({ onSearchClick }: TopBarProps) {
  return (
    <div className="flex items-center justify-between flex-1 min-w-0">
      <button
        type="button"
        onClick={onSearchClick}
        className="relative max-w-sm w-full flex items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span>Search items...</span>
        <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </button>
      <div className="flex items-center gap-2">
        <NewCollectionDialog />
        <NewItemDialog />
      </div>
    </div>
  );
}
