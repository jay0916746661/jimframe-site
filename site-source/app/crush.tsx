"use client";
// 10.15 Taiwan Bachata Crush：首頁主推區塊、影片區、影片轉限動編輯器。
// 影片與縮圖放在 GitHub Pages（有 CORS，可直接在瀏覽器畫進 canvas）。
import { useEffect, useRef, useState } from "react";

type Lang = "zh" | "en" | "ko";
type Template = "full" | "frame" | "partner";

export const CRUSH_BASE = "https://jay0916746661.github.io/jimframe-site/videos/1015/";
const PREVIEW_SECONDS = 25;
const previewLen = (n: string) => (n === "11" ? 18 : PREVIEW_SECONDS);
const PRICE_TW = "NT$300";
const PRICE_US = "US$10";
const LINE_URL = "https://line.me/ti/p/~jim0916746661";
const IG_URL = "https://www.instagram.com/jimframe/";

// [編號, 完整版長度（秒）]
export const CRUSH_CLIPS: [string, number][] = [["00",54.5],["01",38.5],["02",53],["03",63.5],["04",38],["06",55.5],["07",82.5],["08",75],["10",70.5],["11",20],["12",75],["13",106],["14",51],["15",214],["16",157.5],["17",95],["18",80],["19",67.5],["20",59.5],["21",83],["24",43.5],["25",78],["26",101.5]];

// 每支影片事先挑好的「最清楚畫面」秒數（限動編輯器的建議畫面）。由 scripts 產生後貼上。
export const CRUSH_CANDIDATES: Record<string, number[]> = {"00":[8.9,11.9,14.4,18.65,21.15],"01":[3.4,7.65,11.65,15.65,18.4],"02":[3.15,8.15,13.15,17.4,21.9],"03":[5.4,8.4,13.15,17.15,22.4],"04":[3.15,8.4,13.15,17.15,21.9],"06":[5.65,11.9,14.4,19.9,23.15],"07":[6.15,11.9,16.4,19.15,23.4],"08":[3.65,9.15,13.15,17.15,21.15],"10":[5.9,12.4,15.15,17.9,21.65],"11":[3.65,6.15,9.4,11.9,14.65],"12":[3.15,5.65,8.15,16.15,21.4],"13":[4.65,7.65,15.4,18.4,21.4],"14":[3.15,7.65,10.9,16.4,20.15],"15":[3.4,5.9,11.15,19.15,22.65],"16":[3.9,6.4,9.15,19.9,23.4],"17":[5.9,9.65,13.15,17.65,21.9],"18":[5.65,14.15,16.9,19.4,21.9],"19":[3.9,6.4,17.65,20.15,23.15],"20":[4.4,8.65,12.4,14.9,21.9],"21":[4.15,7.9,15.15,17.9,21.4],"24":[3.65,6.65,9.9,13.15,22.4],"25":[3.15,6.15,9.65,17.15,22.9],"26":[3.9,6.9,17.4,20.15,23.15]};

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const t = (lang: Lang, zh: string, en: string) => (lang === "zh" ? zh : en);

const Svg = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
const IC = {
  face: "M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 0 0 5 0",
  photo: "M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11ZM4 15l4.5-4.5L13 15m-2-2 2.5-2.5L20 17M15.5 8.5h.01",
  play: "M7 5.5v13l11-6.5-11-6.5Z",
  download: "M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14",
  story: "M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 15h4",
  close: "M6 6l12 12M18 6 6 18",
};

/* ---------------- 首頁主推 ---------------- */
export function CrushPromo({ language, cover, photoCount, onPhotos, onFind }: { language: Lang; cover: string[]; photoCount: number; onPhotos: () => void; onFind: () => void }) {
  return <section className="crush-promo" aria-labelledby="crush-title">
    <div className="crush-promo-bg" aria-hidden="true">{cover.slice(0, 6).map(src => <img key={src} src={src} alt="" loading="lazy" />)}</div>
    <div className="crush-promo-body">
      <p className="crush-eyebrow">{t(language, "活動照片＋影片上線", "PHOTOS & VIDEOS ARE UP")} · 2026.10.15</p>
      <img className="crush-logo" src={`${CRUSH_BASE}crush-logo.png`} alt="Taiwan Bachata Crush" width={420} height={246} />
      <h2 id="crush-title" className="visually-hidden">Taiwan Bachata Crush 10.15</h2>
      <p className="crush-sub">{t(language, `${photoCount} 張照片、23 支影片。上傳一張自拍，AI 幫你從整晚的照片裡找出你和朋友。`, `${photoCount} photos and 23 dance clips. Upload one selfie and we’ll find you — and your friends — in every photo.`)}</p>
      <div className="crush-actions">
        <button type="button" className="crush-cta crush-cta-primary" onClick={onFind}><Svg d={IC.face} />{t(language, "找自己和朋友", "Find me & my friends")}</button>
        <button type="button" className="crush-cta" onClick={onPhotos}><Svg d={IC.photo} />{t(language, "看照片", "Photos")}</button>
        <a className="crush-cta" href="#videos"><Svg d={IC.play} />{t(language, "看影片", "Videos")}</a>
      </div>
      <ul className="crush-points">
        <li>{t(language, "✓ 自拍找人：一次可上傳 3 張，連朋友一起找", "✓ Selfie search: up to 3 faces, friends included")}</li>
        <li>{t(language, "✓ 影片 25 秒試看免費下載，可做成限動", "✓ Free 25-sec clips, turn any moment into a Story")}</li>
      </ul>
    </div>
  </section>;
}

