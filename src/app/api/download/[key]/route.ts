import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFromR2 } from "@/lib/r2";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key } = await params;
    // The key is URL-encoded and includes the userId prefix
    const decodedKey = decodeURIComponent(key);

    // Verify the file belongs to the user
    if (!decodedKey.startsWith(session.user.id + "/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { body, contentType } = await getFromR2(decodedKey);

    const fileName = decodedKey.split("/").pop() ?? "download";
    // Strip the timestamp prefix from filename (e.g., "1234567890-file.pdf" -> "file.pdf")
    const cleanName = fileName.replace(/^\d+-/, "");

    return new Response(body, {
      headers: {
        "Content-Type": contentType ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${cleanName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Download failed" },
      { status: 500 }
    );
  }
}
