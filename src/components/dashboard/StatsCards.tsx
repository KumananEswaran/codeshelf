import {
  Library,
  FolderOpen,
  Star,
  Heart,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  totalItems: number;
  totalCollections: number;
  favoriteItems: number;
  favoriteCollections: number;
}

const stats = [
  { key: "items", label: "Total Items", icon: Library, color: "text-blue-400" },
  { key: "collections", label: "Collections", icon: FolderOpen, color: "text-green-400" },
  { key: "favItems", label: "Favorite Items", icon: Star, color: "text-yellow-400" },
  { key: "favCollections", label: "Favorite Collections", icon: Heart, color: "text-pink-400" },
] as const;

export default function StatsCards({
  totalItems,
  totalCollections,
  favoriteItems,
  favoriteCollections,
}: StatsCardsProps) {
  const values: Record<string, number> = {
    items: totalItems,
    collections: totalCollections,
    favItems: favoriteItems,
    favCollections: favoriteCollections,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.key} size="sm">
          <CardContent className="flex items-center gap-3">
            <div className={`rounded-md bg-muted p-2 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{values[stat.key]}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
