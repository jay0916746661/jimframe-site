"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Album = { date: string; venue: string; folder: string; images: string[] };
type HiddenItem = { photoId: string; albumKey: string; hiddenAt: string };
const albumKey = (album: Album) => `${album.date}-${album.venue}`;
const label = (date: string) => `${date.slice(0, 2)}.${date.slice(2)}`;
const thumb = (id: string) => `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w600`;

export default function PhotoAdmin({ albums, email }: { albums: Album[]; email: string }) {
  const sorted = useMemo(() => [...albums].sort((a, b) => b.date.localeCompare(a.date)), [albums]);
  const [selectedAlbumKey, setSelectedAlbumKey] = useState(albumKey(sorted[0]));
  const [photos, setPhotos] = useState<string[]>([]);
  const [hidden, setHidden] = useState<HiddenItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"visible" | "hidden">("visible");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const album = sorted.find(item => albumKey(item) === selectedAlbumKey) ?? sorted[0];
  const hiddenIds = useMemo(() => new Set(hidden.map(item => item.photoId)), [hidden]);

  const fetchHidden = async () => {
    const response = await fetch("/api/admin/photos", { cache: "no-store" });
    if (!response.ok) throw new Error("hidden");
    const payload = await response.json() as { items?: HiddenItem[] };
    return Array.isArray(payload.items) ? payload.items : [];
  };
  const fetchAlbum = async (next: Album) => {
    const response = await fetch(`/api/folder-photos?folder=${encodeURIComponent(next.folder)}`, { cache: "no-store" });
    const payload = response.ok ? await response.json() as { images?: string[] } : { images: [] };
    const ids = Array.isArray(payload.images) && payload.images.length ? payload.images : next.images;
    return [...new Set(ids)];
  };
  useEffect(() => {
    let cancelled = false;
    void Promise.all([fetchHidden(), fetchAlbum(album)]).then(([hiddenItems, albumPhotos]) => {
      if (cancelled) return;
      setHidden(hiddenItems); setPhotos(albumPhotos); setLoading(false);
    }).catch(() => { if (!cancelled) { setLoading(false); setMessage("照片載入失敗，請重新整理。"); } });
    return () => { cancelled = true; };
  // The initial album is fixed for this mount; later changes are user-driven.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeAlbum = (key: string) => {
    const next = sorted.find(item => albumKey(item) === key); if (!next) return;
    setSelectedAlbumKey(key); setTab("visible"); setLoading(true); setSelected(new Set()); setMessage("");
    void fetchAlbum(next).then(items => setPhotos(items)).catch(() => setMessage("照片載入失敗，請重新整理。" )).finally(() => setLoading(false));
  };
  const toggle = (id: string) => setSelected(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const shown = tab === "visible" ? photos.filter(id => !hiddenIds.has(id)) : hidden.filter(item => item.albumKey === selectedAlbumKey).map(item => item.photoId);
  const submit = async (action: "hide" | "restore") => {
    if (!selected.size || working) return;
    const verb = action === "hide" ? "從網站下架" : "恢復顯示";
    if (!window.confirm(`確定要${verb} ${selected.size} 張照片嗎？\n\nGoogle Drive 原檔不會被刪除。`)) return;
    setWorking(true); setMessage("");
    try {
      const response = await fetch("/api/admin/photos", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, photoIds: [...selected], albumKey: selectedAlbumKey }) });
      if (!response.ok) throw new Error("save");
      setHidden(await fetchHidden()); setSelected(new Set()); setMessage(action === "hide" ? "已下架，前台不再顯示。" : "已恢復顯示。");
    } catch { setMessage("儲存失敗，請再試一次。"); } finally { setWorking(false); }
  };

  return <main className="admin-shell">
    <header className="admin-nav"><Link className="admin-brand" href="/"><img src="/jimframe-logo.png" alt=""/><span>JimFrame <b>照片管理</b></span></Link><span>{email}</span></header>
    <section className="admin-hero"><p className="eyebrow">OWNER ONLY</p><h1>選取照片，從網站下架</h1><p>這裡只會控制網站顯示，Google Drive 原始照片保持不動；下架後隨時可以恢復。</p></section>
    <section className="admin-toolbar">
      <label>活動相簿<select value={selectedAlbumKey} onChange={event => changeAlbum(event.target.value)}>{sorted.map(item => <option value={albumKey(item)} key={albumKey(item)}>{label(item.date)} · {item.venue}</option>)}</select></label>
      <div className="admin-tabs"><button className={tab === "visible" ? "active" : ""} onClick={() => { setTab("visible"); setSelected(new Set()); }}>顯示中</button><button className={tab === "hidden" ? "active" : ""} onClick={() => { setTab("hidden"); setSelected(new Set()); }}>已下架 {hidden.filter(item => item.albumKey === selectedAlbumKey).length}</button></div>
    </section>
    <section className="admin-actions"><div><b>{selected.size}</b> 張已選</div><button onClick={() => setSelected(new Set(shown))} disabled={!shown.length}>全選</button><button onClick={() => setSelected(new Set())} disabled={!selected.size}>清除</button><button className={tab === "visible" ? "danger" : "restore"} onClick={() => void submit(tab === "visible" ? "hide" : "restore")} disabled={!selected.size || working}>{working ? "處理中…" : tab === "visible" ? "下架選取照片" : "恢復選取照片"}</button></section>
    {message && <p className="admin-message" role="status">{message}</p>}
    {loading ? <p className="admin-empty">照片載入中…</p> : shown.length ? <section className="admin-grid">{shown.map((id, index) => <button key={id} className={selected.has(id) ? "selected" : ""} onClick={() => toggle(id)} aria-pressed={selected.has(id)}><img src={thumb(id)} alt={`${label(album.date)} ${album.venue} 照片 ${index + 1}`} loading="lazy"/><span>{selected.has(id) ? "✓" : index + 1}</span></button>)}</section> : <p className="admin-empty">這個相簿目前沒有{tab === "visible" ? "可顯示" : "已下架"}的照片。</p>}
  </main>;
}
