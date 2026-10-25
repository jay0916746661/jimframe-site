import { env } from "cloudflare:workers";

type HiddenRow = { photo_id: string };

export async function GET() {
  try {
    const rows = (await env.DB.prepare("SELECT photo_id FROM hidden_photos ORDER BY hidden_at DESC").all<HiddenRow>()).results;
    return Response.json({ hidden: rows.map(row => row.photo_id) }, { headers: { "cache-control": "public, max-age=15, s-maxage=30" } });
  } catch (error) {
    console.error("photo visibility unavailable", error);
    return Response.json({ hidden: [] }, { headers: { "cache-control": "no-store" } });
  }
}
