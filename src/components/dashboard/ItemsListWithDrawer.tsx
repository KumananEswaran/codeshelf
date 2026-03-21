"use client";

import { useState } from "react";
import ItemCard from "@/components/dashboard/ItemCard";
import ItemDrawer from "@/components/dashboard/ItemDrawer";
import type { ItemWithDetails } from "@/lib/db/items";

interface ItemsListWithDrawerProps {
  items: ItemWithDetails[];
}

export default function ItemsListWithDrawer({
  items,
}: ItemsListWithDrawerProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onClick={() => setSelectedItemId(item.id)}
          />
        ))}
      </div>
      <ItemDrawer
        itemId={selectedItemId}
        onClose={() => setSelectedItemId(null)}
      />
    </>
  );
}
