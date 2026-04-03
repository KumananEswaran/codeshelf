import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { validateUpload, uploadToR2 } from "@/lib/r2";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.isPro) {
      return NextResponse.json(
        { error: "File uploads require a Pro subscription. Upgrade to Pro to upload files and images." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const itemType = formData.get("itemType") as "file" | "image" | null;

    if (!file || !itemType) {
      return NextResponse.json(
        { error: "File and itemType are required" },
        { status: 400 }
      );
    }

    if (itemType !== "file" && itemType !== "image") {
      return NextResponse.json(
        { error: "itemType must be 'file' or 'image'" },
        { status: 400 }
      );
    }

    const validation = validateUpload(
      file.name,
      file.type,
      file.size,
      itemType
    );
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `${session.user.id}/${Date.now()}-${file.name}`;
    const fileUrl = await uploadToR2(key, buffer, file.type);

    return NextResponse.json({
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
