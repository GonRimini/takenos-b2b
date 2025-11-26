import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserEmail } from "@/lib/auth-middleware";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { email: userEmail, error: authError } = await getAuthenticatedUserEmail(req);

    if (authError || !userEmail) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Crear nombre de archivo único
    const timestamp = Date.now();
    const safeFileName = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.\-_ ]/g, "")
      .replace(/\s+/g, "_");

    const filePath = `deposit-proofs/${userEmail}/${timestamp}_${safeFileName}`;

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir usando supabaseServer (usa service role key, sin RLS)
    const sb = supabaseServer();
    const { data: uploadData, error: uploadError } = await sb.storage
      .from("proofs")
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Error uploading file:", uploadError);
      return NextResponse.json(
        { ok: false, error: uploadError.message },
        { status: 500 }
      );
    }

    // Generar URL pública
    const { data: publicUrlData } = sb.storage
      .from("proofs")
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      ok: true,
      data: {
        publicUrl: publicUrlData.publicUrl,
        filePath: uploadData.path,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in /api/upload-proof:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
