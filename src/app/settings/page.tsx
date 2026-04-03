import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProfileData } from "@/lib/db/profile";
import { getEditorPreferences } from "@/lib/db/editor-preferences";
import { getUserItemCount, getUserCollectionCount } from "@/lib/db/subscription";
import BillingSection from "@/components/settings/BillingSection";
import ChangePasswordSection from "@/components/settings/ChangePasswordSection";
import DeleteAccountSection from "@/components/settings/DeleteAccountSection";
import EditorPreferencesSection from "@/components/settings/EditorPreferencesSection";
import { EditorPreferencesProvider } from "@/contexts/EditorPreferencesContext";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [profile, editorPreferences, itemCount, collectionCount] = await Promise.all([
    getProfileData(session.user.id),
    getEditorPreferences(session.user.id),
    getUserItemCount(session.user.id),
    getUserCollectionCount(session.user.id),
  ]);

  if (!profile) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        <div className="space-y-8">
          <BillingSection
            isPro={profile.isPro}
            hasStripeCustomer={profile.hasStripeCustomer}
            itemCount={itemCount}
            collectionCount={collectionCount}
          />
          <EditorPreferencesProvider initialPreferences={editorPreferences}>
            <EditorPreferencesSection />
          </EditorPreferencesProvider>
          {profile.hasPassword && <ChangePasswordSection />}
          <DeleteAccountSection />
        </div>
      </div>
    </div>
  );
}
