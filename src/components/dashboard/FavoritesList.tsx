"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getIcon } from "@/lib/icon-map";
import { formatDate } from "@/lib/utils";
import ItemDrawer from "@/components/dashboard/ItemDrawer";
import type { ItemWithDetails } from "@/lib/db/items";
import type { FavoriteCollection } from "@/lib/db/collections";

interface FavoritesListProps {
  items: ItemWithDetails[];
  collections: FavoriteCollection[];
}

export default function FavoritesList({
  items,
  collections,
}: FavoritesListProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {/* Items Section */}
      {items.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
            Items ({items.length})
          </h2>
          <div className="border border-border rounded-md divide-y divide-border">
            {items.map((item) => {
              const Icon = getIcon(item.type.icon);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <Icon
                    className="h-4 w-4 shrink-0"
                    style={item.type.color ? { color: item.type.color } : undefined}
                  />
                  <span className="flex-1 min-w-0 truncate text-sm font-mono">
                    {item.title}
                  </span>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {item.type.name}
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    {formatDate(item.createdAt)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Collections Section */}
      {collections.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
            Collections ({collections.length})
          </h2>
          <div className="border border-border rounded-md divide-y divide-border">
            {collections.map((col) => (
              <Link
                key={col.id}
                href={`/dashboard/collections/${col.id}`}
                className="flex items-center gap-3 px-3 py-2 hover:bg-accent/50 transition-colors"
              >
                <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 min-w-0 truncate text-sm font-mono">
                  {col.name}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {col.itemCount} {col.itemCount === 1 ? "item" : "items"}
                </span>
                <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  {formatDate(col.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ItemDrawer
        itemId={selectedItemId}
        onClose={() => setSelectedItemId(null)}
      />
    </div>
  );
}
