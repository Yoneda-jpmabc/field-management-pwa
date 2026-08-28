import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    /**
     * クライアントキャッシュ（Router Cache）の保持時間。
     *
     * 全ページが force-dynamic なので、既定（dynamic: 0）だと
     * 一度見たタブへ戻るだけでも毎回サーバーへ取りに行く。
     * 30 秒だけ持たせて、タブを往復する操作を即座に返す。
     *
     * 登録・編集の反映は各 Server Action の revalidatePath が
     * この キャッシュも無効化するので、自分の操作は必ず即反映される。
     * 取りこぼすのは「他の端末が入れた記録」で、最大 30 秒遅れる。
     */
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },

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
