import { redirect, notFound } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Code, Sparkles, Terminal, StickyNote, File, Image, Link as LinkIcon, Plus } from "lucide-react";
import { auth } from "@/auth";
import { getItemsByType } from "@/lib/db/items";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import ItemsListWithDrawer from "@/components/dashboard/ItemsListWithDrawer";
import NewItemDialog, { type ItemType } from "@/components/dashboard/NewItemDialog";
import Pagination from "@/components/ui/pagination";


const DIALOG_TYPES = new Set<string>(["snippet", "prompt", "command", "note", "file", "image", "link"]);

const SLUG_CONFIG: Record<string, { typeName: string; icon: LucideIcon }> = {
  snippets: { typeName: "snippet", icon: Code },
  prompts: { typeName: "prompt", icon: Sparkles },
  commands: { typeName: "command", icon: Terminal },
  notes: { typeName: "note", icon: StickyNote },
  files: { typeName: "file", icon: File },
  images: { typeName: "image", icon: Image },
  links: { typeName: "link", icon: LinkIcon },
};

export default async function ItemsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { type: slug } = await params;
  const config = SLUG_CONFIG[slug];

  if (!config) notFound();

  const PRO_ONLY_SLUGS = new Set(["files", "images"]);
  if (PRO_ONLY_SLUGS.has(slug) && !session.user.isPro) {
    redirect("/dashboard/upgrade");
  }

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const { typeName, icon: Icon } = config;
  const { items, totalCount, totalPages } = await getItemsByType(
    session.user.id,
    typeName,
    page,
    ITEMS_PER_PAGE
  );
  const displayName = typeName[0].toUpperCase() + typeName.slice(1) + "s";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Icon className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{displayName}</h1>
        <span className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? "item" : "items"}
        </span>
        {DIALOG_TYPES.has(typeName) && (
          <div className="ml-auto">
            <NewItemDialog defaultType={typeName as ItemType} isPro={session.user.isPro ?? false}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">
                New {typeName.charAt(0).toUpperCase() + typeName.slice(1)}
              </span>
            </NewItemDialog>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 text-muted-foreground">
          <Icon className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium mb-1">No {displayName.toLowerCase()} yet</p>
          <p className="text-sm">
            {DIALOG_TYPES.has(typeName)
              ? `Click "New ${typeName.charAt(0).toUpperCase() + typeName.slice(1)}" to create your first one.`
              : "Nothing to show here yet."}
          </p>
        </div>
      ) : (
        <>
          <ItemsListWithDrawer items={items} isPro={session.user.isPro ?? false} />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath={`/dashboard/items/${slug}`}
          />
        </>
      )}
    </div>
  );
}
