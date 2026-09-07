import { NextRequest, NextResponse } from "next/server";
import { duplicatesInputSchema } from "@/lib/validations/contacts";
import { readEmailDuplicates } from "@/lib/contacts";
export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  if (request.headers.get("origin") !== request.nextUrl.origin || request.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({ status: "forbidden", message: "Origine de requête refusée." }, { status: 403, headers });
  let input: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Empty");
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 4096) { await reader.cancel(); throw new Error("Too large"); } chunks.push(value); }
    input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch { return NextResponse.json({ status: "validation", message: "Demande non valide." }, { status: 400, headers }); }
  const parsed = duplicatesInputSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ status: "validation", message: "Adresse non valide." }, { status: 400, headers });
  return NextResponse.json(await readEmailDuplicates(parsed.data.email, parsed.data.exclude_id, parsed.data.page), { headers });
}
