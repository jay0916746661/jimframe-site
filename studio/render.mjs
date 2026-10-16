// Ported from site-source/app/studio/render.ts. Static URLs and zh/en/ko output.
// IG asset generator: picks photos from an album and renders stories (1080x1920),
// carousel posts (1080x1350), a Reel (MP4, 1080x1920) and captions, entirely in
// the browser. Photos come through /api/face-preview so canvases stay exportable.
import { ArrayBufferTarget, Muxer } from "./vendor/mp4-muxer.mjs";
const tr = (info, zh, en, ko) => info.language === "en" ? en : info.language === "ko" ? ko : zh;
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang TC", "Noto Sans TC", "Helvetica Neue", Arial, sans-serif';
const palettes = {
    night: { bg: "#0b0b0c", fg: "#f5f5f7", sub: "rgba(245,245,247,.62)", accent: "#ffd60a", onAccent: "#111", card: "#1c1c1e" },
    paper: { bg: "#f2efe9", fg: "#151515", sub: "rgba(21,21,21,.58)", accent: "#151515", onAccent: "#f2efe9", card: "#ffffff" },
    mono: { bg: "#050505", fg: "#ffffff", sub: "rgba(255,255,255,.55)", accent: "#ffffff", onAccent: "#050505", card: "#202020" },
    cobalt: { bg: "#07152d", fg: "#f4f8ff", sub: "rgba(207,224,255,.66)", accent: "#5ea0ff", onAccent: "#06152d", card: "#10274a" },
    warm: { bg: "#24100b", fg: "#fff8ef", sub: "rgba(255,226,201,.68)", accent: "#ff7a3d", onAccent: "#24100b", card: "#4b2115" },
    crush: { bg: "#24051f", fg: "#fff4fb", sub: "rgba(255,220,244,.72)", accent: "#ff4fa3", onAccent: "#26051f", card: "#6f174f" },
    halloween: { bg: "#120d18", fg: "#fff4df", sub: "rgba(255,224,180,.68)", accent: "#ff8a1f", onAccent: "#1a0d06", card: "#34203f" }
};
const palette = (theme) => palettes[theme];
export const dateLabel = (d) => (d === "0830" ? "08.29" : `${d.slice(0, 2)}.${d.slice(2)}`);
export const photoUrl = (id, w) => `https://jimframe.jay0916746661.chatgpt.site/api/face-preview?id=${encodeURIComponent(id)}&w=${w}`;
/* ---------------- Photo loading & automatic selection ---------------- */
const loadBitmap = async (id, w) => {
    const response = await fetch(photoUrl(id, w));
    if (!response.ok)
        throw new Error(`photo ${response.status}`);
    return createImageBitmap(await response.blob());
};
/** Sharpness (variance of a Laplacian), exposure and a 64-bit difference hash from a tiny copy. */
const analyse = (img) => {
    const c = new OffscreenCanvas(72, 72);
    const x = c.getContext("2d", { willReadFrequently: true });
    x.drawImage(img, 0, 0, 72, 72);
    const px = x.getImageData(0, 0, 72, 72).data;
    const g = new Float32Array(72 * 72);
    let sum = 0;
    for (let i = 0; i < g.length; i++) {
        g[i] = px[i * 4] * 0.299 + px[i * 4 + 1] * 0.587 + px[i * 4 + 2] * 0.114;
        sum += g[i];
    }
    const mean = sum / g.length;
    let lap = 0, lapSq = 0, n = 0;
    for (let y = 1; y < 71; y++)
        for (let xx = 1; xx < 71; xx++) {
            const i = y * 72 + xx;
            const v = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - 72] - g[i + 72];
            lap += v;
            lapSq += v * v;
            n++;
        }
    const sharp = lapSq / n - (lap / n) ** 2;
    const h = new OffscreenCanvas(9, 8);
    const hx = h.getContext("2d", { willReadFrequently: true });
    hx.drawImage(img, 0, 0, 9, 8);
    const hp = hx.getImageData(0, 0, 9, 8).data;
    let hash = "";
    for (let y = 0; y < 8; y++)
        for (let xx = 0; xx < 8; xx++) {
            const a = (y * 9 + xx) * 4;
            hash += hp[a] + hp[a + 1] + hp[a + 2] > hp[a + 4] + hp[a + 5] + hp[a + 6] ? "1" : "0";
        }
    return { sharp, mean, hash };
};
const hamming = (a, b) => { let d = 0; for (let i = 0; i < a.length; i++)
    if (a[i] !== b[i])
        d++; return d; };
