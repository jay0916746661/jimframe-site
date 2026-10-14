import { env } from "cloudflare:workers";

const sessionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let sessionId = "";
  let seconds = 0;

  try {
    const body = (await request.json()) as { sessionId?: unknown; seconds?: unknown };
    if (typeof body.sessionId === "string" && sessionIdPattern.test(body.sessionId)) {
      sessionId = body.sessionId;
    }
    if (typeof body.seconds === "number" && Number.isInteger(body.seconds)) {
      seconds = body.seconds;
    }
  } catch {
    return new Response(null, { status: 400 });
  }

  if (!sessionId || seconds < 3 || seconds > 21600) {
    return new Response(null, { status: 400 });
  }

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO click_events (event_type, album_key, venue, created_at)
       SELECT 'session_duration', ?, ?, CURRENT_TIMESTAMP
       WHERE NOT EXISTS (
         SELECT 1 FROM click_events
         WHERE event_type = 'session_duration' AND album_key = ?
       )`
    ).bind(sessionId, String(seconds), sessionId),
    env.DB.prepare(
      `UPDATE click_events
       SET venue = CASE WHEN CAST(venue AS INTEGER) < ? THEN ? ELSE venue END
       WHERE event_type = 'session_duration' AND album_key = ?`
    ).bind(seconds, String(seconds), sessionId),
  ]);

  return new Response(null, { status: 204 });
}
