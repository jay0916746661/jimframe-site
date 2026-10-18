import { env } from "cloudflare:workers";

const visitorIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let visitorId = "";
  try {
    const body = (await request.json()) as { visitorId?: unknown };
    if (typeof body.visitorId === "string" && visitorIdPattern.test(body.visitorId)) {
      visitorId = body.visitorId;
    }
  } catch {
    // Older clients may send an empty body. Page views still remain countable.
  }

  await env.DB.prepare(
    "INSERT INTO click_events (event_type, created_at) VALUES (?, CURRENT_TIMESTAMP)"
  ).bind("page_view").run();

  if (visitorId) {
    await env.DB.prepare(
      `INSERT INTO click_events (event_type, album_key, created_at)
       SELECT 'unique_visit', ?, CURRENT_TIMESTAMP
       WHERE NOT EXISTS (
         SELECT 1 FROM click_events
         WHERE event_type = 'unique_visit' AND album_key = ?
       )`
    ).bind(visitorId, visitorId).run();
  }

  return new Response(null, { status: 204 });
}
