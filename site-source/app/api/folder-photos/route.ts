import { forbidden, isSameOriginRequest } from "../same-origin";
import { env } from "cloudflare:workers";

const folderPattern = /^[A-Za-z0-9_-]{20,80}$/;

const extractPhotoIds = (html: string) => {
  const decoded = html.replaceAll("\\u003d", "=").replaceAll("\\/", "/");
  const ids: string[] = [];
  const seen = new Set<string>();
  const patterns = [
    /drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{20,80})/g,
    /drive\.google\.com\/open\?id=([A-Za-z0-9_-]{20,80})/g,
  ];
  for (const pattern of patterns) {
    for (const match of decoded.matchAll(pattern)) {
      const id = match[1];
      if (!seen.has(id)) { seen.add(id); ids.push(id); }
    }
  }
  return ids;
};

export async function GET(request: Request) {
  if (!isSameOriginRequest(request)) return forbidden();
  const folder = new URL(request.url).searchParams.get("folder") ?? "";
  if (!folderPattern.test(folder)) return Response.json({ error: "Invalid folder" }, { status: 400 });
  try {
    const response = await fetch(`https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(folder)}#grid`, {
      headers: { "user-agent": "Mozilla/5.0 JimFrameAlbum/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Drive request failed");
    const images = extractPhotoIds(await response.text());
    if (!images.length) throw new Error("No public photos found");
    let hidden = new Set<string>();
    try {
      const rows = (await env.DB.prepare("SELECT photo_id FROM hidden_photos").all<{ photo_id: string }>()).results;
      hidden = new Set(rows.map(row => row.photo_id));
    } catch { /* table may not exist during a local first build */ }
    return Response.json({ images: images.filter(id => !hidden.has(id)) }, { headers: { "cache-control": "public, max-age=15, s-maxage=30" } });
  } catch {
    return Response.json({ error: "Unable to load album" }, { status: 502 });
  }
}
