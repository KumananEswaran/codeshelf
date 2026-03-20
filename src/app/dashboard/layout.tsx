import DashboardShell from "@/components/dashboard/DashboardShell";
import { getSidebarCollections } from "@/lib/db/collections";
import { getItemTypesWithCounts } from "@/lib/db/items";
import { auth } from "@/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [itemTypes, sidebarCollections, session] = await Promise.all([
    getItemTypesWithCounts(),
    getSidebarCollections(),
    auth(),
  ]);

  const user = session?.user
    ? { name: session.user.name ?? null, email: session.user.email ?? null, image: session.user.image ?? null }
    : null;

  return (
    <DashboardShell
      itemTypes={itemTypes}
      sidebarCollections={sidebarCollections}
      user={user}
    >
      {children}
    </DashboardShell>
  );
}