/**
 * Samples the album evenly, scores each photo (sharp, well exposed, popular) and keeps
 * the best ones that are not near-duplicates of each other (bursts are common at events).
 */
export async function autoPick(ids, want, popular, onProgress) {
    const sampleSize = Math.min(ids.length, Math.max(want * 3, 24));
    const step = ids.length / sampleSize;
    const sample = Array.from({ length: sampleSize }, (_, i) => ids[Math.floor(i * step)]);
    for (const id of popular)
        if (ids.includes(id) && !sample.includes(id))
            sample.push(id);
    const loaded = [];
    let cursor = 0, done = 0;
    const worker = async () => {
        while (cursor < sample.length) {
            const id = sample[cursor++];
            try {
                const img = await loadBitmap(id, 900);
                const { sharp, mean, hash } = analyse(img);
                const exposure = mean < 28 ? -1.2 : mean < 45 ? -0.4 : mean > 225 ? -0.6 : 0;
                loaded.push({ id, img, portrait: img.height > img.width * 1.05, hash, score: Math.log10(1 + sharp) + exposure + (popular.has(id) ? 1.5 : 0) });
            }
            catch { /* skip unreadable photo */ }
            onProgress(++done, sample.length);
        }
    };
    await Promise.all(Array.from({ length: 4 }, worker));
    loaded.sort((a, b) => b.score - a.score);
    const picked = [];
    for (const p of loaded) {
        if (picked.length >= want)
            break;
        if (picked.some(q => hamming(q.hash, p.hash) <= 12))
            continue;
        picked.push(p);
    }
    // Keep the event's own order (sequence through the night), not score order.
    const order = new Map(ids.map((id, i) => [id, i]));
    for (const photo of loaded) if (!picked.includes(photo)) photo.img.close?.();
    return picked.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}
