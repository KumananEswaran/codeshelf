import { redirect, notFound } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { auth } from "@/auth";
import { getCollectionById, getCollectionItems } from "@/lib/db/collections";
import { COLLECTIONS_PER_PAGE } from "@/lib/constants";
import CollectionItemsList from "@/components/dashboard/CollectionItemsList";
import CollectionActions from "@/components/dashboard/CollectionActions";
import Pagination from "@/components/ui/pagination";

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [collection, { items, totalPages }] = await Promise.all([
    getCollectionById(id, session.user.id),
    getCollectionItems(id, session.user.id, page, COLLECTIONS_PER_PAGE),
  ]);

  if (!collection) notFound();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <FolderOpen className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{collection.name}</h1>
        <span className="text-sm text-muted-foreground">
          {collection._count.items} {collection._count.items === 1 ? "item" : "items"}
        </span>
        <CollectionActions collection={collection} />
      </div>

      {collection.description && (
        <p className="text-muted-foreground mb-6">{collection.description}</p>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No items in this collection</p>
        </div>
      ) : (
        <>
          <CollectionItemsList
            items={items}
            isPro={session.user.isPro ?? false}
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath={`/dashboard/collections/${id}`}
          />
        </>
      )}
    </div>
  );
}
