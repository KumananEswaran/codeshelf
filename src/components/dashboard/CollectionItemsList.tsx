"use client";

import { useMemo, useState } from "react";
import { Image, File } from "lucide-react";
import ItemCard from "@/components/dashboard/ItemCard";
import ImageCard from "@/components/dashboard/ImageCard";
import FileListItem from "@/components/dashboard/FileListItem";
import ItemDrawer from "@/components/dashboard/ItemDrawer";
import type { ItemWithDetails } from "@/lib/db/items";

interface CollectionItemsListProps {
  items: ItemWithDetails[];
  isPro?: boolean;
}

export default function CollectionItemsList({
  items,
  isPro = false,
}: CollectionItemsListProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const { general, images, files } = useMemo(() => {
    const general: ItemWithDetails[] = [];
    const images: ItemWithDetails[] = [];
    const files: ItemWithDetails[] = [];

    for (const item of items) {
      if (item.type.name === "image") images.push(item);
      else if (item.type.name === "file") files.push(item);
      else general.push(item);
    }

    return { general, images, files };
  }, [items]);

  return (
    <>
      {general.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {general.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onClick={() => setSelectedItemId(item.id)}
            />
          ))}
        </div>
      )}

      {images.length > 0 && (
        <section className={general.length > 0 ? "mt-8" : ""}>
          <div className="flex items-center gap-2 mb-4">
            <Image className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Images</h2>
            <span className="text-sm text-muted-foreground">
              {images.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {images.map((item) => (
              <ImageCard
                key={item.id}
                item={item}
                onClick={() => setSelectedItemId(item.id)}
              />
            ))}
          </div>
        </section>
      )}

      {files.length > 0 && (
        <section className={general.length > 0 || images.length > 0 ? "mt-8" : ""}>
          <div className="flex items-center gap-2 mb-4">
            <File className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Files</h2>
            <span className="text-sm text-muted-foreground">
              {files.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {files.map((item) => (
              <FileListItem
                key={item.id}
                item={item}
                onClick={() => setSelectedItemId(item.id)}
              />
            ))}
          </div>
        </section>
      )}

      <ItemDrawer
        itemId={selectedItemId}
        onClose={() => setSelectedItemId(null)}
        isPro={isPro}
      />
    </>
  );
}
