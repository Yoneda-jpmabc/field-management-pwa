import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 圃場タブは収穫タブに置き換えた。ホーム画面に追加済みの PWA や
      // ブックマークが /fields を指したままなので、新しい画面へ送る。
      { source: "/fields", destination: "/harvest", permanent: false },
    ];
  },
};

export default nextConfig;
