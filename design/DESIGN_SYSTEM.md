# LoL Team Maker — Design System

## 概要
League of Legends カスタムゲーム用チーム振り分けツール。コンペティティブ / ゲーミングな雰囲気のダークテーマ。Blue side vs Red side の二項対立が視覚言語の中心。

---

## カラートークン

```css
:root {
  /* Backgrounds */
  --bg-0: oklch(0.16 0.02 250);   /* ページ背景（最も暗い） */
  --bg-1: oklch(0.20 0.022 250);  /* カード / パネル */
  --bg-2: oklch(0.24 0.024 250);  /* ホバー状態 / 入力フォーカス */
  --bg-3: oklch(0.28 0.026 250);  /* 深いネスト要素 */

  /* Borders */
  --line:   oklch(0.30 0.02 250); /* デフォルトボーダー */
  --line-2: oklch(0.40 0.025 250);/* ホバー / アクティブボーダー */

  /* Foregrounds */
  --fg-0: oklch(0.96 0.01 250);   /* 主要テキスト */
  --fg-1: oklch(0.78 0.015 250);  /* 副次テキスト */
  --fg-2: oklch(0.58 0.018 250);  /* ミュートテキスト */
  --fg-3: oklch(0.42 0.02 250);   /* プレースホルダー / ラベル */

  /* Blue side */
  --blue:    oklch(0.72 0.16 240);
  --blue-d:  oklch(0.42 0.14 240); /* ボーダー用ダーク */
  --blue-bg: oklch(0.22 0.07 240); /* 背景グロー */

  /* Red side */
  --red:    oklch(0.68 0.20 25);
  --red-d:  oklch(0.42 0.17 25);
  --red-bg: oklch(0.22 0.10 25);

  /* Accents */
  --gold: oklch(0.82 0.13 85);  /* CTA / ハイライト */
  --ok:   oklch(0.76 0.16 145); /* 成功 / 勝利 */
  --warn: oklch(0.78 0.15 65);  /* 警告 / レート差超過 */

  /* Role colors */
  --r-top: oklch(0.72 0.18 25);
  --r-jng: oklch(0.76 0.16 145);
  --r-mid: oklch(0.72 0.16 240);
  --r-adc: oklch(0.72 0.18 305);
  --r-sup: oklch(0.80 0.15 70);
}
```

---

## タイポグラフィ

```css
/* 見出し・ブランド */
font-family: 'Space Grotesk', system-ui, sans-serif;
letter-spacing: -0.02em;

/* 本文 */
font-family: 'Inter', system-ui, sans-serif;

/* 数値・コード・バッジ・ラベル */
font-family: 'JetBrains Mono', ui-monospace, monospace;
```

### スケール
| 用途 | font-size | font-weight |
|------|-----------|-------------|
| ページ見出し | 22px / Space Grotesk | 600 |
| セクション見出し | 17–18px / Space Grotesk | 600 |
| カード見出し | 14–16px / Space Grotesk | 600 |
| 本文 | 13–14px / Inter | 400–500 |
| ラベル（大文字） | 10–11px / JetBrains Mono | — |
| 数値（レート等） | 15–28px / JetBrains Mono | 600 |

---

## コンポーネント

### Role Badge（ロールバッジ）
全ロールで統一幅 58px を守ること。

```css
.role-badge {
  font-family: 'JetBrains Mono';
  font-size: 10px;
  font-weight: 600;
  padding: 3px 0;
  border-radius: 5px;
  letter-spacing: 0.05em;
  width: 58px;
  text-align: center;
  display: inline-block;
  background: var(--bg-2);
}
.role-badge.TOP    { color: var(--r-top); border: 1px solid color-mix(in oklch, var(--r-top) 35%, transparent); }
.role-badge.JUNGLE { color: var(--r-jng); border: 1px solid color-mix(in oklch, var(--r-jng) 35%, transparent); }
.role-badge.MID    { color: var(--r-mid); border: 1px solid color-mix(in oklch, var(--r-mid) 35%, transparent); }
.role-badge.ADC    { color: var(--r-adc); border: 1px solid color-mix(in oklch, var(--r-adc) 35%, transparent); }
.role-badge.SUP    { color: var(--r-sup); border: 1px solid color-mix(in oklch, var(--r-sup) 35%, transparent); }
```

