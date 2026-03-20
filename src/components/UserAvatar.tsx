"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  name?: string | null;
  image?: string | null;
  className?: string;
}

function getInitials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UserAvatar({ name, image, className }: UserAvatarProps) {
  return (
    <Avatar className={className}>
      {image && <AvatarImage src={image} alt={name ?? "User avatar"} />}
      <AvatarFallback className="bg-sidebar-accent text-xs">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
