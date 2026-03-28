import { Pin, Star, ImageOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ItemWithDetails } from "@/lib/db/items";

interface ImageCardProps {
  item: ItemWithDetails;
  onClick?: () => void;
}

export default function ImageCard({ item, onClick }: ImageCardProps) {
  return (
    <Card
      className="overflow-hidden hover:ring-foreground/20 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="aspect-video overflow-hidden bg-muted">
        {item.fileUrl ? (
          <img
            src={item.fileUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate flex-1">{item.title}</p>
          {item.isFavorite && (
            <Star className="h-3 w-3 shrink-0 fill-yellow-500 text-yellow-500" />
          )}
          {item.isPinned && (
            <Pin className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
        </div>
      </div>
    </Card>
  );
}
