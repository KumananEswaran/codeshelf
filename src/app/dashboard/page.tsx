import {
  mockItems,
  mockCollections,
  mockItemTypeCounts,
} from "@/lib/mock-data";
import StatsCards from "@/components/dashboard/StatsCards";
import CollectionsGrid from "@/components/dashboard/CollectionsGrid";
import PinnedItems from "@/components/dashboard/PinnedItems";
import RecentItems from "@/components/dashboard/RecentItems";

export default function DashboardPage() {
  const totalItems = Object.values(mockItemTypeCounts).reduce(
    (sum, count) => sum + count,
    0
  );
  const totalCollections = mockCollections.length;
  const favoriteItems = mockItems.filter((item) => item.isFavorite).length;
  const favoriteCollections = mockCollections.filter(
    (col) => col.isFavorite
  ).length;

  const pinnedItems = mockItems.filter((item) => item.isPinned);
  const recentItems = [...mockItems]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 10);

  const recentCollections = mockCollections.slice(0, 6);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your developer knowledge hub</p>
      </div>

      <StatsCards
        totalItems={totalItems}
        totalCollections={totalCollections}
        favoriteItems={favoriteItems}
        favoriteCollections={favoriteCollections}
      />

      <CollectionsGrid collections={recentCollections} />

      <PinnedItems items={pinnedItems} />

      <RecentItems items={recentItems} />
    </div>
  );
}
