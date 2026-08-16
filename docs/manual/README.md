# 操作マニュアル

現段階（開発中バージョン）でできる操作をまとめた、現場に配る用のマニュアル。

| ファイル | 中身 |
| --- | --- |
| `operation-manual.html` | 原稿。文言を直すのはこちら |
| `operation-manual.pdf` | 配布用。HTML から生成したもの（A4・12ページ） |

## 作り直しかた

HTML を直したら、Chromium で PDF に変換し、ページ番号を打ち直す。
日本語フォント（IPAGothic など）が入っている環境で実行すること。

```bash
chromium --headless --no-pdf-header-footer \
  --print-to-pdf=/tmp/manual-raw.pdf docs/manual/operation-manual.html

python3 - <<'PY'
import pymupdf
doc = pymupdf.open("/tmp/manual-raw.pdf")
total = doc.page_count
# 表紙にはページ番号を振らない
for index, page in enumerate(doc):
    if index == 0:
        continue
    page.insert_text(
        (page.rect.width / 2 - 12, page.rect.height - 22),
        f"{index + 1} / {total}",
        fontsize=8, fontname="helv", color=(0.56, 0.56, 0.58),
    )
doc.set_metadata({"title": "圃場管理アプリ 操作マニュアル"})
doc.save("docs/manual/operation-manual.pdf")
PY
```

## 更新するとき

画面の文言や操作を変えたら、このマニュアルの該当箇所も直す。
特に「7. 現段階でできないこと・注意点」は、機能を追加したら必ず見直すこと
（ログイン・農薬使用履歴・PDF/Excel 出力・写真添付・オフライン入力）。
