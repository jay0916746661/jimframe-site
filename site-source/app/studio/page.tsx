"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { albumData, hiddenPhotoIds, lowExposurePhotoIds } from "../albums-data";
import { makeStoredZip } from "../zip";
import { autoPick, buildCaptions, dateLabel, renderCarousel, renderReel, renderStories, upgradePhotos, type Asset, type LoadedPhoto, type Theme } from "./render";
import "./studio.css";

type Tab = "story" | "post" | "reel" | "caption";
const hidden = new Set([...hiddenPhotoIds, ...lowExposurePhotoIds]);
const albums = albumData.filter(a => !a.hidden).map(a => ({ ...a, key: `${a.date}-${a.venue}`, images: a.images.filter(id => !hidden.has(id)) })).sort((a, b) => b.date.localeCompare(a.date));
const campaignPreviewPhotos = albums.flatMap(a => a.images).slice(0, 8);
const DEFAULT_TAGS = "#jimframe #taipeidance #latindance #salsa #bachata #台北跳舞 #舞會攝影 #eventphotography";
const store = {
  get: (key: string, fallback: string) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
  set: (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode */ } },
};

export default function Studio() {
  const [albumKey, setAlbumKey] = useState(albums[0]?.key ?? "");
  const [theme, setTheme] = useState<Theme>("night");
  const [headline, setHeadline] = useState("新照片上線");
  const [handle, setHandle] = useState("@jimframe");
  const [siteUrl, setSiteUrl] = useState("");
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [count, setCount] = useState(0);
  const [picked, setPicked] = useState<LoadedPhoto[]>([]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [assets, setAssets] = useState<Asset[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("選好活動後按「一鍵產生」，大約 1 分鐘會做好限動、貼文、Reels 和文案。");
  const [progress, setProgress] = useState(0);
  const [tab, setTab] = useState<Tab>("story");
  const [copied, setCopied] = useState("");
  const popular = useRef<Set<string>>(new Set());
  const album = albums.find(a => a.key === albumKey) ?? albums[0];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSiteUrl(store.get("studio_site", window.location.origin));
    setTags(store.get("studio_tags", DEFAULT_TAGS));
    setHandle(store.get("studio_handle", "@jimframe"));
    void fetch("/api/popular").then(r => (r.ok ? r.json() : [])).then((rows: { id: string }[]) => { popular.current = new Set(rows.map(r => r.id)); }).catch(() => {});
  }, []);
  const chooseAlbum = (key: string) => {
    assets.forEach(a => URL.revokeObjectURL(a.url));
    setAlbumKey(key); setAssets([]); setPicked([]); setExcluded(new Set()); setCount(0);
  };
  const useCampaign = (campaign: "crush" | "halloween") => {
    if (campaign === "crush") {
      setTheme("crush"); setHeadline("Bachata Crush 暖身中");
      setTags(`${DEFAULT_TAGS} #bachatacrush #bachatafestival`);
      setStatus("已套用 Bachata Crush 預熱設計；選擇相簿後即可產生素材。正式日期與場地確認後再補上即可。");
    } else {
      setTheme("halloween"); setHeadline("Halloween Dance Night");
      setTags(`${DEFAULT_TAGS} #halloweendance #halloweenparty`);
      setStatus("已套用 Halloween 夜舞設計；目前不綁日期，可先預覽與暖身宣傳。");
    }
  };

  const info = useMemo(() => ({ venue: album.venue, date: album.date, count: count || album.images.length, siteUrl: siteUrl || "", handle, headline }), [album, count, siteUrl, handle, headline]);
  const captions = useMemo(() => buildCaptions(info, tags), [info, tags]);

  const albumPhotos = async () => {
    try {
      const response = await fetch(`/api/folder-photos?folder=${encodeURIComponent(album.folder)}`);
      if (response.ok) {
        const payload = await response.json() as { images?: unknown };
        if (Array.isArray(payload.images)) {
          const list = payload.images.filter((id): id is string => typeof id === "string" && !hidden.has(id));
          if (list.length) return list;
        }
      }
    } catch { /* use the list saved in albums-data */ }
    return album.images;
  };

  const render = async (photos: LoadedPhoto[]) => {
    assets.forEach(a => URL.revokeObjectURL(a.url));
    setStatus("正在換成高解析照片…"); setProgress(55);
    const hi = await upgradePhotos(photos);
    setStatus("正在排版限動與貼文…"); setProgress(65);
    const stories = await renderStories(hi, info, theme);
    const posts = await renderCarousel(hi, info, theme);
    setAssets([...stories, ...posts]); setProgress(72);
    setStatus("正在輸出 Reels 影片…");
    const reel = await renderReel(hi, info, theme, p => setProgress(72 + Math.round(p * 28)));
    setAssets([...stories, ...posts, reel]);
    setProgress(100);
    setStatus(`完成：${stories.length} 張限動、${posts.length} 張輪播貼文、1 支 ${reel.name.endsWith(".mp4") ? "MP4" : "WebM"} 影片和文案。`);
  };

  const generate = async () => {
    if (busy) return;
    setBusy(true); setProgress(2); setStatus("正在讀取相簿…");
    try {
      const ids = await albumPhotos();
      setCount(ids.length);
      setStatus(`從 ${ids.length} 張裡自動挑選清楚、不重複的照片…`);
      const photos = await autoPick(ids.filter(id => !excluded.has(id)), 12, popular.current, (done, total) => setProgress(2 + Math.round((done / total) * 50)));
      if (photos.length < 3) throw new Error("not enough photos");
      setPicked(photos);
      await render(photos);
    } catch (error) {
      console.error(error);
      setStatus("產生失敗：照片讀不到或數量不足。請確認相簿是公開分享，或稍後再試。");
    } finally { setBusy(false); }
  };

  const rerender = async () => {
    const keep = picked.filter(p => !excluded.has(p.id));
    if (busy || keep.length < 3) return;
    setBusy(true);
    try { setPicked(keep); await render(keep); } catch { setStatus("重新產生失敗，請再試一次。"); } finally { setBusy(false); }
  };

  const shareFiles = async (list: Asset[]) => {
    const files = list.map(a => new File([a.blob], `JimFrame_${album.date}_${a.name}`, { type: a.blob.type }));
    if (navigator.canShare?.({ files })) {
      try { await navigator.share({ files, title: `${album.venue} ${dateLabel(album.date)}` }); return; } catch (error) { if ((error as Error).name === "AbortError") return; }
    }
    downloadZip(list);
  };
  const downloadZip = async (list: Asset[]) => {
    const entries = await Promise.all(list.map(async a => ({ name: `JimFrame_${album.date}_${a.name}`, data: new Uint8Array(await a.blob.arrayBuffer()) })));
    const url = URL.createObjectURL(makeStoredZip(entries));
    const link = document.createElement("a"); link.href = url; link.download = `JimFrame_${album.date}_${album.venue.replace(/\s/g, "")}_IG素材.zip`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };
  const copy = async (key: string, value: string) => {
    try { await navigator.clipboard.writeText(value); setCopied(key); setTimeout(() => setCopied(""), 1600); } catch { setCopied(""); }
  };

  const shown = tab === "caption" ? [] : assets.filter(a => a.kind === tab);
  const counts = { story: assets.filter(a => a.kind === "story").length, post: assets.filter(a => a.kind === "post").length, reel: assets.filter(a => a.kind === "reel").length };

  return <main className="app studio">
    <header className="navbar">
      <Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">JL</span><span>IG 素材工作室</span></Link>
      <Link className="nav-pill" href="/">回網站</Link>
    </header>

    <section className="section">
      <p className="eyebrow">每場活動 1 分鐘</p>
      <h1 className="large-title">限動、貼文、Reels 一次做好</h1>
      <p className="hero-sub">選活動 → 一鍵產生 → 手機上直接分享到 IG。照片會自動挑選清楚、不重複的張數，文案也幫你寫好。</p>
    </section>

    <section className="section campaign-section">
      <div className="section-head"><div><p className="eyebrow">COMING UP</p><h2 className="title2">近期活動預熱設計</h2><p className="footnote">先用現有實拍照片預覽；不先猜活動日期與場地。</p></div></div>
      <div className="campaign-grid">
        <article className="campaign-card is-crush">
          <div className="campaign-art campaign-crush-art">
            <div className="campaign-photo campaign-photo-main"><img src={`/api/face-preview?id=${encodeURIComponent(campaignPreviewPhotos[0] ?? "")}&w=900`} alt="Bachata Crush 實拍照片預覽"/></div>
            <div className="campaign-photo campaign-photo-side"><img src={`/api/face-preview?id=${encodeURIComponent(campaignPreviewPhotos[1] ?? campaignPreviewPhotos[0] ?? "")}&w=900`} alt=""/></div>
            <div className="campaign-title"><span>BACHATA</span><strong>CRUSH</strong><small>WARM-UP EDITION · JIMFRAME</small></div>
            <div className="campaign-sticker">COMING<br/>SOON</div>
          </div>
          <div className="campaign-copy"><div><b>Bachata Crush 預熱版</b><p>桃紅夜色、親密舞感、適合倒數與舞者分享。</p></div><button type="button" onClick={()=>useCampaign("crush")}>套用這個設計</button></div>
        </article>
        <article className="campaign-card is-halloween">
          <div className="campaign-art campaign-halloween-art">
            <div className="halloween-film">{campaignPreviewPhotos.slice(2,6).map((id,index)=><img key={id} src={`/api/face-preview?id=${encodeURIComponent(id)}&w=900`} alt={index===0?"Halloween 夜舞實拍照片預覽":""}/>)}</div>
            <div className="halloween-shade"/>
            <div className="campaign-title"><span>JIMFRAME PRESENTS</span><strong>AFTER<br/>DARK</strong><small>HALLOWEEN DANCE NIGHT</small></div>
            <div className="halloween-date">OCT<br/><b>31</b></div>
          </div>
          <div className="campaign-copy"><div><b>Halloween 夜舞版</b><p>深紫、橘光與蛛網細節，保留照片主體。</p></div><button type="button" onClick={()=>useCampaign("halloween")}>套用這個設計</button></div>
        </article>
      </div>
    </section>

    <section className="section studio-grid">
      <div className="grouped studio-form">
        <label className="grouped-row"><span>活動</span>
          <select id="studio-album" value={albumKey} onChange={e => chooseAlbum(e.target.value)} disabled={busy}>
            {albums.map(a => <option key={a.key} value={a.key}>{dateLabel(a.date)} · {a.venue}</option>)}
          </select>
        </label>
        <label className="grouped-row"><span>標題</span><input id="studio-headline" value={headline} maxLength={16} onChange={e => setHeadline(e.target.value)} /></label>
        <div className="grouped-row"><span>風格</span>
          <div className="segmented studio-themes" role="tablist" aria-label="風格">
            {([['night','夜色'],['paper','紙感'],['mono','黑白'],['cobalt','藍夜'],['warm','暖橘'],['crush','Crush'],['halloween','萬聖節']] as const).map(([id,label])=><button type="button" role="tab" key={id} aria-selected={theme===id} className={theme===id?"is-selected":""} onClick={()=>setTheme(id)}>{label}</button>)}
          </div>
        </div>
        <label className="grouped-row"><span>IG 帳號</span><input id="studio-handle" value={handle} onChange={e => { setHandle(e.target.value); store.set("studio_handle", e.target.value); }} /></label>
        <label className="grouped-row"><span>網站網址</span><input id="studio-site" value={siteUrl} onChange={e => { setSiteUrl(e.target.value); store.set("studio_site", e.target.value); }} /></label>
        <label className="grouped-row is-stacked"><span>Hashtags</span><textarea id="studio-tags" rows={2} value={tags} onChange={e => { setTags(e.target.value); store.set("studio_tags", e.target.value); }} /></label>
      </div>
      <div className="studio-run">
        <button type="button" className="button button-filled button-large" disabled={busy} onClick={generate}>{busy ? "產生中…" : assets.length ? "重新自動挑選並產生" : "一鍵產生全部素材"}</button>
        <div className="progress" aria-live="polite"><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><p className="footnote">{status}</p></div>
        {picked.length > 0 && <>
          <p className="footnote">自動挑選的照片（點一下排除，再按「用剩下的重做」）</p>
          <div className="pick-row">{picked.map(p => <button type="button" key={p.id} className={excluded.has(p.id) ? "is-excluded" : ""} onClick={() => setExcluded(s => { const n = new Set(s); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n; })} aria-pressed={excluded.has(p.id)}><img src={`/api/face-preview?id=${p.id}&w=900`} alt="" loading="lazy" /></button>)}</div>
          <button type="button" className="button button-tinted" disabled={busy || picked.filter(p => !excluded.has(p.id)).length < 3 || !excluded.size} onClick={rerender}>用剩下的重做</button>
        </>}
      </div>
    </section>

    {(assets.length > 0 || busy) && <section className="section" id="outputs">
      <div className="section-head">
        <div className="segmented-wrap"><div className="segmented" role="tablist" aria-label="素材類型">
          {([["story", `限動 ${counts.story || ""}`], ["post", `貼文 ${counts.post || ""}`], ["reel", "Reels"], ["caption", "文案"]] as const).map(([id, label]) => <button type="button" role="tab" key={id} aria-selected={tab === id} className={tab === id ? "is-selected" : ""} onClick={() => setTab(id)}>{label}</button>)}
        </div></div>
        {tab !== "caption" && shown.length > 0 && <div className="studio-actions">
          <button type="button" className="button button-filled" onClick={() => shareFiles(shown)}>分享到 IG</button>
          <button type="button" className="button button-gray" onClick={() => downloadZip(shown)}>下載 ZIP</button>
        </div>}
      </div>
      {tab === "caption" ? <div className="caption-list">
        {([["post", "貼文文案"], ["reel", "Reels 文案"], ["story", "限動文字"], ["english", "English"]] as const).map(([key, label]) => <article className="caption-card" key={key}>
          <header><b>{label}</b><button type="button" className="text-button" onClick={() => copy(key, captions[key])}>{copied === key ? "已複製 ✓" : "複製"}</button></header>
          <pre>{captions[key]}</pre>
        </article>)}
      </div> : <div className={`asset-grid kind-${tab}`}>
        {shown.length === 0 && <p className="footnote">{busy ? "製作中…" : "尚未產生。"}</p>}
        {shown.map(a => <figure key={a.url} className="asset">
          {a.kind === "reel" ? <video src={a.url} controls playsInline muted loop /> : <img src={a.url} alt={a.name} />}
          <figcaption><span>{a.name}</span><a className="text-button" href={a.url} download={`JimFrame_${album.date}_${a.name}`}>儲存</a></figcaption>
        </figure>)}
      </div>}
      <p className="footnote studio-tip">限動發布時，記得在下方空白處加上「連結」貼紙，連到網站。貼文建議依編號順序上傳。</p>
    </section>}
  </main>;
}