/* ---------------- 影片區 ---------------- */
export function CrushVideos({ language, confirmCredit }: { language: Lang; confirmCredit: () => boolean }) {
  const [story, setStory] = useState<string | null>(null);
  const [buy, setBuy] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const grid = gridRef.current; if (!grid) return;
    const onPlay = (e: Event) => grid.querySelectorAll("video").forEach(v => { if (v !== e.target) v.pause(); });
    grid.addEventListener("play", onPlay, true); return () => grid.removeEventListener("play", onPlay, true);
  }, []);
  const download = async (n: string) => {
    if (!confirmCredit()) return;
    const name = `JimFrame_1015-BachataCrush_${n}_${previewLen(n)}s.mp4`;
    try {
      const res = await fetch(`${CRUSH_BASE}bc-${n}.mp4`); if (!res.ok) throw new Error();
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch { window.open(`${CRUSH_BASE}bc-${n}.mp4`, "_blank", "noreferrer"); }
  };
  return <section className="section" id="videos">
    <div className="section-head"><div>
      <h2 className="title2">{t(language, "影片 · 10.15 Bachata Crush", "Videos · 10.15 Bachata Crush")}</h2>
      <p className="footnote">{t(language, `每支 25 秒試看（含開場特效）免費下載，也能挑一個畫面做成限動。完整版每支 ${PRICE_TW}／${PRICE_US}。`, `Each 25-sec clip (with the opening effect) is free to download, and you can turn any frame into a Story. Full-length video: ${PRICE_US} each.`)}</p>
    </div></div>
    <div className="crush-video-grid" ref={gridRef}>
      {CRUSH_CLIPS.map(([n, full]) => <article className="crush-video-card" key={n}>
        <div className="crush-video-frame">
          <video src={`${CRUSH_BASE}bc-${n}.mp4`} poster={`${CRUSH_BASE}bc-${n}.jpg`} preload="none" playsInline controls controlsList="nodownload" crossOrigin="anonymous" aria-label={`10.15 Bachata Crush #${n}`} />
          <span className="crush-badge">{t(language, `${previewLen(n)} 秒試看`, `${previewLen(n)}s preview`)}</span>
        </div>
        <div className="crush-video-meta">
          <div className="crush-video-title"><b>#{n}</b><small>{t(language, "完整版", "Full")} {mmss(full)}</small></div>
          <div className="crush-video-actions">
            <button type="button" className="button button-gray" onClick={() => void download(n)}><Svg d={IC.download} />{t(language, "下載試看", "Download")}</button>
            <button type="button" className="button button-gray" onClick={() => setStory(n)}><Svg d={IC.story} />{t(language, "做限動", "Story")}</button>
            <button type="button" className="button button-filled crush-buy" onClick={() => setBuy(n)}>{t(language, `完整版 ${PRICE_TW}`, `Full video ${PRICE_US}`)}</button>
          </div>
        </div>
      </article>)}
    </div>
    {story && <StoryEditor language={language} clip={story} onClose={() => setStory(null)} />}
    {buy && <BuySheet language={language} clip={buy} onClose={() => setBuy(null)} />}
  </section>;
}

