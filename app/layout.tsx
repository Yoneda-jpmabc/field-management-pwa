import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentWorker } from "@/lib/auth/session";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // ノッチ・ホームバー領域まで描画し、safe-area-inset で避ける（タブバーが対応済み）
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export const metadata: Metadata = {
  title: "圃場管理アプリ",
  description: "圃場と作業記録を管理するフィールドマネジメントアプリ",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ナビゲーションの出し分けに権限が要るので、ここで引く。
  // ログイン未実装のうちは常に全権限が返る（lib/auth/session.ts）。
  const { permission } = await getCurrentWorker();

  return (
    <html
      lang="ja"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            // 保存された選択があればそれを、無ければ OS のダークモード設定に従う。
            // body 描画前に属性を確定させて、白 → 黒のちらつきを防いでいる。
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`,
          }}
        />
      </head>
      <body className="h-full overflow-hidden">
        <AppShell permission={permission}>{children}</AppShell>
      </body>
    </html>
  );
}