### Rank Chip（ランクバッジ）
```tsx
const RANK_COLORS = {
  UNRANKED: 'var(--fg-3)',
  IRON:     'var(--fg-3)',
  BRONZE:   '#cd7f32',
  SILVER:   '#a8a9ad',
  GOLD:     'var(--gold)',
  PLATINUM: 'oklch(0.72 0.15 180)',
  EMERALD:  'oklch(0.74 0.18 155)',
  DIAMOND:  'var(--blue)',
  MASTER:   'var(--r-adc)',
  GRANDMASTER: 'var(--r-top)',
  CHALLENGER:  'var(--gold)',
};

function getRankFromRate(rate: number): string {
  if (rate >= 3000) return 'CHALLENGER';
  if (rate >= 2700) return 'GRANDMASTER';
  if (rate >= 2500) return 'MASTER';
  if (rate >= 2200) return 'DIAMOND';
  if (rate >= 2000) return 'EMERALD';
  if (rate >= 1900) return 'PLATINUM';
  if (rate >= 1700) return 'GOLD';
  if (rate >= 1500) return 'SILVER';
  if (rate >= 1300) return 'BRONZE';
  if (rate >= 600)  return 'IRON';
  return 'UNRANKED';
}
```

### カード（Card）
```css
.card {
  background: var(--bg-1);
  border: 1px solid var(--line);
  border-radius: 13px;
  transition: border-color 0.15s;
}
.card:hover { border-color: var(--line-2); }
```

### ボタン
```css
/* Primary — 白背景・黒テキスト。ホバーで gold */
.btn-primary {
  background: var(--fg-0); color: var(--bg-0);
  font-family: 'Space Grotesk'; font-weight: 700;
  padding: 11px 28px; border-radius: 9px; border: 0;
}
.btn-primary:hover { background: var(--gold); }

/* Ghost */
.btn-ghost {
  background: transparent;
  border: 1px solid var(--line-2);
  color: var(--fg-1);
}
.btn-ghost:hover { background: var(--bg-2); color: var(--fg-0); }
```

### フォーム入力
```css
.form-input {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-0);
  border: 1px solid var(--line);
  border-radius: 9px;
  color: var(--fg-0);
  font-family: inherit;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
}
.form-input:focus { border-color: var(--line-2); }
```

### セクションラベル（JetBrains Mono 大文字）
```css
.section-label {
  font-family: 'JetBrains Mono';
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--fg-3);
}
```

### Topbar
```css
.topbar {
  position: sticky; top: 0; z-index: 50;
  backdrop-filter: blur(18px);
  background: color-mix(in oklch, var(--bg-0) 85%, transparent);
  border-bottom: 1px solid var(--line);
}
```

---

## レイアウト

- **最大幅**: `max-width: 1440px; margin: 0 auto;`
- **ページパディング**: `padding: 28px 28px 60px`
- **カードギャップ**: `gap: 12–16px`
- **テーブル列グリッド**: `display: grid; grid-template-columns: ...` でカスタム列幅
- **チームオーバーレイ**: `position: fixed; inset: 0;` の全画面 flex column

---

## Blue / Red サイドの使い方

| 要素 | Blue | Red |
|------|------|-----|
| テキスト | `var(--blue)` | `var(--red)` |
| ボーダー | `var(--blue-d)` | `var(--red-d)` |
| 背景グロー | `var(--blue-bg)` | `var(--red-bg)` |
| バッジ背景 | `color-mix(in oklch, var(--blue) 18%, transparent)` | `color-mix(in oklch, var(--red) 18%, transparent)` |
| カード左ボーダー | `border-left: 3px solid var(--blue-d)` | `border-right: 3px solid var(--red-d)` |

---

## アニメーション

```css
/* カード出現 */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: none; }
}

/* ロスタースロット追加 */
@keyframes slotIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: none; }
}

/* モーダル */
@keyframes scaleIn {
  from { transform: scale(0.97); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
```

---

## 実装済みページ一覧

| ページ | ファイル | 主な機能 |
|--------|----------|----------|
| トップ | `src/pages/index.tsx` | ナビゲーション / ヒーロー |
| チーム作成 | `src/pages/team-maker/index.tsx` | プレイヤー選択 → チーム振り分け → 試合結果 |
| プレイヤー一覧 | `src/pages/players/index.tsx` | テーブル / 検索・ソート / 編集・履歴モーダル |
| プレイヤー登録 | `src/pages/players/new.tsx` | フォーム + ライブプレビュー |
| 試合履歴 | `src/pages/matches/index.tsx` | 試合リスト / 展開詳細 / 統計 |
