"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getIcon } from "@/lib/icon-map";
import { formatDate } from "@/lib/utils";
import ItemDrawer from "@/components/dashboard/ItemDrawer";
import type { ItemWithDetails } from "@/lib/db/items";
import type { FavoriteCollection } from "@/lib/db/collections";

type ItemSort = "Newest" | "Oldest" | "Name A-Z" | "Name Z-A" | "Type";
type CollectionSort = "Newest" | "Oldest" | "Name A-Z" | "Name Z-A";

interface FavoritesListProps {
  items: ItemWithDetails[];
  collections: FavoriteCollection[];
}

function sortItems(items: ItemWithDetails[], sort: ItemSort) {
  return [...items].sort((a, b) => {
    switch (sort) {
      case "Newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "Oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "Name A-Z":
        return a.title.localeCompare(b.title);
      case "Name Z-A":
        return b.title.localeCompare(a.title);
      case "Type":
        return a.type.name.localeCompare(b.type.name) || a.title.localeCompare(b.title);
    }
  });
}

function sortCollections(collections: FavoriteCollection[], sort: CollectionSort) {
  return [...collections].sort((a, b) => {
    switch (sort) {
      case "Newest":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case "Oldest":
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      case "Name A-Z":
        return a.name.localeCompare(b.name);
      case "Name Z-A":
        return b.name.localeCompare(a.name);
    }
  });
}

export default function FavoritesList({
  items,
  collections,
}: FavoritesListProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [itemSort, setItemSort] = useState<ItemSort>("Newest");
  const [collectionSort, setCollectionSort] = useState<CollectionSort>("Newest");

  const sortedItems = useMemo(() => sortItems(items, itemSort), [items, itemSort]);
  const sortedCollections = useMemo(() => sortCollections(collections, collectionSort), [collections, collectionSort]);

  return (
    <div className="space-y-8">
      {/* Items Section */}
      {items.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Items ({items.length})
            </h2>
            <Select value={itemSort} onValueChange={(v) => setItemSort(v as ItemSort)}>
              <SelectTrigger className="w-35 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Newest">Newest</SelectItem>
                <SelectItem value="Oldest">Oldest</SelectItem>
                <SelectItem value="Name A-Z">Name A-Z</SelectItem>
                <SelectItem value="Name Z-A">Name Z-A</SelectItem>
                <SelectItem value="Type">Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="border border-border rounded-md divide-y divide-border">
            {sortedItems.map((item) => {
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
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Collections ({collections.length})
            </h2>
            <Select value={collectionSort} onValueChange={(v) => setCollectionSort(v as CollectionSort)}>
              <SelectTrigger className="w-35 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Newest">Newest</SelectItem>
                <SelectItem value="Oldest">Oldest</SelectItem>
                <SelectItem value="Name A-Z">Name A-Z</SelectItem>
                <SelectItem value="Name Z-A">Name Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="border border-border rounded-md divide-y divide-border">
            {sortedCollections.map((col) => (
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
