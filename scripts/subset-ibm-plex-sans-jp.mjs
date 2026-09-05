#!/usr/bin/env node
/**
 * IBM Plex Sans JP を自前サブセットして public/fonts/ibm-plex-sans-jp/ と
 * app/fonts-ibm-plex-sans-jp.css を再生成するスクリプト。
 *
 * 背景: next/font/google はこの書体の日本語グリフを絞り込む方法（subsets）を
 * 持たない（cyrillic / latin / latin-ext しか選べない）。素で読み込むと、
 * ほぼ使わない拡張漢字まで含む @font-face が約500個生成され、CSS だけで
 * 350KB超になる。Google Fonts の CSS2 API には text= パラメータで
 * 「指定した文字だけを含むフォント」を作る機能があるので、これを直接叩いて
 * 常用漢字＋このリポジトリ内の実在文字＋かな・記号・英数字だけに絞ったものを
 * 生成し、固定資産としてリポジトリに置いている。
 *
 * 実行: node scripts/subset-ibm-plex-sans-jp.mjs
 * 前提: インターネット接続（fonts.googleapis.com / fonts.gstatic.com）。
 *
 * 新しい作物名・地名などで表示が崩れる文字が出てきたら、このスクリプトの
 * SOURCE_GLOBS にその文字列が含まれるファイル（seed データなど）を足すか、
 * EXTRA_CHARS に直接文字を足してから再実行する。
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import joyoKanjiPkg from "joyo-kanji";

const joyoKanji = joyoKanjiPkg.kanji;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "fonts", "ibm-plex-sans-jp");
const OUT_CSS = path.join(ROOT, "app", "fonts-ibm-plex-sans-jp.css");
const WEIGHTS = [400, 500, 600, 700];
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
// Google の CSS2 API は text= のエンコード後の長さが長すぎると
// 何も言わずに「絞り込みなしの全量 CSS」にフォールバックする。
// 経験上 6000 バイト前後で成功したため、余裕を見て 1 チャンクあたりの
// 文字数を抑える。
const MAX_CHARS_PER_CHUNK = 550;

const SOURCE_GLOBS = [
  "app/**/*.tsx",
  "app/**/*.ts",
  "components/**/*.tsx",
  "components/**/*.ts",
  "lib/**/*.ts",
];

// リポジトリのソースコードには出てこないが、実運用で使われている
// （DB に入っている）ことが分かっている文字。見つかり次第ここに足す。
const EXTRA_CHARS = "";

function addRange(set, a, b) {
  for (let cp = a; cp <= b; cp++) set.add(String.fromCodePoint(cp));
}

function isJapaneseChar(ch) {
  const cp = ch.codePointAt(0);
  return (
    (cp >= 0x3040 && cp <= 0x30ff) || // ひらがな・カタカナ
    (cp >= 0x4e00 && cp <= 0x9fff) || // CJK統合漢字
    (cp >= 0xff00 && cp <= 0xffef) || // 全角形
    (cp >= 0x3000 && cp <= 0x303f) // CJKの記号・句読点
  );
}

function scanRepoChars() {
  const files = execSync(`git ls-files ${SOURCE_GLOBS.map((g) => `"${g}"`).join(" ")}`, {
    cwd: ROOT,
  })
    .toString()
    .split("\n")
    .filter(Boolean);

  const chars = new Set();
  for (const f of files) {
    const text = readFileSync(path.join(ROOT, f), "utf8");
    for (const ch of text) {
      if (isJapaneseChar(ch)) chars.add(ch);
    }
  }
  return chars;
}

