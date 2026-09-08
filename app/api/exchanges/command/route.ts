import { NextRequest, NextResponse } from "next/server";
import { saveExchangeAction } from "@/app/actions/exchanges";
const headers = { "Cache-Control": "no-store" };
// A cancellable transport avoids the framework's serial Server Action queue:
// a suspended response must not prevent retrying the same idempotency key.
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin || request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ status: "forbidden", message: "Origine de requête refusée." }, { status: 403, headers });
  }
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Empty body");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 128 * 1024) {
        await reader.cancel();
        return NextResponse.json({ status: "validation", message: "Commande trop longue." }, { status: 400, headers });
      }
      chunks.push(value);
    }
    const body = Buffer.concat(chunks).toString("utf8");
    return NextResponse.json(await saveExchangeAction(JSON.parse(body)), { headers });
  } catch { return NextResponse.json({ status: "validation", message: "Commande non valide." }, { status: 400, headers }); }
}
