import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data, error } = await supabase
    .from("test")
    .select("*");

  return (
    <main>
      <h1>圃場管理アプリ</h1>

      <h2>data</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>

      <h2>error</h2>
      <pre>{JSON.stringify(error, null, 2)}</pre>
    </main>
  );
}