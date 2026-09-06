import { ownerStatus } from "@/lib/auth";

export const dynamic = "force-dynamic";
export async function GET() {
  const status = await ownerStatus({ writable: true });
  return Response.json({ authenticated: status === "owner" }, {
    status: status === "owner" ? 200 : status === "unavailable" ? 503 : 401,
    headers: { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" },
  });
}
