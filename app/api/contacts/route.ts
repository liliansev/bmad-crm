import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readContact, readContacts } from "@/lib/contacts";
const querySchema = z.union([z.object({ id: z.uuid() }).strict(), z.object({ page: z.coerce.number().int().min(1).max(100000) }).strict()]);
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  const headers = { "Cache-Control": "no-store" };
  if (!parsed.success) return NextResponse.json({ status: "unavailable", message: "Demande de lecture non valide." }, { status: 400, headers });
  return NextResponse.json("id" in parsed.data ? await readContact(parsed.data.id) : await readContacts(parsed.data.page), { headers });
}
