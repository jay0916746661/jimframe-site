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
