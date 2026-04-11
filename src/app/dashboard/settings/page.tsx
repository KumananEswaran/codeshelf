import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProfileData } from "@/lib/db/profile";
import { getUserItemCount, getUserCollectionCount } from "@/lib/db/subscription";
import BillingSection from "@/components/settings/BillingSection";
import ChangePasswordSection from "@/components/settings/ChangePasswordSection";
import DeleteAccountSection from "@/components/settings/DeleteAccountSection";
import EditorPreferencesSection from "@/components/settings/EditorPreferencesSection";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [profile, itemCount, collectionCount] = await Promise.all([
    getProfileData(session.user.id),
    getUserItemCount(session.user.id),
    getUserCollectionCount(session.user.id),
  ]);

  if (!profile) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      <div className="space-y-8">
        <BillingSection
          isPro={profile.isPro}
          hasStripeCustomer={profile.hasStripeCustomer}
          itemCount={itemCount}
          collectionCount={collectionCount}
        />
        <EditorPreferencesSection />
        {profile.hasPassword && <ChangePasswordSection />}
        <DeleteAccountSection />
      </div>
    </div>
  );
}