function buildCharset() {
  const repoChars = scanRepoChars();

  const kanaAsciiPunct = new Set();
  addRange(kanaAsciiPunct, 0x3041, 0x309f); // ひらがな
  addRange(kanaAsciiPunct, 0x30a0, 0x30ff); // カタカナ
  addRange(kanaAsciiPunct, 0xff61, 0xff9f); // 半角カナ・記号
  addRange(kanaAsciiPunct, 0x0020, 0x007e); // ASCII 印字可能文字
  addRange(kanaAsciiPunct, 0x3000, 0x303f); // 日本語の記号・句読点
  addRange(kanaAsciiPunct, 0xff01, 0xff5e); // 全角英数・記号
  for (const ch of "〜…―‐　") kanaAsciiPunct.add(ch);
  for (const ch of EXTRA_CHARS) kanaAsciiPunct.add(ch);

  const hot = new Set([...repoChars, ...kanaAsciiPunct]);
  const coldJoyo = joyoKanji.filter((k) => !hot.has(k));

  return { hot, coldJoyo };
}

function splitIntoChunks(chars, maxLen) {
  const chunks = [];
  let current = [];
  for (const ch of chars) {
    current.push(ch);
    if (current.length >= maxLen) {
      chunks.push(current);
      current = [];
    }
  }
  if (current.length) chunks.push(current);
  return chunks;
}

async function fetchSubsetCss(weight, text) {
  const url = new URL("https://fonts.googleapis.com/css2");
  url.searchParams.set("family", `IBM Plex Sans JP:wght@${weight}`);
  url.searchParams.set("text", text);
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`css2 fetch failed: ${res.status}`);
  const css = await res.text();
  const srcMatch = css.match(/src:\s*url\(([^)]+)\)/);
  const rangeMatch = css.match(/unicode-range:\s*([^;]+);/);
  if (!srcMatch || !rangeMatch) {
    throw new Error(
      `想定外のCSSが返ってきた（text= が長すぎて絞り込みが効いていない可能性）: ${css.slice(0, 200)}`
    );
  }
  return { fontUrl: srcMatch[1], unicodeRange: rangeMatch[1].trim() };
}

async function downloadFont(url, destPath) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`font fetch failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buf);
  return buf.length;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const { hot, coldJoyo } = buildCharset();
  const hotChunks = splitIntoChunks(hot, MAX_CHARS_PER_CHUNK).map((c, i) => ({
    name: hot.size > MAX_CHARS_PER_CHUNK ? `hot_${String.fromCharCode(97 + i)}` : "hot",
    chars: c.join(""),
  }));
  const coldChunks = splitIntoChunks(
    coldJoyo,
    Math.ceil(coldJoyo.length / 3)
  ).map((c, i) => ({ name: `cold${i}`, chars: c.join("") }));
  const chunks = [...hotChunks, ...coldChunks];

  console.log(
    `charset: repo+kana+ascii=${hot.size} chars / 常用漢字の残り=${coldJoyo.length} chars / ${chunks.length} chunks`
  );

  let cssOut = `/*
 * IBM Plex Sans JP を自前でサブセット配信するための @font-face 定義。
 * scripts/subset-ibm-plex-sans-jp.mjs で自動生成している。手で編集しないこと。
 *
 * 常用漢字2136字＋このリポジトリのソース中に実在する文字（作物名・地名など）
 * ＋かな・記号・英数字だけを含む。対応外の稀な漢字（人名など）は端末の
 * 標準日本語フォントにフォールバックする（文字化けはしない。書体だけ変わる）。
 */

`;

  for (const weight of WEIGHTS) {
    for (const chunk of chunks) {
      process.stdout.write(`fetching ${chunk.name} @ ${weight}... `);
      const { fontUrl, unicodeRange } = await fetchSubsetCss(weight, chunk.chars);
      const fileName = `${chunk.name}-${weight}.woff2`;
      const size = await downloadFont(fontUrl, path.join(OUT_DIR, fileName));
      console.log(`${size} bytes`);

      cssOut += `@font-face {
  font-family: "IBM Plex Sans JP";
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url("/fonts/ibm-plex-sans-jp/${fileName}") format("woff2");
  unicode-range: ${unicodeRange};
}

`;
    }
  }

  writeFileSync(OUT_CSS, cssOut);
  console.log(`wrote ${OUT_CSS}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
