"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toggleCollectionFavorite } from "@/actions/collections";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getIcon } from "@/lib/icon-map";
import type { CollectionWithTypes } from "@/lib/db/collections";
import CollectionCardMenu from "./CollectionCardMenu";

interface CollectionCardProps {
  collection: CollectionWithTypes;
}

export default function CollectionCard({ collection: col }: CollectionCardProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLSpanElement>(null);
  const [isFavorite, setIsFavorite] = useState(col.isFavorite);

  useEffect(() => {
    setIsFavorite(col.isFavorite);
  }, [col.isFavorite]);

  async function handleToggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    const result = await toggleCollectionFavorite(col.id);

    if (!result.success) {
      setIsFavorite(isFavorite);
      toast.error("Failed to toggle favorite");
      return;
    }
    router.refresh();
  }

  function handleCardClick(e: React.MouseEvent) {
    // Skip if click was on the menu trigger area
    if (menuRef.current?.contains(e.target as Node)) return;
    // Skip if click came from a portal (dropdown/dialog)
    if (!e.currentTarget.contains(e.target as Node)) return;
    router.push(`/dashboard/collections/${col.id}`);
  }

  return (
    <Card
      className="hover:ring-foreground/20 transition-all cursor-pointer h-full group"
      style={
        col.dominantColor
          ? { borderTopColor: col.dominantColor, borderTopWidth: "2px" }
          : undefined
      }
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="truncate">{col.name}</CardTitle>
          <button
            onClick={handleToggleFavorite}
            className={`shrink-0 hover:scale-110 transition-transform ${
              isFavorite ? "text-yellow-500" : "text-muted-foreground opacity-0 group-hover:opacity-100"
            }`}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className={`h-3.5 w-3.5 ${isFavorite ? "fill-yellow-500" : ""}`} />
          </button>
          <span ref={menuRef} className="ml-auto shrink-0">
            <CollectionCardMenu collection={col} />
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {col.itemCount} items
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {col.description}
        </p>
        {col.typeIcons.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3">
            {col.typeIcons.map((t, i) => {
              const IconComponent = getIcon(t.icon);
              return (
                <IconComponent
                  key={t.icon ?? i}
                  className="h-3.5 w-3.5"
                  style={{ color: t.color ?? undefined }}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
