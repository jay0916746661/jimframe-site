import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "照片管理｜JimFrame",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
