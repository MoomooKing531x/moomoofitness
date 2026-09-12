import { clearSessionCookie } from "../../../../lib/auth.js";

// Don't prerender this route
export const dynamic = "force-dynamic";

export async function POST() {
  clearSessionCookie();
  return Response.json({ ok: true });
}

