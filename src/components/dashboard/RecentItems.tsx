import { Clock, Star, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface RecentItem {
  id: string;
  title: string;
  description?: string;
  typeName: string;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: string;
}

interface RecentItemsProps {
  items: RecentItem[];
}

const TYPE_ICONS: Record<string, string> = {
  Snippet: "</>",
  Prompt: "\u{1F916}",
  Command: ">_",
  Note: "\u{1F4DD}",
  File: "\u{1F4C4}",
  Image: "\u{1F5BC}\u{FE0F}",
  URL: "\u{1F517}",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function RecentItems({ items }: RecentItemsProps) {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Recent Items</h2>
      </div>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <Card key={item.id} className="hover:ring-foreground/20 transition-all cursor-pointer">
            <CardContent className="flex items-center gap-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted shrink-0">
                <span className="text-sm">{TYPE_ICONS[item.typeName] ?? item.typeName[0]}</span>
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
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDate(item.createdAt)}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
