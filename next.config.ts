import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 圃場タブは収穫タブに置き換えた。ホーム画面に追加済みの PWA や
      // ブックマークが /fields を指したままなので、新しい画面へ送る。
      { source: "/fields", destination: "/harvest", permanent: false },
      // 作業記録タブは実績タブの「確認」に統合した。同じ work_records を
      // 見ていて、片方は編集できないだけの違いしか無かったため。
      { source: "/logs", destination: "/records/list", permanent: false },
    ];
  },
};

export default nextConfig;
