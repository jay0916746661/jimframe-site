import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { forbidden, isSameOriginRequest } from "../../same-origin";

const ADMIN_EMAIL = "jay0916746661@gmail.com";
const photoPattern = /^[A-Za-z0-9_-]{10,120}$/;
const albumPattern = /^[0-9]{4}-.{1,40}$/u;
type HiddenRow = { photo_id: string; album_key: string; hidden_at: string };

async function admin() {
  const user = await getChatGPTUser();
  return user?.email.toLowerCase() === ADMIN_EMAIL ? user : null;
}

export async function GET(request: Request) {
  if (!isSameOriginRequest(request) || !(await admin())) return forbidden();
  const rows = (await env.DB.prepare("SELECT photo_id, album_key, hidden_at FROM hidden_photos ORDER BY hidden_at DESC").all<HiddenRow>()).results;
  return Response.json({ items: rows.map(row => ({ photoId: row.photo_id, albumKey: row.album_key, hiddenAt: row.hidden_at })) }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return forbidden();
  const user = await admin();
  if (!user) return forbidden();
  let payload: { action?: unknown; photoIds?: unknown; albumKey?: unknown };
  try { payload = await request.json(); } catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }
  const action = payload.action;
  const photoIds = Array.isArray(payload.photoIds) ? [...new Set(payload.photoIds.filter((id): id is string => typeof id === "string" && photoPattern.test(id)))].slice(0, 200) : [];
  const albumKey = typeof payload.albumKey === "string" && albumPattern.test(payload.albumKey) ? payload.albumKey : "unknown";
  if ((action !== "hide" && action !== "restore") || !photoIds.length) return Response.json({ error: "Invalid selection" }, { status: 400 });

  const statements = action === "hide"
    ? photoIds.map(id => env.DB.prepare("INSERT INTO hidden_photos (photo_id, album_key, hidden_by) VALUES (?, ?, ?) ON CONFLICT(photo_id) DO UPDATE SET album_key = excluded.album_key, hidden_by = excluded.hidden_by, hidden_at = CURRENT_TIMESTAMP").bind(id, albumKey, user.email))
    : photoIds.map(id => env.DB.prepare("DELETE FROM hidden_photos WHERE photo_id = ?").bind(id));
  await env.DB.batch(statements);
  return Response.json({ ok: true, action, count: photoIds.length }, { headers: { "cache-control": "no-store" } });
}
