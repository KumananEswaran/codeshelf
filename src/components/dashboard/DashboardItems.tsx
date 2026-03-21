"use client";

import { useState } from "react";
import PinnedItems from "@/components/dashboard/PinnedItems";
import RecentItems from "@/components/dashboard/RecentItems";
import ItemDrawer from "@/components/dashboard/ItemDrawer";
import type { ItemWithDetails } from "@/lib/db/items";

interface DashboardItemsProps {
  pinnedItems: ItemWithDetails[];
  recentItems: ItemWithDetails[];
}

export default function DashboardItems({
  pinnedItems,
  recentItems,
}: DashboardItemsProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  return (
    <>
      <PinnedItems
        items={pinnedItems}
        onItemClick={(id) => setSelectedItemId(id)}
      />
      <RecentItems
        items={recentItems}
        onItemClick={(id) => setSelectedItemId(id)}
      />
      <ItemDrawer
        itemId={selectedItemId}
        onClose={() => setSelectedItemId(null)}
      />
    </>
  );
}
