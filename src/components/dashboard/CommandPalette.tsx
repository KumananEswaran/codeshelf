"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, FolderOpen } from "lucide-react";
import { getIcon } from "@/lib/icon-map";

interface SearchItem {
  id: string;
  title: string;
  description: string | null;
  contentPreview: string | null;
  type: {
    name: string;
    icon: string | null;
    color: string | null;
  };
}

interface SearchCollection {
  id: string;
  name: string;
  itemCount: number;
}

interface SearchData {
  items: SearchItem[];
  collections: SearchCollection[];
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectItem?: (itemId: string) => void;
}

export default function CommandPalette({
  open,
  onOpenChange,
  onSelectItem,
}: CommandPaletteProps) {
  const router = useRouter();
  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || data) return;
    setLoading(true);
    fetch("/api/search")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => { if (json) setData(json); })
      .finally(() => setLoading(false));
  }, [open, data]);

  const handleSelectItem = (itemId: string) => {
    onOpenChange(false);
    if (onSelectItem) {
      onSelectItem(itemId);
    }
  };

  const handleSelectCollection = (collectionId: string) => {
    onOpenChange(false);
    router.push(`/dashboard/collections/${collectionId}`);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Search"
      overlayClassName="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
      contentClassName="fixed top-[20%] left-1/2 z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border border-border bg-background shadow-2xl"
      filter={(value, search, keywords) => {
        const text = value + " " + (keywords?.join(" ") || "");
        if (text.toLowerCase().includes(search.toLowerCase())) {
          return text.toLowerCase().startsWith(search.toLowerCase()) ? 1 : 0.5;
        }
        return 0;
      }}
    >
      <div className="flex items-center border-b border-border px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <Command.Input
          placeholder="Search items and collections..."
          className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <Command.List className="max-h-75 overflow-y-auto p-2">
        {loading && (
          <Command.Loading>
            <div className="py-6 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          </Command.Loading>
        )}
        <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
          No results found.
        </Command.Empty>

        {data && data.items.length > 0 && (
          <Command.Group
            heading="Items"
            className="**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground"
          >
            {data.items.map((item) => {
              const Icon = getIcon(item.type.icon);
              return (
                <Command.Item
                  key={item.id}
                  value={item.title}
                  keywords={[
                    item.type.name,
                    item.description ?? "",
                    item.contentPreview ?? "",
                  ]}
                  onSelect={() => handleSelectItem(item.id)}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <Icon
                    className="h-4 w-4 shrink-0"
                    style={{ color: item.type.color ?? undefined }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{item.title}</span>
                    {item.description && (
                      <span className="truncate text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground capitalize">
                    {item.type.name}
                  </span>
                </Command.Item>
              );
            })}
          </Command.Group>
        )}

        {data && data.collections.length > 0 && (
          <Command.Group
            heading="Collections"
            className="**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground"
          >
            {data.collections.map((col) => (
              <Command.Item
                key={col.id}
                value={col.name}
                onSelect={() => handleSelectCollection(col.id)}
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{col.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {col.itemCount} {col.itemCount === 1 ? "item" : "items"}
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>
      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              ↑↓
            </kbd>{" "}
            navigate
          </span>
          <span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              ↵
            </kbd>{" "}
            select
          </span>
        </div>
        <span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            esc
          </kbd>{" "}
          close
        </span>
      </div>
    </Command.Dialog>
  );
}
