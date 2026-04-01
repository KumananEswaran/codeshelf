"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  ChevronDown,
  Star,
  LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserAvatar from "@/components/UserAvatar";
import { getIcon } from "@/lib/icon-map";
import type { ItemTypeWithCount } from "@/lib/db/items";
import type { SidebarCollection } from "@/lib/db/collections";

const PRO_TYPES = new Set(["file", "image"]);

interface SessionUser {
  name: string | null;
  email: string | null;
  image: string | null;
}

interface SidebarProps {
  itemTypes: ItemTypeWithCount[];
  sidebarCollections: {
    favorites: SidebarCollection[];
    recents: SidebarCollection[];
  };
  user: SessionUser | null;
}

export default function Sidebar({ itemTypes, sidebarCollections, user }: SidebarProps) {
  const { favorites, recents } = sidebarCollections;

  return (
    <div className="flex flex-col h-full">
      {/* Types section */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <ChevronDown className="h-3 w-3" />
          Types
        </div>
        <nav className="flex flex-col gap-0.5">
          {itemTypes.map((type) => {
            const slug = type.name.toLowerCase() + "s";
            return (
              <Link
                key={type.id}
                href={`/dashboard/items/${slug}`}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-5 flex items-center justify-center"
                    style={{ color: type.color ?? undefined }}
                  >
                    {(() => {
                      const IconComponent = getIcon(type.icon);
                      return <IconComponent className="h-4 w-4" />;
                    })()}
                  </span>
                  <span>{type.name[0].toUpperCase() + type.name.slice(1)}s</span>
                  {PRO_TYPES.has(type.name) && (
                    <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-semibold tracking-wide">
                      PRO
                    </Badge>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {type.count}
                </span>
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
        {favorites.length > 0 && (
          <div className="mt-1">
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
              Favorites
            </div>
            <nav className="flex flex-col gap-0.5">
              {favorites.map((col) => (
                <Link
                  key={col.id}
                  href={`/dashboard/collections/${col.id}`}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="truncate">{col.name}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {col.itemCount}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Recent Collections */}
        <div className="mt-3">
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
            Recent
          </div>
          <nav className="flex flex-col gap-0.5">
            {recents.map((col) => (
              <Link
                key={col.id}
                href={`/dashboard/collections/${col.id}`}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: col.dominantColor ?? "#6b7280",
                    }}
                  />
                  <span className="truncate">{col.name}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {col.itemCount}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        {/* View all collections link */}
        <div className="mt-2 px-2">
          <Link
            href="/dashboard/collections"
            className="text-xs text-muted-foreground hover:text-sidebar-foreground transition-colors"
          >
            View all collections →
          </Link>
        </div>
      </div>

      {/* User area */}
      <Separator />
      <div className="px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 px-2 w-full rounded-md hover:bg-sidebar-accent transition-colors outline-none py-1.5">
            <UserAvatar name={user?.name} image={user?.image} className="h-8 w-8" />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name ?? "Guest"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email ?? "Not signed in"}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem render={<Link href="/profile" />}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/sign-in" })}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
