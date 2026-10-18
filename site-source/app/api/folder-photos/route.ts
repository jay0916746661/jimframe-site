import { forbidden, isSameOriginRequest } from "../same-origin";

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
    return Response.json({ images }, { headers: { "cache-control": "public, max-age=300, s-maxage=900, stale-while-revalidate=3600" } });
  } catch {
    return Response.json({ error: "Unable to load album" }, { status: 502 });
  }
}
