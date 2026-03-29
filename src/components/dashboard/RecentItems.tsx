import { Clock } from "lucide-react";
import ItemCard from "@/components/dashboard/ItemCard";
import type { ItemWithDetails } from "@/lib/db/items";

interface RecentItemsProps {
  items: ItemWithDetails[];
  onItemClick?: (id: string) => void;
}

export default function RecentItems({ items, onItemClick }: RecentItemsProps) {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Recent Items</h2>
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
