import TopBar from "@/components/dashboard/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-background flex flex-col">
        <div className="flex items-center gap-2 px-4 h-14.25 shrink-0">
          <span className="text-lg font-bold text-sidebar-foreground">CodeShelf</span>
        </div>
        <h2 className="p-4 text-lg font-semibold text-sidebar-foreground">Sidebar</h2>
      </aside>

      {/* Right panel */}
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
