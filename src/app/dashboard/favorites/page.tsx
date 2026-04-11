import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { auth } from "@/auth";
import { getFavoriteItems } from "@/lib/db/items";
import { getFavoriteCollections } from "@/lib/db/collections";
import FavoritesList from "@/components/dashboard/FavoritesList";

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [{ items }, collections] = await Promise.all([
    getFavoriteItems(session.user.id, 1, 100),
    getFavoriteCollections(session.user.id),
  ]);

  const hasAny = items.length > 0 || collections.length > 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
        <h1 className="text-2xl font-bold">Favorites</h1>
      </div>

      {!hasAny ? (
        <div className="text-center py-16 text-muted-foreground">
          <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No favorites yet</p>
          <p className="text-sm mt-1">
            Star items and collections to see them here
          </p>
        </div>
      ) : (
        <FavoritesList
          items={items}
          collections={collections}
          isPro={session.user.isPro ?? false}
        />
      )}
    </div>
  );
}
