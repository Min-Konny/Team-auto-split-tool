# Cursor 用リデザイン実装プロンプト

以下をそのまま Cursor の Composer（⌘I）に貼り付けて使用してください。

---

## プロンプト本文

```
このプロジェクト（LoL Team Maker）のデザインを全面的に刷新してください。
現在は Chakra UI のデフォルトスタイルですが、以下のデザインシステムに沿ったダークテーマに置き換えます。

## デザインコンセプト
- コンペティティブ / ゲーミングな雰囲気のダークテーマ
- Blue side vs Red side の二項対立が視覚言語の中心
- フォント：Space Grotesk（見出し）/ Inter（本文）/ JetBrains Mono（数値・ラベル・バッジ）

## カラートークン
src/styles/tokens.css を新規作成し、以下を定義してください：

:root {
  --bg-0: oklch(0.16 0.02 250);
  --bg-1: oklch(0.20 0.022 250);
  --bg-2: oklch(0.24 0.024 250);
  --bg-3: oklch(0.28 0.026 250);
  --line:   oklch(0.30 0.02 250);
  --line-2: oklch(0.40 0.025 250);
  --fg-0: oklch(0.96 0.01 250);
  --fg-1: oklch(0.78 0.015 250);
  --fg-2: oklch(0.58 0.018 250);
  --fg-3: oklch(0.42 0.02 250);
  --blue:    oklch(0.72 0.16 240);
  --blue-d:  oklch(0.42 0.14 240);
  --blue-bg: oklch(0.22 0.07 240);
  --red:    oklch(0.68 0.20 25);
  --red-d:  oklch(0.42 0.17 25);
  --red-bg: oklch(0.22 0.10 25);
  --gold: oklch(0.82 0.13 85);
  --ok:   oklch(0.76 0.16 145);
  --warn: oklch(0.78 0.15 65);
  --r-top: oklch(0.72 0.18 25);
  --r-jng: oklch(0.76 0.16 145);
  --r-mid: oklch(0.72 0.16 240);
  --r-adc: oklch(0.72 0.18 305);
  --r-sup: oklch(0.80 0.15 70);
}

## Chakra UI テーマ上書き
src/theme/index.ts を以下の方針で更新：
- body background: var(--bg-0)
- Card: background var(--bg-1), border 1px solid var(--line), borderRadius "13px"
- Button primary: background var(--fg-0), color var(--bg-0), _hover: background var(--gold)
- Input: background var(--bg-0), border var(--line), _focus: borderColor var(--line-2)
- Heading: fontFamily "'Space Grotesk', system-ui"

## フォント設定
next.config.js または _app.tsx で Google Fonts を読み込み：
- Space Grotesk: wght@400;500;600;700
- Inter: wght@400;500;600
- JetBrains Mono: wght@400;500;600

## 共通コンポーネントの実装

### src/components/Header.tsx
- position: sticky, top: 0, z-index: 50
- backdropFilter: blur(18px), bg: color-mix(in oklch, var(--bg-0) 85%, transparent)
- borderBottom: 1px solid var(--line)
- ブランドマーク：blue/red の三角分割（CSS clip-path）
- ナビリンク：pill shape, hover で bg-2
- "チーム作成" リンクは白背景の primary ボタンスタイル

### src/components/Layout.tsx
- bg: var(--bg-0), minH: 100vh
- コンテンツエリアに max-width: 1440px, padding: 28px

### src/components/RoleBadge.tsx（新規作成）
全ロールで width: 58px 固定・center align の統一バッジ。
各ロールの色は以下のトークンを使用：
TOP → --r-top / JUNGLE → --r-jng / MID → --r-mid / ADC → --r-adc / SUP → --r-sup
border: 1px solid color-mix(in oklch, [role-color] 35%, transparent)

### src/components/RankChip.tsx（新規作成）
レートからランク名を表示する小さなチップ。
ランク別カラー：
IRON/UNRANKED → var(--fg-3)
BRONZE → #cd7f32
SILVER → #a8a9ad
GOLD → var(--gold)
PLATINUM → oklch(0.72 0.15 180)
EMERALD → oklch(0.74 0.18 155)
DIAMOND → var(--blue)
MASTER → var(--r-adc)
GRANDMASTER → var(--r-top)
CHALLENGER → var(--gold)

## ページ別の実装指針

### src/pages/index.tsx（トップページ）
- ヒーローエリア：Blue side / Red side を左右に分割したグリッドレイアウト
- 中央に縦線の VS 区切り
- 機能カード4枚（チーム作成・プレイヤーリスト・登録・試合履歴）をグリッドで配置
- カード：bg-1, border line, borderRadius 14px, hover で border-color line-2 + translateY(-2px)

### src/pages/team-maker/index.tsx（チーム作成）
- 2カラムレイアウト（左: プレイヤープール 400px / 右: 選択中ロスター）
- 高さを calc(100vh - topbar - footer) に固定して各パネルを overflow-y: auto でスクロール
- プレイヤープール：コンパクト横並びカード（role badge + 名前 + レート + ランク + 追加アイコン）
- 選択中ロスター：横1行レイアウト（番号・ロールバッジ・名前・レート・NGロールボタン・削除ボタン）
  - NGロールボタン：width 52px, JetBrains Mono, active時は red 系の背景
- フッター（fixed bottom）：進捗ドット10個 + モード切替 + 許容差入力 + 作成ボタン
- チームオーバーレイ（position: fixed; inset: 0）：
  - ヘッダー：タイトル + 操作説明 + 再生成 + 閉じるボタン
  - 統計バー：Blue avg rate / Δ total diff / Red avg rate を3カラムで表示
  - メインエリア：flex-direction: column, 5つのロール行が画面高さを均等に fill
  - ロール行：grid-template-columns: 1fr 84px 1fr
    - Blue player card（左） | ロール名 + Δdiff（中央） | Red player card（右）
    - プレイヤーカード：クリックでスワップ選択、選択中は gold ボーダー、ターゲットは dashed ボーダー
    - 同チーム内クリックでロール入れ替えも可能
  - 結果バー：BLUE WIN / RED WIN ボタン（flex: 1）+ Draft Tool リンク

### src/pages/players/index.tsx（プレイヤー一覧）
- テーブルではなく CSS Grid の行レイアウト（display: grid 各行）
- 列：プレイヤー名(220px) / ロール(72px) / メインレート(140px) / サブレート(160px) / 勝率(80px) / タグ(110px) / NGロール(90px) / アクション(90px)
- ヘッダー行：bg-2, JetBrains Mono 10px uppercase
- 各行：hover で bg-2, cursor: pointer
- メインレート・サブレート：JetBrains Mono 15px + RankChip を縦に
- 勝率：パーセント数値 + 3px の細いバー（ok色 / red色）+ W/L 表示
- アクション：アイコンボタン3つ（履歴・編集・削除）30px×30px
- 編集モーダル：bg-1, border line-2, borderRadius 16px, max-width 560px
  - フォームフィールド：bg-0, border line, borderRadius 9px
  - ランク参考表：toggle で表示/非表示
- 履歴モーダル：統計4カラム（試合数・勝・敗・勝率）+ 試合テーブル

### src/pages/players/new.tsx（プレイヤー登録）
- 2カラム：左（フォーム）/ 右（ライブプレビューカード + 確認チェックリスト）
- 右カラムは position: sticky; top: 90px
- ロール選択：5つのボタン（各 flex: 1）、選択時はロール色の背景
- ランク選択：ドロップダウンではなく一覧リスト（各行クリック選択、選択中は bg-2）
  - 右端にM/Sレートのプレビュー表示
- タグ・NGロール：pill 形状のトグルボタン
- プレビューカード：名前・ロールバッジ・M/Sレートブロック・タグ・NGロールをリアルタイム表示

### src/pages/matches/index.tsx（試合履歴）
- 統計ストリップ（5カラム）：総試合数・Blue勝利・Red勝利・Blue勝率・最終試合日時
- フィルター：ALL / BLUE WIN / RED WIN の pill ボタン
- 試合カード：
  - 左ボーダー：Blue勝利 → var(--blue-d)、Red勝利 → var(--red-d)
  - グリッド：日時 | Blueチーム選手（role badge + 名前）| VS + Δ | Redチーム選手 | 勝者バッジ | 開閉矢印
  - クリックで展開：Blue側詳細 | ロール別Δ差分 | Red側詳細 の3カラム

## 実装の注意事項
1. Chakra UI の colorScheme ("blue", "red" 等) は使わず、直接 CSS 変数で色指定する
2. Box shadow は使わず、border で奥行きを表現する
3. border-radius は 8–14px の範囲で統一（小要素 5–8px、大カード 13–14px）
4. transition は all 0.15s で統一
5. テキストの letter-spacing：見出し -0.02em、JetBrains Mono ラベル 0.1–0.16em
6. フォントサイズ最小 10px（ラベル）、本文 13–14px、数値 15–28px
7. アニメーション：fadeUp / slotIn / scaleIn（上記 DESIGN_SYSTEM.md 参照）
8. body に -webkit-font-smoothing: antialiased を設定
```

---

## 作業手順（推奨）

1. `src/styles/tokens.css` を作成してトークンを定義
2. `_app.tsx` で tokens.css を import、Google Fonts を追加
3. `src/theme/index.ts` を更新
4. `src/components/RoleBadge.tsx` を新規作成
5. `src/components/RankChip.tsx` を新規作成
6. `src/components/Header.tsx` を更新
7. `src/components/Layout.tsx` を更新
8. 各ページを順番に実装（index → team-maker → players → players/new → matches）

---

## 参考デザインモック（HTML）

このプロジェクト内に以下のモックファイルがあります。CSS・レイアウト・コンポーネントの構造を参照してください：

- `Top Page.html` — トップページ（3バリアント）
- `Team Maker.html` — チーム作成ページ（完全インタラクティブ）
- `Players.html` — プレイヤー一覧（テーブル + モーダル）
- `New Player.html` — プレイヤー登録フォーム
- `Matches.html` — 試合履歴（展開式カード）
- `DESIGN_SYSTEM.md` — 本デザインシステムの詳細

モックの CSS クラス・カラー値・レイアウト構造をそのまま Chakra UI の sx props や CSS Modules に移植してください。
