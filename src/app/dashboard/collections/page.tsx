import { redirect } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { auth } from "@/auth";
import { getAllCollections } from "@/lib/db/collections";
import { COLLECTIONS_PER_PAGE } from "@/lib/constants";
import CollectionsGrid from "@/components/dashboard/CollectionsGrid";
import NewCollectionDialog from "@/components/dashboard/NewCollectionDialog";
import Pagination from "@/components/ui/pagination";

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const { collections, totalCount, totalPages } = await getAllCollections(
    session.user.id,
    page,
    COLLECTIONS_PER_PAGE
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <FolderOpen className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Collections</h1>
        <span className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? "collection" : "collections"}
        </span>
        <div className="ml-auto">
          <NewCollectionDialog />
        </div>
      </div>

      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 text-muted-foreground">
          <FolderOpen className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium mb-1">No collections yet</p>
          <p className="text-sm">Click &ldquo;New Collection&rdquo; to group related items together.</p>
        </div>
      ) : (
        <>
          <CollectionsGrid collections={collections} showHeader={false} />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/dashboard/collections"
          />
        </>
      )}
    </div>
  );
}
