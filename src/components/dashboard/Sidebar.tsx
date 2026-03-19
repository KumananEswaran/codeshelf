"use client";

import Link from "next/link";
import { ChevronDown, Star, Settings, FolderOpen } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  mockUser,
  mockItemTypes,
  mockCollections,
  mockItemTypeCounts,
} from "@/lib/mock-data";

const TYPE_ICONS: Record<string, string> = {
  type_snippet: "</>",
  type_prompt: "🤖",
  type_command: ">_",
  type_note: "📝",
  type_file: "📄",
  type_image: "🖼️",
  type_url: "🔗",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Sidebar() {
  const favoriteCollections = mockCollections.filter((c) => c.isFavorite);
  const recentCollections = mockCollections.slice(0, 4);

  return (
    <div className="flex flex-col h-full">
      {/* Types section */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <ChevronDown className="h-3 w-3" />
          Types
        </div>
        <nav className="flex flex-col gap-0.5">
          {mockItemTypes.map((type) => {
            const count =
              mockItemTypeCounts[
                type.id as keyof typeof mockItemTypeCounts
              ] ?? 0;
            const slug = type.name.toLowerCase() + "s";
            return (
              <Link
                key={type.id}
                href={`/items/${slug}`}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="w-5 text-center text-xs" style={{ color: type.color }}>
                    {TYPE_ICONS[type.id] ?? type.icon}
                  </span>
                  <span>{type.name}s</span>
                </span>
                <span className="text-xs text-muted-foreground">{count}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <Separator className="my-1" />

      {/* Collections section */}
      <div className="px-3 py-2 flex-1 min-h-0 overflow-y-auto">
        <div className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <ChevronDown className="h-3 w-3" />
          Collections
        </div>

        {/* Favorites */}
        <div className="mt-1">
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
            Favorites
          </div>
          <nav className="flex flex-col gap-0.5">
            {favoriteCollections.map((col) => (
              <Link
                key={col.id}
                href={`/collections/${col.id}`}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{col.name}</span>
                </span>
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              </Link>
            ))}
          </nav>
        </div>

        {/* All Collections */}
        <div className="mt-3">
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
            All Collections
          </div>
          <nav className="flex flex-col gap-0.5">
            {recentCollections.map((col) => (
              <Link
                key={col.id}
                href={`/collections/${col.id}`}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{col.name}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {col.itemCount}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* User area */}
      <Separator />
      <div className="px-3 py-3">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-accent text-xs">
              {getInitials(mockUser.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {mockUser.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {mockUser.email}
            </p>
          </div>
          <button className="text-muted-foreground hover:text-sidebar-foreground transition-colors">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
