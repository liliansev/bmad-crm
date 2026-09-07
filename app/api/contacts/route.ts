import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readContact, readContacts } from "@/lib/contacts";
const querySchema = z.union([z.object({ id: z.uuid() }).strict(), z.object({ page: z.coerce.number().int().min(1).max(100000) }).strict()]);
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const supportedVersion = z.enum(["1", "2"]).optional().safeParse(params.version);
  const version = params.version; delete params.version;
  const parsed = querySchema.safeParse(params);
  const headers = { "Cache-Control": "no-store" };
  if (!parsed.success || !supportedVersion.success) return NextResponse.json({ status: "unavailable", message: "Demande de lecture non valide." }, { status: 400, headers });
  const result = "id" in parsed.data ? await readContact(parsed.data.id) : await readContacts(parsed.data.page);
  if (version !== "2" && result.status === "success") {
    const legacy = (contact: { id: string; first_name: string; last_name: string; field_versions: { first_name: number; last_name: number }; revision: number; created_at: string; updated_at: string }) => ({ id: contact.id, first_name: contact.first_name, last_name: contact.last_name, field_versions: { first_name: contact.field_versions.first_name, last_name: contact.field_versions.last_name }, revision: contact.revision, created_at: contact.created_at, updated_at: contact.updated_at });
    return NextResponse.json("contact" in result ? { ...result, contact: legacy(result.contact) } : { ...result, contacts: result.contacts.map(legacy) }, { headers });
  }
  return NextResponse.json(result, { headers });
}
