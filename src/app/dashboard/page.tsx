import { redirect } from "next/navigation";
import {
  getRecentCollections,
  getCollectionStats,
} from "@/lib/db/collections";
import {
  getPinnedItems,
  getRecentItems,
  getItemStats,
} from "@/lib/db/items";
import StatsCards from "@/components/dashboard/StatsCards";
import CollectionsGrid from "@/components/dashboard/CollectionsGrid";
import DashboardItems from "@/components/dashboard/DashboardItems";
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  const [recentCollections, collectionStats, pinnedItems, recentItems, itemStats] =
    await Promise.all([
      getRecentCollections(userId, 6),
      getCollectionStats(userId),
      getPinnedItems(userId),
      getRecentItems(userId, 10),
      getItemStats(userId),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your developer knowledge hub</p>
      </div>

      <StatsCards
        totalItems={itemStats.totalItems}
        totalCollections={collectionStats.totalCollections}
        favoriteItems={itemStats.favoriteItems}
        favoriteCollections={collectionStats.favoriteCollections}
      />

      <CollectionsGrid collections={recentCollections} />

      <DashboardItems pinnedItems={pinnedItems} recentItems={recentItems} />
    </div>
  );
}
