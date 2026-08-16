This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 環境変数（`.env.local`）

`.env.local` はコミットしない。会社PCなどへ移すときは手で作り直す。

| 変数 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトの URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase の publishable キー |
| `SESSION_SECRET` | ログインセッション Cookie の署名鍵。16文字以上のランダムな文字列 |

`SESSION_SECRET` は `openssl rand -base64 32` などで作る。
値を変えると全員がログアウトされる（発行済みの Cookie の署名が合わなくなるため）。

## ログインについて

ログインは作業者マスタの `login_id` と暗証番号（PIN）で行う。
暗証番号が未設定の人は、初回ログイン時に本人が決める。

権限は作業者マスタの `permission` で決まる。

| 権限 | できること |
| --- | --- |
| `all` | すべて。圃場・作付・作物マスタの登録編集ができるのはこれだけ |
| `allowed` | 実績・予定・収穫の登録編集。マスタの編集は不可 |
| `view_only` | 閲覧のみ。自分に関係する記録だけが見え、実績タブは出ない |

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
