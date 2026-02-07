# Codex Coding Rules  
## Encoding / HTML / Japanese Text Safety

このファイルは、Codex や生成AIが **文字化けを起こさずにHTML・JS・CSSを実装するための絶対ルール**を定義する。

---

## 🔒 Absolute Rules（必須・例外なし）

- すべてのテキストファイルは **UTF-8** とする
- 原則 **UTF-8 without BOM**
  - ツール要件がある場合のみ BOM を許可
- **Shift_JIS / EUC-JP / ISO-2022-JP は絶対に使用しない**
- 改行コードは **LF (`\n`) に統一**
- 以下のような文字が出現した場合、必ず修正する  

  � ã æ ç ¶  

  → 元の日本語表現を書き直すこと（放置禁止）

---

## 🌐 HTML Rules

- すべての HTML ファイルは以下を **`<head>` の最上部** に含める

```html
<meta charset="utf-8">
```

- `<meta charset>` より前に他の `<meta>` や `<title>` を書かない
- 必ず viewport を指定する

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

- 日本語テキストは **HTMLエンティティ化しない**
  - 例：`&nbsp;` や `&#12354;` を乱用しない

---

## 📦 JavaScript / CSS Rules

- JS / CSS ファイルも **UTF-8 固定**
- JS で HTML を生成・挿入する場合：
  - 元の HTML が UTF-8 で配信される前提を崩さない
- 文字列リテラル内の日本語はエスケープせず、そのまま書く

---

## 🖥 Server / Response Rules

- サーバ設定を生成する場合は **必ず charset=utf-8 を含める**

例：
```
Content-Type: text/html; charset=utf-8
```

---

## 🧰 Git / Editor Rules

```gitattributes
* text=auto eol=lf
*.html text eol=lf
*.css  text eol=lf
*.js   text eol=lf
*.md   text eol=lf
```

---

## ✅ Output Checklist（生成前セルフチェック）

1. すべて UTF-8 か？
2. HTML に `<meta charset="utf-8">` があるか？
3. 文字化け文字（� 等）が含まれていないか？
4. サーバレスポンスに charset=utf-8 が含まれる前提か？

---

## 🧠 AI Instruction（重要）

このリポジトリ内でコードを生成する際は、  
**本ファイルのルールを最優先で遵守すること。**

不明点がある場合は、推測で実装せず確認を求めること。
