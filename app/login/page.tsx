import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentWorker } from "@/lib/auth/session";

// Cookie を見るため、この画面はキャッシュしない。
export const dynamic = "force-dynamic";

function safeNext(value: string | string[] | undefined): string {
  const path = typeof value === "string" ? value : "";
  // 自サイト内の絶対パスだけを戻り先として許す。
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  // ログイン済みの人がブックマークから来たときは、そのまま中へ通す。
  const worker = await getCurrentWorker();
  if (worker) redirect(next);

  return <LoginForm next={next} />;
}
