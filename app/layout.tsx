import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./fonts-ibm-plex-sans-jp.css";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/*
 * 本文フォント（IBM Plex Sans JP）は next/font/google ではなく
 * fonts-ibm-plex-sans-jp.css で自前ホストしている。
 *
 * この書体は next/font/google の subsets（cyrillic / latin / latin-ext しか
 * 選べない）では日本語グリフを絞り込めず、素で読み込むと使わない拡張漢字まで
 * 含む @font-face が約500個生成され、CSS だけで350KB超になっていた。
 * 常用漢字2136字＋このリポジトリ内の実在文字＋かな・記号・英数字（計2656字）
 * だけを含むサブセットを Google Fonts の text= 機能で生成し直し、
 * public/fonts/ibm-plex-sans-jp/ に固定してある。
 * 対応外の稀な漢字は端末の標準日本語フォントにフォールバックする。
 */

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
      className={`${geistMono.variable} h-full antialiased`}
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
