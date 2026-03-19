import Link from "next/link";
import { Star, MoreHorizontal } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Collection {
  id: string;
  name: string;
  description?: string;
  itemCount: number;
  isFavorite: boolean;
}

interface CollectionsGridProps {
  collections: Collection[];
}

export default function CollectionsGrid({ collections }: CollectionsGridProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Collections</h2>
        <Link
          href="/collections"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((col) => (
          <Link key={col.id} href={`/collections/${col.id}`}>
            <Card className="hover:ring-foreground/20 transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="truncate">{col.name}</CardTitle>
                  {col.isFavorite && (
                    <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-500 text-yellow-500" />
                  )}
                  <span className="ml-auto text-muted-foreground hover:text-foreground shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
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
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
