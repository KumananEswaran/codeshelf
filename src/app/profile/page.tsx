import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProfileData, getProfileStats } from "@/lib/db/profile";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStatsSection from "@/components/profile/ProfileStats";
import ChangePasswordSection from "@/components/profile/ChangePasswordSection";
import DeleteAccountSection from "@/components/profile/DeleteAccountSection";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [profile, stats] = await Promise.all([
    getProfileData(session.user.id),
    getProfileStats(session.user.id),
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

        <h1 className="text-2xl font-bold mb-8">Profile</h1>

        <div className="space-y-8">
          <ProfileHeader profile={profile} />
          <ProfileStatsSection stats={stats} />
          {profile.hasPassword && <ChangePasswordSection />}
          <DeleteAccountSection />
        </div>
      </div>
    </div>
  );
}
