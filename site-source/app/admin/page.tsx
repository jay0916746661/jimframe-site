import { albumData } from "../albums-data";
import { requireChatGPTUser } from "../chatgpt-auth";
import Link from "next/link";
import PhotoAdmin from "./photo-admin";

export const dynamic = "force-dynamic";
const ADMIN_EMAIL = "jay0916746661@gmail.com";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  if (user.email.toLowerCase() !== ADMIN_EMAIL) {
    return <main className="admin-shell"><section className="admin-card"><p className="eyebrow">PRIVATE</p><h1>沒有管理權限</h1><p>請使用 JimFrame 網站擁有者帳號登入。</p><Link href="/">回網站</Link></section></main>;
  }
  const albums = albumData.filter(album => !album.hidden).map(album => ({ date: album.date, venue: album.venue, folder: album.folder, images: album.images }));
  return <PhotoAdmin albums={albums} email={user.email} />;
}
