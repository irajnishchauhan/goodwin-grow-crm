import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant/context";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Limit payload to 12MB for serverless stability
    if (buffer.length > 12 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File exceeds 12MB maximum size limit" },
        { status: 400 }
      );
    }

    const mimeType = file.type || "application/octet-stream";
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    const mediaType = mimeType.startsWith("video/")
      ? "video"
      : mimeType.startsWith("image/")
      ? "image"
      : "document";

    return NextResponse.json({
      success: true,
      data: {
        fileUrl: dataUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType,
        mediaType,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process uploaded file" },
      { status: 500 }
    );
  }
}

