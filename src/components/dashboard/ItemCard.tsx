import { Pin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import CopyButton from "@/components/dashboard/CopyButton";
import { getIcon } from "@/lib/icon-map";
import { formatDate } from "@/lib/utils";
import type { ItemWithDetails } from "@/lib/db/items";

interface ItemCardProps {
  item: ItemWithDetails;
  onClick?: () => void;
}

export default function ItemCard({ item, onClick }: ItemCardProps) {
  return (
    <Card
      className="hover:ring-foreground/20 transition-all cursor-pointer group relative"
      onClick={onClick}
      style={
        item.type.color
          ? { borderLeftColor: item.type.color, borderLeftWidth: 3 }
          : undefined
      }
    >
      <CardContent className="flex items-center gap-4">
        <div
          className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted shrink-0"
          style={item.type.color ? { color: item.type.color } : undefined}
        >
          {(() => {
            const IconComponent = getIcon(item.type.icon);
            return <IconComponent className="h-5 w-5" />;
          })()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{item.title}</p>
            {item.isFavorite && (
              <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-500 text-yellow-500" />
            )}
            {item.isPinned && (
              <Pin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {item.description}
          </p>
          {item.tags.length > 0 && (
            <div className="flex gap-1.5 mt-1.5">
              {item.tags.map((tag) => (
                <Badge
                  key={tag.name}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatDate(item.createdAt)}
        </span>
      </CardContent>
      <CopyButton item={item} className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100" />
    </Card>
  );
}
