"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import { supabase } from "@/lib/supabase-client";

export default function ExtractPdfData() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { authenticatedFetch } = useAuthenticatedFetch();

const handleExtract = async () => {
  if (!file) return;
  setLoading(true);

  // 1️⃣ Subir el PDF al bucket 'proofs'
const safeFileName = file.name
  .normalize("NFD") // separa letras y tildes
  .replace(/[\u0300-\u036f]/g, "") // quita tildes
  .replace(/[^a-zA-Z0-9.\-_ ]/g, "") // deja solo caracteres válidos
  .replace(/\s+/g, "_"); // reemplaza espacios por guiones bajos

const filePath = `user-${Date.now()}/${safeFileName}`;
// 1️⃣ Subir el PDF al bucket
const { data: uploadData, error: uploadError } = await supabase.storage
  .from("proofs")
  .upload(filePath, file);

if (uploadError) {
  console.error("❌ Error al subir:", uploadError);
  setLoading(false);
  return;
}

console.log("✅ Archivo subido correctamente:", uploadData);
// Esperar confirmación de indexación del objeto

// 2️⃣ Generar URL firmada (válida por 1 minuto)
const path = uploadData.path;
const { data: signed, error: signedError } = await supabase.storage
.from("proofs")
.createSignedUrl(path, 60);

await new Promise((r) => setTimeout(r, 2000));
if (signedError) {
  console.error("❌ Error al generar URL firmada:", signedError);
  setLoading(false);
  return;
}

console.log("✅ Signed URL generada:", signed.signedUrl);

if (signedError) {
  console.error("❌ Error al generar URL firmada:", signedError);
  setLoading(false);
  return;
}

console.log("✅ Signed URL generada:", signed?.signedUrl);

console.log("Signed URL:", signed?.signedUrl); // 👈 validalo en consola
console.log("📎 Enviando a Supabase:", { fileUrl: signed?.signedUrl });
const res = await authenticatedFetch(
  "https://nqhzaiuumlaqkszxikcz.supabase.co/functions/v1/extract-pdf-data",
  {
    method: "POST",
    body: JSON.stringify({ fileUrl: signed?.signedUrl }), // 👈 exacto
  }
);

  const data = await res.json();
  setResult(data);
  setLoading(false);
};

  return (
    <div className="p-6">
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <Button onClick={handleExtract} disabled={!file || loading} variant="cta">
        {loading ? "Procesando..." : "Extraer datos"}
      </Button>

      {result && (
        <pre className="mt-4 bg-gray-100 p-3 text-sm rounded">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
