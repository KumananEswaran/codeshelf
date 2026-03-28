"use client";

import { useState } from "react";
import ItemCard from "@/components/dashboard/ItemCard";
import ImageCard from "@/components/dashboard/ImageCard";
import ItemDrawer from "@/components/dashboard/ItemDrawer";
import type { ItemWithDetails } from "@/lib/db/items";

interface ItemsListWithDrawerProps {
  items: ItemWithDetails[];
}

export default function ItemsListWithDrawer({
  items,
}: ItemsListWithDrawerProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const isImageGrid = items.length > 0 && items[0].type.name === "image";

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) =>
          isImageGrid ? (
            <ImageCard
              key={item.id}
              item={item}
              onClick={() => setSelectedItemId(item.id)}
            />
          ) : (
            <ItemCard
              key={item.id}
              item={item}
              onClick={() => setSelectedItemId(item.id)}
            />
          )
        )}
      </div>
      <ItemDrawer
        itemId={selectedItemId}
        onClose={() => setSelectedItemId(null)}
      />
    </>
  );
}
