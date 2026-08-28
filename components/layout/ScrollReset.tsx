"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * スクロールするのが window ではなく <main> なので、
 * ページ遷移で先頭に戻す処理は Next.js まかせにできない。ここで自前でやる。
 */
export function ScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    document.getElementById("app-scroll")?.scrollTo({ top: 0 });
  }, [pathname]);

  return null;
}
