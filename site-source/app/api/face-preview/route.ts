import { allowedCrossOrigin, corsPreflight, forbidden, isSameOriginRequest, withCors } from "../same-origin";
// Proxies a small Drive thumbnail so the browser can run face detection on it
// (Drive thumbnails have no CORS headers, so the canvas would be tainted).
//
// Do NOT pass `cache: "force-cache"` here: the Workers runtime throws
// "Unsupported cache mode", and vinext's fetch cache stores bodies with
// `.text()`, which corrupts binary JPEG data. Edge caching uses `cf` instead.
const photoPattern = /^[A-Za-z0-9_-]{10,120}$/;

// 900px for face detection, 1600px for the exact colour preview.
const allowedWidths = new Set([900, 1600]);

const sources = (id: string, width: number) => [
  `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${width}`,
  `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}=w${width}`,
];

export const OPTIONS = (request: Request) => corsPreflight(request, "GET");

// The GitHub Pages copy reads previews cross-origin so its canvas is not tainted.
export async function GET(request: Request) {
  const crossOrigin = isSameOriginRequest(request) ? null : allowedCrossOrigin(request);
  if (!isSameOriginRequest(request) && !crossOrigin) return forbidden();
  return withCors(await handle(request), crossOrigin);
}

async function handle(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("id") ?? "";
  const requestedWidth = Number(params.get("w") ?? 900);
  const width = allowedWidths.has(requestedWidth) ? requestedWidth : 900;
  if (!photoPattern.test(id)) return Response.json({ error: "Invalid photo" }, { status: 400 });

  let lastStatus = 502;
  for (const url of sources(id, width)) {
    try {
      const source = await fetch(url, {
        redirect: "follow",
        headers: { "user-agent": "Mozilla/5.0 JimFrameFaceIndex/1.0", accept: "image/avif,image/webp,image/jpeg,image/*" },
        signal: AbortSignal.timeout(12000),
        // Cloudflare edge cache (ignored outside Workers).
        cf: { cacheTtl: 86400, cacheEverything: true },
      } as RequestInit);
      const type = source.headers.get("content-type") ?? "";
      // Drive sometimes answers with an HTML sign-in / quota page; never pass that on as an image.
      if (source.ok && source.body && type.startsWith("image/")) {
        return new Response(source.body, {
          headers: {
            "content-type": type,
            "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        });
      }
      lastStatus = source.ok ? 502 : source.status;
      await source.body?.cancel();
    } catch {
      lastStatus = 504;
    }
  }
  return Response.json({ error: "Photo unavailable" }, { status: lastStatus, headers: { "cache-control": "no-store" } });
}
