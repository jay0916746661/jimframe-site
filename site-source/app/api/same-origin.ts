// Shared guard for the photo proxies and the face index: only requests made by
// this website's own pages are served, so other sites and scripts cannot use
// the Worker as a free Google Drive download proxy.
//
// Browsers send `Sec-Fetch-Site` automatically and pages cannot fake it. Older
// browsers without it fall back to the Origin / Referer host. This stops casual
// hot-linking and abuse, not a determined attacker who forges headers.
export function isSameOriginRequest(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";
  const host = new URL(request.url).host;
  for (const header of ["origin", "referer"]) {
    const value = request.headers.get(header);
    if (!value) continue;
    try {
      return new URL(value).host === host;
    } catch {
      return false;
    }
  }
  return false;
}

export const forbidden = () =>
  Response.json({ error: "Forbidden" }, { status: 403, headers: { "cache-control": "no-store" } });

// GitHub Pages copy of the site (https://jay0916746661.github.io/jimframe-site/)
// may READ the face index and face previews cross-origin. Nothing else:
// writes to the index and every other API stay same-origin only.
const CROSS_ORIGIN_ALLOWED = new Set(["https://jay0916746661.github.io"]);

/** Returns the allowed Origin for a cross-origin request from the GitHub Pages site, else null. */
export function allowedCrossOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  return origin && CROSS_ORIGIN_ALLOWED.has(origin) ? origin : null;
}

export function withCors(response: Response, origin: string | null): Response {
  if (!origin) return response;
  const headers = new Headers(response.headers);
  headers.set("access-control-allow-origin", origin);
  headers.append("vary", "Origin");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

/** CORS preflight for the GitHub Pages origin only. */
export function corsPreflight(request: Request, methods: string): Response {
  const origin = allowedCrossOrigin(request);
  if (!origin) return forbidden();
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": methods,
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
      vary: "Origin",
    },
  });
}