function BuySheet({ language, clip, onClose }: { language: Lang; clip: string; onClose: () => void }) {
  const full = CRUSH_CLIPS.find(c => c[0] === clip)?.[1] ?? 0;
  const [copied, setCopied] = useState(false);
  return <div className="story-maker-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="story-maker crush-buy-sheet" role="dialog" aria-modal="true" aria-label={t(language, "購買完整版", "Buy full video")}>
      <header><div><h2>{t(language, `購買完整版 · #${clip}`, `Full video · #${clip}`)}</h2><p>10.15 Taiwan Bachata Crush · {mmss(full)}</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="關閉"><Svg d={IC.close} /></button></header>
      <div className="crush-price"><span>{t(language, "完整長度、高畫質", "Full length, high quality")}</span><b>{PRICE_TW} / {PRICE_US}</b></div>
      <ol className="crush-steps">
        <li>{t(language, "加 LINE：", "Add LINE: ")}<b>jim0916746661</b>{t(language, "（海外朋友可用 IG 私訊）", " (or DM on Instagram)")}</li>
        <li>{t(language, `傳送影片編號 #${clip}`, `Send the clip number #${clip}`)}</li>
        <li>{t(language, "收到付款資訊並付款", "Pay via the details I send you")}</li>
        <li>{t(language, "付款後用雲端連結傳完整版給你", "Receive the full video by cloud link")}</li>
      </ol>
      <div className="story-maker-actions">
        <button type="button" className="button button-gray" onClick={async () => { try { await navigator.clipboard.writeText(`10.15 Bachata Crush #${clip} 完整版`); setCopied(true); } catch { /* ignore */ } }}>{copied ? t(language, "已複製 ✓", "Copied ✓") : t(language, "複製編號", "Copy number")}</button>
        <a className="button button-gray" href={IG_URL} target="_blank" rel="noreferrer">IG</a>
        <a className="button button-filled" href={LINE_URL} target="_blank" rel="noreferrer">{t(language, "用 LINE 購買", "Buy on LINE")}</a>
      </div>
    </section>
  </div>;
}

