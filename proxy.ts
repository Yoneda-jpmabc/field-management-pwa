import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * リクエストごとに Supabase のセッションを更新し、未ログインなら /login へ送る。
 * Next.js 16 で middleware.ts はこの proxy.ts に改名された。
 *
 * ここは「早く弾く」ためのものでしかない。見ているのは auth の Cookie だけで、
 * 作業者が有効かどうかまでは判定しない。守りの本体は app/(app)/layout.tsx の
 * getCurrentWorker()（Next.js のドキュメントも proxy は optimistic check に
 * 留めるよう書いている: 01-app/02-guides/authentication.md）。
 *
 * トークンの更新結果を持ち帰るため、response は setAll の中で作り直す。
 * ここで作った response をそのまま返さないと、更新後の Cookie がブラウザに
 * 届かず、しばらくすると勝手にログアウトする。
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const { url, publishableKey } = getSupabaseEnv();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // 呼ぶこと自体が目的。期限切れ間近のトークンはここで更新され、
  // 上の setAll 経由で response に載る。
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname !== "/login") {
    const target = request.nextUrl.clone();
    target.pathname = "/login";
    target.search = "";
    return NextResponse.redirect(target);
  }

  return response;
}

export const config = {
  matcher: [
    /**
     * 静的アセットと PWA のマニフェスト・アイコンは素通しする。
     * マニフェストまでリダイレクトすると、ホーム画面へのインストールが壊れる。
     */
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?)$).*)",
  ],
};