/** Reloads chosen photos at full preview size for crisp output. */
export const upgradePhotos = async (photos) => Promise.all(photos.map(async (p) => {
    try {
        return { ...p, img: await loadBitmap(p.id, 1600) };
    }
    catch {
        return p;
    }
}));
const rounded = (x, X, Y, W, H, r) => {
    x.beginPath();
    x.moveTo(X + r, Y);
    x.arcTo(X + W, Y, X + W, Y + H, r);
    x.arcTo(X + W, Y + H, X, Y + H, r);
    x.arcTo(X, Y + H, X, Y, r);
    x.arcTo(X, Y, X + W, Y, r);
    x.closePath();
};
/** Draws an image covering the box (centre-weighted slightly upward, where faces usually are). */
const cover = (x, img, X, Y, W, H, opts = {}) => {
    const zoom = opts.zoom ?? 1;
    const scale = Math.max(W / img.width, H / img.height) * zoom;
    const dw = img.width * scale, dh = img.height * scale;
    const dx = X + (W - dw) * (0.5 + (opts.panX ?? 0)), dy = Y + (H - dh) * (0.4 + (opts.panY ?? 0));
    x.save();
    if (opts.radius) {
        rounded(x, X, Y, W, H, opts.radius);
        x.clip();
    }
    else {
        x.beginPath();
        x.rect(X, Y, W, H);
        x.clip();
    }
    x.drawImage(img, dx, dy, dw, dh);
    x.restore();
};
const text = (x, s, X, Y, size, opts) => {
    x.save();
    x.font = `${opts.weight ?? 600} ${size}px ${FONT}`;
    x.fillStyle = opts.color;
    x.textAlign = opts.align ?? "left";
    x.textBaseline = "alphabetic";
    if ("letterSpacing" in x)
        x.letterSpacing = `${opts.spacing ?? 0}px`;
    // Shrink to fit instead of overflowing the frame.
    let s2 = size;
    const edgeWidth = opts.align === "center" ? Math.min(X, x.canvas.width - X) * 2 - 80 : opts.align === "right" ? X - 40 : x.canvas.width - X - 40;
    const maxWidth = Math.min(opts.maxWidth ?? Infinity, Math.max(80, edgeWidth));
    while (x.measureText(s).width > maxWidth && s2 > 12) {
        s2 -= 2;
        x.font = `${opts.weight ?? 600} ${s2}px ${FONT}`;
    }
    x.fillText(s, X, Y);
    x.restore();
};
const shadeBottom = (x, W, H, from, alpha = 0.78) => {
    const g = x.createLinearGradient(0, H * from, 0, H);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${alpha})`);
    x.fillStyle = g;
    x.fillRect(0, H * from, W, H * (1 - from));
};
const pill = (x, label, cx, cy, size, bg, fg) => {
    x.save();
    x.font = `700 ${size}px ${FONT}`;
    const available = Math.max(140, Math.min(cx, x.canvas.width - cx) * 2 - 48);
    while (x.measureText(label).width + size * 1.8 > available && size > 14) { size -= 2; x.font = `700 ${size}px ${FONT}`; }
    const w = x.measureText(label).width + size * 1.8, h = size * 2.1;
    rounded(x, cx - w / 2, cy - h / 2, w, h, h / 2);
    x.fillStyle = bg;
    x.fill();
    x.restore();
    text(x, label, cx, cy + size * 0.36, size, { weight: 700, color: fg, align: "center" });
};
const wordmark = (x, X, Y, color, align = "left") => text(x, "JIM LIN · PHOTOGRAPHY", X, Y, 30, { weight: 600, color, align, spacing: 6 });
const themeDecor = (x, theme, W, H) => {
    if (theme === "crush") {
        const g = x.createRadialGradient(W * .88, H * .12, 10, W * .88, H * .12, W * .48);
        g.addColorStop(0, "rgba(255,79,163,.42)");
        g.addColorStop(1, "rgba(255,79,163,0)");
        x.fillStyle = g;
        x.fillRect(0, 0, W, H);
        x.save();
        x.strokeStyle = "rgba(255,187,226,.38)";
        x.lineWidth = 5;
        for (let i = 0; i < 3; i++) {
            x.beginPath();
            x.arc(W - 105 - i * 36, 120 + i * 30, 46 + i * 18, 0, Math.PI * 2);
            x.stroke();
        }
        x.restore();
    }
    if (theme === "halloween") {
        const g = x.createRadialGradient(W * .85, H * .1, 12, W * .85, H * .1, W * .35);
        g.addColorStop(0, "rgba(255,138,31,.4)");
        g.addColorStop(1, "rgba(255,138,31,0)");
        x.fillStyle = g;
        x.fillRect(0, 0, W, H);
        x.save();
        x.strokeStyle = "rgba(255,244,223,.26)";
        x.lineWidth = 3;
        for (let i = 1; i <= 4; i++) {
            x.beginPath();
            x.arc(W, 0, i * 58, 0, Math.PI / 2);
            x.stroke();
        }
        for (let a = .18; a < 1.5; a += .32) {
            x.beginPath();
            x.moveTo(W, 0);
            x.lineTo(W - Math.cos(a) * 250, Math.sin(a) * 250);
            x.stroke();
        }
        x.restore();
    }
};
const campaignMark = (x, theme, X, Y) => {
    if (theme === "crush")
        pill(x, "BACHATA CRUSH · SOON", X, Y, 24, "#ff4fa3", "#26051f");
    if (theme === "halloween")
        pill(x, "HALLOWEEN DANCE NIGHT", X, Y, 24, "#ff8a1f", "#1a0d06");
};
const framedPhoto = (x, img, X, Y, W, H, angle, border) => {
    x.save();
    x.translate(X + W / 2, Y + H / 2);
    x.rotate(angle);
    x.shadowColor = "rgba(0,0,0,.35)";
    x.shadowBlur = 40;
    x.shadowOffsetY = 18;
    rounded(x, -W / 2 - 12, -H / 2 - 12, W + 24, H + 24, 22);
    x.fillStyle = border;
    x.fill();
    x.shadowColor = "transparent";
    cover(x, img, -W / 2, -H / 2, W, H, { radius: 14 });
    x.restore();
};
const toBlob = async (c, type = "image/jpeg") => c.convertToBlob({ type, quality: 0.92 });
/* ---------------- Stories 1080x1920 ----------------
   IG covers roughly the top 250px and bottom 340px with its own UI, so all key
   text sits between y≈260 and y≈1560; the bottom is left free for a link sticker. */
const SW = 1080, SH = 1920;
export async function renderStories(photos, info, theme) {
    const pal = palette(theme);
    const out = [];
    const portraits = [...photos.filter(p => p.portrait), ...photos.filter(p => !p.portrait)];
    const date = `2026.${dateLabel(info.date)}`;
    // 1. New photos are up: headline + stacked prints.
    {
        const c = new OffscreenCanvas(SW, SH);
        const x = c.getContext("2d");
        x.fillStyle = pal.bg;
        x.fillRect(0, 0, SW, SH);
        themeDecor(x, theme, SW, SH);
        campaignMark(x, theme, 820, 300);
        wordmark(x, 90, 300, pal.sub);
        text(x, info.headline, 90, 420, 84, { weight: 800, color: pal.fg, maxWidth: 900 });
        text(x, info.venue, 90, 560, 150, { weight: 800, color: pal.fg, spacing: -3, maxWidth: 900 });
        text(x, `${date}  ·  ${info.count} ${tr(info, "張", "photos", "장")}`, 90, 640, 44, { weight: 500, color: pal.sub });
        const [a, b2, c2] = [portraits[0], portraits[1] ?? portraits[0], portraits[2] ?? portraits[0]];
        framedPhoto(x, b2.img, 70, 760, 420, 560, -0.07, pal.card);
        framedPhoto(x, c2.img, 590, 790, 420, 560, 0.07, pal.card);
        framedPhoto(x, a.img, 250, 700, 580, 760, 0, pal.card);
        pill(x, tr(info, "到網站用自拍找你自己 ↗", "Find your photos with a selfie ↗", "셀카로 내 사진 찾기 ↗"), SW / 2, 1555, 46, pal.accent, pal.onAccent);
        out.push(await asset(c, "story-1-new-photos.jpg", "story"));
    }
    // 2. One hero photo, full bleed.
    {
        const c = new OffscreenCanvas(SW, SH);
        const x = c.getContext("2d");
        cover(x, portraits[0].img, 0, 0, SW, SH);
        const g = x.createLinearGradient(0, 0, 0, 420);
        g.addColorStop(0, "rgba(0,0,0,.45)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        x.fillStyle = g;
        x.fillRect(0, 0, SW, 420);
        shadeBottom(x, SW, SH, 0.5, 0.85);
        campaignMark(x, theme, 800, 300);
        wordmark(x, 90, 300, "rgba(255,255,255,.85)");
        text(x, info.venue, 90, 1380, 140, { weight: 800, color: "#fff", spacing: -3, maxWidth: 900 });
        text(x, date, 90, 1460, 48, { weight: 500, color: "rgba(255,255,255,.75)" });
        text(x, tr(info, `完整照片在網站 · 分享請標記 ${info.handle}`, `All photos online · Tag ${info.handle}`, `전체 사진은 웹사이트에서 · ${info.handle} 태그`), 90, 1545, 38, { weight: 600, color: "#fff", maxWidth: 900 });
        out.push(await asset(c, "story-2-hero.jpg", "story"));
    }
    // 3. "Which one are you?" 3x3 grid.
    {
        const c = new OffscreenCanvas(SW, SH);
        const x = c.getContext("2d");
        x.fillStyle = pal.bg;
        x.fillRect(0, 0, SW, SH);
        themeDecor(x, theme, SW, SH);
        campaignMark(x, theme, 820, 300);
        text(x, tr(info, "你在哪一張？", "Can you spot yourself?", "어디에 있나요?"), SW / 2, 400, 104, { weight: 800, color: pal.fg, align: "center" });
        text(x, `${info.venue} · ${date}`, SW / 2, 470, 42, { weight: 500, color: pal.sub, align: "center" });
        const cell = 312, gap = 12, left = (SW - cell * 3 - gap * 2) / 2, top = 540;
        for (let i = 0; i < 9; i++) {
            const p = photos[i % photos.length];
            cover(x, p.img, left + (i % 3) * (cell + gap), top + Math.floor(i / 3) * (cell + gap), cell, cell, { radius: 18 });
        }
        pill(x, tr(info, "上傳自拍，找自己的照片", "Upload a selfie to find your photos", "셀카로 내 사진을 찾아보세요"), SW / 2, 1555, 44, pal.accent, pal.onAccent);
        out.push(await asset(c, "story-3-find-yourself.jpg", "story"));
    }
    return out;
}
/* ---------------- Carousel post 1080x1350 ---------------- */
const PW = 1080, PH = 1350;
export async function renderCarousel(photos, info, theme) {
    const pal = palette(theme);
    const out = [];
    const date = `2026.${dateLabel(info.date)}`;
    const slides = photos.slice(1, 9);
    const total = slides.length + 2;
    const counter = (x, i) => {
        x.save();
        x.font = `600 26px ${FONT}`;
        const label = `${i} / ${total}`;
        const w = x.measureText(label).width + 34;
        rounded(x, PW - 50 - w, 46, w, 48, 24);
        x.fillStyle = "rgba(0,0,0,.45)";
        x.fill();
        x.restore();
        text(x, label, PW - 50 - w / 2, 79, 26, { weight: 600, color: "#fff", align: "center" });
    };
    // Cover
    {
        const c = new OffscreenCanvas(PW, PH);
        const x = c.getContext("2d");
        cover(x, photos[0].img, 0, 0, PW, PH);
        shadeBottom(x, PW, PH, 0.45, 0.85);
        campaignMark(x, theme, 790, 100);
        wordmark(x, 64, 1090, "rgba(255,255,255,.8)");
        text(x, info.venue, 60, 1210, 130, { weight: 800, color: "#fff", spacing: -3, maxWidth: 760 });
        text(x, date, 64, 1280, 42, { weight: 500, color: "rgba(255,255,255,.78)" });
        text(x, tr(info, "滑動看更多 →", "Swipe for more →", "넘겨서 더 보기 →"), PW - 64, 1280, 36, { weight: 700, color: "#fff", align: "right" });
        counter(x, 1);
        out.push(await asset(c, "post-01-cover.jpg", "post"));
    }
    // Photo slides
    for (let i = 0; i < slides.length; i++) {
        const c = new OffscreenCanvas(PW, PH);
        const x = c.getContext("2d");
        cover(x, slides[i].img, 0, 0, PW, PH);
        const g = x.createLinearGradient(0, PH - 220, 0, PH);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(1, "rgba(0,0,0,.45)");
        x.fillStyle = g;
        x.fillRect(0, PH - 220, PW, 220);
        text(x, info.handle, PW - 48, PH - 48, 30, { weight: 600, color: "rgba(255,255,255,.88)", align: "right" });
        counter(x, i + 2);
        out.push(await asset(c, `post-${String(i + 2).padStart(2, "0")}.jpg`, "post"));
    }
    // Call to action
    {
        const c = new OffscreenCanvas(PW, PH);
        const x = c.getContext("2d");
        x.fillStyle = pal.bg;
        x.fillRect(0, 0, PW, PH);
        themeDecor(x, theme, PW, PH);
        campaignMark(x, theme, 790, 100);
        const cell = 232, gap = 14, left = (PW - cell * 4 - gap * 3) / 2;
        for (let i = 0; i < 4; i++)
            cover(x, photos[(i + 1) % photos.length].img, left + i * (cell + gap), 150, cell, cell * 1.25, { radius: 16 });
        text(x, tr(info, `完整 ${info.count} 張照片`, `${info.count} photos`, `${info.count}장의 사진`), PW / 2, 640, 88, { weight: 800, color: pal.fg, align: "center", maxWidth: 960 });
        text(x, tr(info, "已上線", "Now online", "지금 공개"), PW / 2, 740, 88, { weight: 800, color: pal.fg, align: "center" });
        text(x, tr(info, "到網站上傳自拍，自動找出你的照片", "Upload a selfie on the site to find yours", "웹사이트에서 셀카로 내 사진 찾기"), PW / 2, 850, 42, { weight: 500, color: pal.sub, align: "center", maxWidth: 960 });
        pill(x, tr(info, "連結在主頁 ↗", "Link in bio ↗", "프로필 링크 ↗"), PW / 2, 990, 44, pal.accent, pal.onAccent);
        text(x, tr(info, `分享時請標記 ${info.handle} 🙏`, `Please tag ${info.handle} 🙏`, `공유할 때 ${info.handle} 태그 🙏`), PW / 2, 1160, 38, { weight: 600, color: pal.fg, align: "center" });
        text(x, info.siteUrl.replace(/^https?:\/\//, ""), PW / 2, 1220, 32, { weight: 500, color: pal.sub, align: "center" });
        counter(x, total);
        out.push(await asset(c, `post-${String(total).padStart(2, "0")}-cta.jpg`, "post"));
    }
    return out;
}
/* ---------------- Reel (MP4, H.264, 1080x1920, 30fps) ---------------- */
const FPS = 30;
const ease = (t) => t * t * (3 - 2 * t);
/** Draws one frame of the reel at time t (seconds). */
const reelFrame = (x, photos, info, theme, t, timeline) => {
    const pal = palette(theme);
    const { intro, per, fade } = timeline;
    const showEnd = intro + photos.length * per;
    x.fillStyle = "#000";
    x.fillRect(0, 0, SW, SH);
    const drawPhoto = (i, local, alpha) => {
        const p = photos[(i + photos.length) % photos.length];
        const progress = Math.min(1, Math.max(0, local / (per + fade)));
        const zoom = 1.04 + 0.08 * (i % 2 === 0 ? progress : 1 - progress);
        x.save();
        x.globalAlpha = alpha;
        if (p.portrait)
            cover(x, p.img, 0, 0, SW, SH, { zoom, panX: (i % 3 - 1) * 0.04 * progress });
        else {
            // Landscape photo in a vertical video: show it whole, over a blurred, darkened copy of itself.
            x.save();
            x.filter = "blur(36px) brightness(0.55)";
            cover(x, p.img, -60, -60, SW + 120, SH + 120);
            x.restore();
            const w = SW * zoom, h = (p.img.height / p.img.width) * w;
            x.shadowColor = "rgba(0,0,0,.45)";
            x.shadowBlur = 50;
            x.drawImage(p.img, (SW - w) / 2 + (i % 3 - 1) * 20 * progress, (SH - h) / 2 - 80, w, h);
            x.shadowColor = "transparent";
        }
        x.restore();
    };
    if (t < showEnd) {
        const k = Math.max(0, Math.floor((t - intro) / per));
        const local = t - intro - k * per;
        if (t < intro)
            drawPhoto(0, t + per * 0.2, 1);
        else {
            drawPhoto(k, local, 1);
            if (local > per - fade && k + 1 < photos.length)
                drawPhoto(k + 1, local - per, ease((local - (per - fade)) / fade));
        }
        // Title card over the opening.
        if (t < intro + per) {
            const a = t < 0.2 ? t / 0.2 : t > intro + per * 0.6 ? Math.max(0, 1 - (t - intro - per * 0.6) / (per * 0.4)) : 1;
            x.save();
            x.globalAlpha = a;
            shadeBottom(x, SW, SH, 0.45, 0.85);
            wordmark(x, 90, 1260, "rgba(255,255,255,.85)");
            text(x, info.venue, 90, 1420, 150, { weight: 800, color: "#fff", spacing: -3, maxWidth: 900 });
            text(x, `2026.${dateLabel(info.date)}`, 90, 1500, 52, { weight: 500, color: "rgba(255,255,255,.8)" });
            x.restore();
        }
        text(x, info.handle, SW - 70, 1560, 34, { weight: 600, color: "rgba(255,255,255,.85)", align: "right" });
    }
    else {
        const local = t - showEnd;
        const a = Math.min(1, local / 0.35);
        drawPhoto(photos.length - 1, per, 1);
        x.save();
        x.globalAlpha = a;
        x.fillStyle = pal.bg;
        x.globalAlpha = a * 0.92;
        x.fillRect(0, 0, SW, SH);
        x.globalAlpha = a;
        text(x, tr(info, `${info.count} 張照片已上線`, `${info.count} photos are up`, `${info.count}장의 사진 공개`), SW / 2, 820, 96, { weight: 800, color: pal.fg, align: "center", maxWidth: 960 });
        text(x, tr(info, "上傳自拍，自動找到你", "Upload a selfie to find yourself", "셀카로 내 사진 찾기"), SW / 2, 920, 52, { weight: 500, color: pal.sub, align: "center" });
        pill(x, tr(info, "連結在主頁 ↗", "Link in bio ↗", "프로필 링크 ↗"), SW / 2, 1080, 50, pal.accent, pal.onAccent);
        text(x, tr(info, `分享請標記 ${info.handle}`, `Please tag ${info.handle}`, `공유 시 ${info.handle} 태그`), SW / 2, 1260, 44, { weight: 600, color: pal.fg, align: "center" });
        x.restore();
    }
};
export async function renderReel(photos, info, theme, onProgress) {
    const list = photos.slice(0, 12);
    const timeline = { intro: 1.2, per: 1.0, fade: 0.3, outro: 2.2 };
    const duration = timeline.intro + list.length * timeline.per + timeline.outro;
    const frames = Math.round(duration * FPS);
    const canvas = new OffscreenCanvas(SW, SH);
    const x = canvas.getContext("2d");
    const VE = globalThis.VideoEncoder;
    let config = null;
    if (VE) {
        for (const codec of ["avc1.640028", "avc1.4d0028", "avc1.42003e"]) {
            const candidate = { codec, width: SW, height: SH, bitrate: 9_000_000, framerate: FPS, avc: { format: "avc" } };
            try {
                if ((await VE.isConfigSupported(candidate)).supported) {
                    config = candidate;
                    break;
                }
            }
            catch { /* try next */ }
        }
    }
    console.info("[studio] reel encoder:", config ? `WebCodecs ${config.codec}` : "MediaRecorder fallback", "frames:", frames);
    const started = performance.now();
    if (VE && config) {
        const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: "avc", width: SW, height: SH, frameRate: FPS }, fastStart: "in-memory" });
        let failure = null;
        const encoder = new VE({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: e => { failure = e; } });
        encoder.configure(config);
        for (let i = 0; i < frames; i++) {
            if (failure)
                throw failure;
            reelFrame(x, list, info, theme, i / FPS, timeline);
            const frame = new VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
            encoder.encode(frame, { keyFrame: i % (FPS * 2) === 0 });
            frame.close();
            while (encoder.encodeQueueSize > 6)
                await new Promise(r => setTimeout(r, 5));
            if (i % 10 === 0) {
                onProgress(i / frames);
                await new Promise(r => setTimeout(r, 0));
            }
        }
        await encoder.flush();
        encoder.close();
        muxer.finalize();
        console.info("[studio] reel encoded in", Math.round(performance.now() - started), "ms");
        if (failure)
            throw failure;
        onProgress(1);
        const blob = new Blob([muxer.target.buffer], { type: "video/mp4" });
        return { name: "reel.mp4", kind: "reel", blob, url: URL.createObjectURL(blob), width: SW, height: SH };
    }
    // Fallback for browsers without WebCodecs H.264: record a real-time canvas stream.
    const visible = document.createElement("canvas");
    visible.width = SW;
    visible.height = SH;
    const vx = visible.getContext("2d");
    // Frames are pushed manually and paced to the wall clock, so a slow device produces a
    // choppier video of the right length instead of a shortened one.
    const stream = visible.captureStream(0);
    const track = stream.getVideoTracks()[0];
    const mime = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find(m => MediaRecorder.isTypeSupported(m)) ?? "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 9_000_000 });
    const chunks = [];
    recorder.ondataavailable = e => { if (e.data.size)
        chunks.push(e.data); };
    const stopped = new Promise(r => { recorder.onstop = r; });
    recorder.start(250);
    const begin = performance.now();
    for (let i = 0; i < frames; i++) {
        const due = begin + (i * 1000) / FPS;
        const wait = due - performance.now();
        if (wait > 0)
            await new Promise(r => setTimeout(r, wait));
        // Render whatever moment the clock has reached, skipping frames if the device is slow.
        const t = Math.min(duration, (performance.now() - begin) / 1000);
        reelFrame(vx, list, info, theme, t, timeline);
        track.requestFrame?.();
        if (i % 10 === 0)
            onProgress(t / duration);
        if (t >= duration)
            break;
    }
    await new Promise(r => setTimeout(r, Math.max(0, begin + duration * 1000 - performance.now()) + 200));
    recorder.stop();
    await stopped;
    const type = mime.split(";")[0];
    const blob = new Blob(chunks, { type });
    return { name: type === "video/mp4" ? "reel.mp4" : "reel.webm", kind: "reel", blob, url: URL.createObjectURL(blob), width: SW, height: SH };
}
/* ---------------- Captions ---------------- */
export function buildCaptions(info, hashtags) {
    const date = '2026.' + dateLabel(info.date), tags = hashtags.trim(), url = info.siteUrl;
    const english = info.venue + ' · ' + date + '\n\n' + info.count + ' photos are up 📸\nUpload a selfie to find yours: ' + url + '\nPlease tag ' + info.handle + ' when sharing 🙏\n\n' + tags;
    const korean = info.venue + ' · ' + date + '\n\n' + info.count + '장의 사진 공개 📸\n셀카로 내 사진을 찾아보세요: ' + url + '\n공유할 때 ' + info.handle + ' 태그 부탁드려요 🙏\n\n' + tags;
    return {
        post: tr(info, info.venue + ' · ' + date + '\n\n' + info.count + ' 張照片已上線 📸\n上傳自拍，找出你的照片：' + url + '\n分享時請標記 ' + info.handle + ' 🙏\n\n' + tags, english, korean),
        reel: tr(info, info.venue + ' 的夜晚 ✨ ' + date + '\n完整照片：' + url + '\n分享請標記 ' + info.handle + '\n\n' + tags, info.venue + ' at night ✨ ' + date + '\nAll photos: ' + url + '\nTag ' + info.handle + '\n\n' + tags, info.venue + '의 밤 ✨ ' + date + '\n전체 사진: ' + url + '\n' + info.handle + ' 태그\n\n' + tags),
        story: tr(info, info.venue + ' 照片上線了！\n用自拍找自己 👇\n' + url, info.venue + ' photos are up!\nFind yours with a selfie 👇\n' + url, info.venue + ' 사진 공개!\n셀카로 내 사진 찾기 👇\n' + url), english, korean
    };
}
async function asset(c, name, kind) {
    const blob = await toBlob(c);
    return { name, kind, blob, url: URL.createObjectURL(blob), width: c.width, height: c.height };
}
