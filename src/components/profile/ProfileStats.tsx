import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getIcon } from "@/lib/icon-map";
import type { ProfileStats } from "@/lib/db/profile";

interface ProfileStatsProps {
  stats: ProfileStats;
}

export default function ProfileStatsSection({ stats }: ProfileStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Usage Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-bold">{stats.totalItems}</p>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-bold">{stats.totalCollections}</p>
            <p className="text-xs text-muted-foreground">Collections</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Items by Type</p>
          <div className="space-y-1.5">
            {stats.itemsByType.map((type) => {
              const Icon = getIcon(type.icon);
              return (
                <div
                  key={type.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className="h-4 w-4"
                      style={{ color: type.color ?? undefined }}
                    />
                    <span className="capitalize">{type.name}s</span>
                  </div>
                  <span className="text-muted-foreground">{type.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
