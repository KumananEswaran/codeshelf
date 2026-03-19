"use client";

import { useState } from "react";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import type { ItemTypeWithCount } from "@/lib/db/items";
import type { SidebarCollection } from "@/lib/db/collections";

interface DashboardShellProps {
  children: React.ReactNode;
  itemTypes: ItemTypeWithCount[];
  sidebarCollections: {
    favorites: SidebarCollection[];
    recents: SidebarCollection[];
  };
}

export default function DashboardShell({
  children,
  itemTypes,
  sidebarCollections,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex shrink-0 border-r border-border bg-background flex-col transition-[width] duration-200 ease-in-out ${
          sidebarOpen ? "w-64" : "w-0 border-r-0 overflow-hidden"
        }`}
      >
        <div className="flex items-center gap-2 px-4 h-14.25 shrink-0">
          <span className="text-lg font-bold text-sidebar-foreground whitespace-nowrap">
            CodeShelf
          </span>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <Sidebar
            itemTypes={itemTypes}
            sidebarCollections={sidebarCollections}
          />
        </div>
      </aside>

      {/* Right panel */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center px-4 md:px-6 h-14.25 border-b border-border bg-background shrink-0 gap-2">
          {/* Mobile drawer trigger */}
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden shrink-0" />
              }
            >
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Sidebar navigation</SheetTitle>
              <div className="flex items-center gap-2 px-4 h-14.25 shrink-0 border-b border-border">
                <span className="text-lg font-bold text-sidebar-foreground">
                  CodeShelf
                </span>
              </div>
              <Sidebar
                itemTypes={itemTypes}
                sidebarCollections={sidebarCollections}
              />
            </SheetContent>
          </Sheet>

          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex shrink-0"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>

          <TopBar />
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
