import { Pin } from "lucide-react";
import ItemCard from "@/components/dashboard/ItemCard";
import type { ItemWithDetails } from "@/lib/db/items";

interface PinnedItemsProps {
  items: ItemWithDetails[];
  onItemClick?: (id: string) => void;
}

export default function PinnedItems({ items, onItemClick }: PinnedItemsProps) {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Pin className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Pinned</h2>
      </div>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onClick={() => onItemClick?.(item.id)}
          />
        ))}
      </div>
    </section>
  );
}
