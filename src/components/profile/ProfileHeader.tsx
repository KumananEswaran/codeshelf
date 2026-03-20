import { Card, CardContent } from "@/components/ui/card";
import UserAvatar from "@/components/UserAvatar";
import type { ProfileData } from "@/lib/db/profile";

interface ProfileHeaderProps {
  profile: ProfileData;
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  const joinDate = profile.createdAt.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <UserAvatar
          name={profile.name}
          image={profile.image}
          className="h-16 w-16 text-lg"
        />
        <div className="min-w-0">
          {profile.name && (
            <h2 className="text-lg font-semibold truncate">{profile.name}</h2>
          )}
          <p className="text-sm text-muted-foreground truncate">
            {profile.email}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Joined {joinDate}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
