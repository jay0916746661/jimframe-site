import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jim Lin Photography｜舞蹈・活動・人物紀實",
  description: "台北活動與舞蹈攝影。瀏覽 Jim Lin 的精選作品、按日期整理的活動相簿，或預約攝影。",
  openGraph: { title: "Jim Lin Photography", description: "舞蹈・活動・人物紀實｜讓流動的夜晚，留下真實的溫度。", type: "website", images: [{ url: "/og.png", width: 1200, height: 630, alt: "Jim Lin Photography" }] },
  twitter: { card: "summary_large_image", title: "Jim Lin Photography", description: "舞蹈・活動・人物紀實", images: ["/og.png"] },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body><MovedBanner />{children}</body></html>;
}

// 網站已搬家：所有新相簿（10.15–10.17 Bachata Crush 照片、影片、人臉找自己）都在 GitHub Pages 新網址
const NEW_SITE = "https://jay0916746661.github.io/jimframe-site/";
function MovedBanner() {
  return (
    <a href={NEW_SITE} style={{ position: "sticky", top: 0, zIndex: 1000, display: "flex", flexWrap: "wrap", gap: "6px 12px", alignItems: "center", justifyContent: "center", padding: "12px 16px", background: "#0a84ff", color: "#fff", textDecoration: "none", font: "600 15px/1.35 -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif", textAlign: "center" }}>
      <span>📸 網站搬家了！10.15–10.17 Bachata Crush 照片、影片、上傳自拍找自己都在新網址</span>
      <span style={{ background: "#fff", color: "#0a84ff", borderRadius: 999, padding: "5px 12px", whiteSpace: "nowrap" }}>前往新網站 →</span>
    </a>
  );
}
