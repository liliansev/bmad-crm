import { NextRequest, NextResponse } from "next/server";
import { saveContactAction } from "@/app/actions/contacts";
const headers = { "Cache-Control": "no-store" };
// A cancellable transport avoids the framework's serial Server Action queue:
// a suspended response must not prevent retrying the same idempotency key.
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin || request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ status: "forbidden", message: "Origine de requête refusée." }, { status: 403, headers });
  }
  try {
    const body = await request.text();
    if (body.length > 4096) return NextResponse.json({ status: "validation", message: "Commande trop longue." }, { status: 400, headers });
    return NextResponse.json(await saveContactAction(JSON.parse(body)), { headers });
  } catch { return NextResponse.json({ status: "validation", message: "Commande non valide." }, { status: 400, headers }); }
}
