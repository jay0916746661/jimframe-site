import type { Metadata } from "next";

// Private tool for the photographer: not linked from the site and kept out of search engines.
export const metadata: Metadata = {
  title: "IG 素材工作室｜Jim Lin Photography",
  robots: { index: false, follow: false },
};

export default function StudioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

