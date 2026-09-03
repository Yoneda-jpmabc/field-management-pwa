import type { Metadata, Viewport } from "next";
import { Geist_Mono, IBM_Plex_Sans_JP } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/*
 * 本文フォント。屋外・低解像度端末での可読性重視で IBM Plex Sans JP を採用。
 * この書体は最大ウェイトが 700（900 は無い）。KPI 数値は 600、見出しは 700 で組む。
 * オフライン前提のアプリなので CDN 参照ではなく next/font で self-host する。
 */
const plexJp = IBM_Plex_Sans_JP({
  variable: "--font-plex-jp",
  weight: ["400", "500", "600", "700"],
  // subsets を指定すると日本語グリフが落ちる（この書体は latin / cyrillic しか
  // サブセット指定できない）。省略して全スライスを取り込み、代わりに
  // preload: false でプリロードだけ切る。初回に必要な分だけ読み込まれ、
  // 以降は Service Worker のキャッシュに乗る。
  preload: false,
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // ノッチ・ホームバー領域まで描画し、safe-area-inset で避ける（タブバーが対応済み）
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f4f1" },
    { media: "(prefers-color-scheme: dark)", color: "#101215" },
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

/**
 * ここは <html> の組み立てとテーマの確定だけを持つ。
 *
 * サイドバーやタブバーはログイン後の画面にしか出さないので、AppShell は
 * app/(app)/layout.tsx へ移した。/login はこのレイアウトの直下に置かれ、
 * ナビゲーションのない素の画面になる。
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      data-theme="light"
      data-accent="orange"
      suppressHydrationWarning
      className={`${geistMono.variable} ${plexJp.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            // 保存された選択があればそれを、無ければ OS のダークモード設定に従う。
            // アクセントカラーも同じタイミングで確定させる（既定はオレンジ）。
            // body 描画前に属性を確定させて、白 → 黒／色のちらつきを防いでいる。
            __html: `(function(){try{var d=document.documentElement;var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}d.setAttribute("data-theme",t);var a=localStorage.getItem("accent");if(a!=="blue"&&a!=="green"&&a!=="orange"){a="orange"}d.setAttribute("data-accent",a)}catch(e){}})()`,
          }}
        />
      </head>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