/* ---------------- 影片 → 限動編輯器 ---------------- */
function StoryEditor({ language, clip, onClose }: { language: Lang; clip: string; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [time, setTime] = useState<number>(CRUSH_CANDIDATES[clip]?.[0] ?? 6);
  const [template, setTemplate] = useState<Template>("full");
  const [ready, setReady] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const candidates = CRUSH_CANDIDATES[clip] ?? [4, 8, 12, 16, 20];

  const seek = (s: number) => new Promise<void>(resolve => {
    const v = videoRef.current; if (!v) return resolve();
    if (Math.abs(v.currentTime - s) < 0.02) return resolve();
    const done = () => { v.removeEventListener("seeked", done); resolve(); };
    v.addEventListener("seeked", done); v.currentTime = s;
  });

  const render = (canvas: HTMLCanvasElement, scale = 1) => {
    const v = videoRef.current; if (!v || !v.videoWidth) return false;
    const W = 1080 * scale, H = 1920 * scale; canvas.width = W; canvas.height = H;
    const c = canvas.getContext("2d"); if (!c) return false;
    const font = (w: number, px: number) => `${w} ${px * scale}px -apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", sans-serif`;
    if (template === "full") { c.drawImage(v, 0, 0, W, H); return true; }
    const light = template === "partner";
    c.fillStyle = light ? "#f2efe9" : "#0b0b0d"; c.fillRect(0, 0, W, H);
    const box = template === "frame" ? { x: 90, y: 230, w: 900, h: 1500 } : { x: 120, y: 300, w: 840, h: 1290 };
    const bx = box.x * scale, by = box.y * scale, bw = box.w * scale, bh = box.h * scale;
    const s = Math.max(bw / v.videoWidth, bh / v.videoHeight); const dw = v.videoWidth * s, dh = v.videoHeight * s;
    c.save(); c.beginPath(); c.roundRect(bx, by, bw, bh, 34 * scale); c.clip(); c.drawImage(v, bx + (bw - dw) / 2, by + (bh - dh) / 2, dw, dh); c.restore();
    c.fillStyle = light ? "#111" : "#fff"; c.font = font(700, 40); c.fillText("TAIWAN BACHATA CRUSH", 90 * scale, 150 * scale);
    c.fillStyle = light ? "rgba(17,17,17,.6)" : "rgba(255,255,255,.66)"; c.font = font(500, 30); c.fillText("10.15.2026 · FILM BY JIM", 90 * scale, 196 * scale);
    if (template === "frame") {
      c.fillStyle = "#ff8a3d"; c.font = font(700, 34); c.fillText("@jimframe", 90 * scale, 1810 * scale);
      c.fillStyle = "rgba(255,255,255,.7)"; c.font = font(500, 28); c.fillText("@bachata_crush_tw  @flow.taipei", 90 * scale, 1856 * scale);
    } else {
      c.fillStyle = "#111"; c.font = font(700, 48); c.fillText(t(language, "和我跳舞的是 ↗", "Dancing with ↗"), 120 * scale, 1690 * scale);
      c.strokeStyle = "rgba(17,17,17,.35)"; c.lineWidth = 3 * scale; c.beginPath(); c.moveTo(120 * scale, 1760 * scale); c.lineTo(960 * scale, 1760 * scale); c.stroke();
      c.fillStyle = "rgba(17,17,17,.6)"; c.font = font(500, 28); c.fillText("@jimframe · @bachata_crush_tw", 120 * scale, 1830 * scale);
    }
    return true;
  };

  const redraw = () => { const cv = previewRef.current; if (cv) render(cv, 0.4); };
  useEffect(() => { if (ready) void seek(time).then(redraw); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [time, template, ready]);

  const exportStory = async (shareIt: boolean) => {
    setWorking(true); setError("");
    try {
      await seek(time);
      const canvas = document.createElement("canvas"); if (!render(canvas)) throw new Error("not ready");
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error("render")), "image/jpeg", 0.94));
      const file = new File([blob], `JimFrame_1015-BachataCrush_${clip}_story.jpg`, { type: "image/jpeg" });
      if (shareIt && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: "Taiwan Bachata Crush", text: "📸 @jimframe @bachata_crush_tw @flow.taipei" }); return; }
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) { if ((e as Error).name !== "AbortError") setError(t(language, "暫時無法輸出，請換一個畫面或稍後再試。", "Could not export. Try another frame or try again later.")); }
    finally { setWorking(false); }
  };

  return <div className="story-maker-backdrop" onClick={e => { if (e.target === e.currentTarget && !working) onClose(); }}>
    <section className="story-maker crush-editor" role="dialog" aria-modal="true" aria-label={t(language, "影片做成限動", "Video to Story")}>
      <header><div><h2>{t(language, `做成限動 · #${clip}`, `Make a Story · #${clip}`)}</h2><p>{t(language, "選一個畫面、套一個版型，1080 × 1920 直接發限動。", "Pick a moment, choose a layout — 1080 × 1920, ready for Stories.")}</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="關閉"><Svg d={IC.close} /></button></header>
      <div className="crush-editor-body">
        <div className="crush-editor-preview">
          <canvas ref={previewRef} width={432} height={768} aria-label={t(language, "限動預覽", "Story preview")} />
          {!ready && <p className="crush-loading">{t(language, "影片載入中…", "Loading video…")}</p>}
          <video ref={videoRef} src={`${CRUSH_BASE}bc-${clip}.mp4`} crossOrigin="anonymous" preload="auto" muted playsInline onLoadedData={() => setReady(true)} className="crush-hidden-video" />
        </div>
        <div className="crush-editor-controls">
          <p className="crush-label">{t(language, "建議畫面（最清楚的幾格）", "Suggested frames (sharpest)")}</p>
          <div className="crush-candidates">
            {candidates.map((s, i) => <button type="button" key={s} className={Math.abs(time - s) < 0.05 ? "is-selected" : ""} onClick={() => setTime(s)} aria-label={`${t(language, "畫面", "Frame")} ${i + 1}`}>
              <img src={`${CRUSH_BASE}cand-${clip}-${i + 1}.jpg`} alt="" loading="lazy" onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }} /><small>{s.toFixed(1)}s</small>
            </button>)}
          </div>
          <p className="crush-label">{t(language, "或自己挑時間", "Or scrub to any moment")} <b>{time.toFixed(1)}s</b></p>
          <input type="range" min={0} max={previewLen(clip) - 0.1} step={0.1} value={time} onChange={e => setTime(Number(e.target.value))} aria-label={t(language, "選擇時間", "Choose time")} className="crush-scrub" />
          <div className="crush-nudge"><button type="button" onClick={() => setTime(v => Math.max(0, +(v - 1 / 30).toFixed(3)))}>‹ {t(language, "前一格", "Prev frame")}</button><button type="button" onClick={() => setTime(v => Math.min(previewLen(clip) - 0.1, +(v + 1 / 30).toFixed(3)))}>{t(language, "下一格", "Next frame")} ›</button></div>
          <p className="crush-label">{t(language, "版型", "Layout")}</p>
          <div className="crush-templates" role="radiogroup">
            {([["full", t(language, "滿版", "Full"), t(language, "畫面原樣，含 Logo", "As is, with logos")], ["frame", t(language, "夜色相框", "Night frame"), t(language, "深色相框＋活動名", "Dark frame + event")], ["partner", t(language, "標記舞伴", "Tag partner"), t(language, "留白給你標舞伴", "Space to tag partner")]] as [Template, string, string][]).map(([id, label, note]) =>
              <button type="button" role="radio" aria-checked={template === id} key={id} className={template === id ? "is-selected" : ""} onClick={() => setTemplate(id)}><b>{label}</b><small>{note}</small></button>)}
          </div>
          {error && <p className="crush-error" role="alert">{error}</p>}
          <div className="story-maker-actions">
            <button type="button" className="button button-gray" disabled={!ready || working} onClick={() => void exportStory(false)}><Svg d={IC.download} />{t(language, "下載圖片", "Download")}</button>
            <button type="button" className="button button-filled" disabled={!ready || working} onClick={() => void exportStory(true)}>{working ? t(language, "製作中…", "Working…") : t(language, "分享到限動", "Share to Story")}</button>
          </div>
        </div>
      </div>
    </section>
  </div>;
}
