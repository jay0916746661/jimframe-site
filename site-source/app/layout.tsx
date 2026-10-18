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
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
