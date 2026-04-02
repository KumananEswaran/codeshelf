import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getSidebarCollections } from "@/lib/db/collections";
import { getItemTypesWithCounts } from "@/lib/db/items";
import { getEditorPreferences } from "@/lib/db/editor-preferences";
import { EditorPreferencesProvider } from "@/contexts/EditorPreferencesContext";
import { auth } from "@/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  const [itemTypes, sidebarCollections, editorPreferences] = await Promise.all([
    getItemTypesWithCounts(userId),
    getSidebarCollections(userId),
    getEditorPreferences(userId),
  ]);

  const user = {
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
  };

  return (
    <EditorPreferencesProvider initialPreferences={editorPreferences}>
      <DashboardShell
        itemTypes={itemTypes}
        sidebarCollections={sidebarCollections}
        user={user}
      >
        {children}
      </DashboardShell>
    </EditorPreferencesProvider>
  );
}
