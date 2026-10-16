import { env } from "cloudflare:workers";

const venues = new Set(["Flow", "Barcade", "La Salsa", "Odoro", "Zouk", "Bachata Crush"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const folder = url.searchParams.get("folder") ?? "";
  const album = url.searchParams.get("album") ?? "";
  const [date, ...venueParts] = album.split("-");
  const venue = venueParts.join("-");

  if (!/^[A-Za-z0-9_-]{20,80}$/.test(folder) || !/^\d{4}$/.test(date) || !venues.has(venue)) {
    return new Response("Invalid album", { status: 400 });
  }

  await env.DB.prepare(
    "INSERT INTO click_events (event_type, album_key, venue, album_date, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)"
  ).bind("album_click", album, venue, `2026-${date.slice(0, 2)}-${date.slice(2)}`).run();

  return Response.redirect(`https://drive.google.com/drive/folders/${folder}`, 302);
}
