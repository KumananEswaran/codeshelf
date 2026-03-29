import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserCollectionsForSelect } from "@/lib/db/collections";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const collections = await getUserCollectionsForSelect(session.user.id);
  return NextResponse.json(collections);
}
