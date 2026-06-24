# LoL Team Maker

League of Legendsのチーム分けツールです。プレイヤーのレートに基づいて、バランスの取れたチームを作成します。

## 機能

### プレイヤー管理
- プレイヤーの新規登録
- プレイヤー一覧の表示
- プレイヤーの削除
- 勝敗数、勝率、レートの管理

### チーム分け
- **今夜のロビー**（チェックイン・共有リンク・Discord貼り付け・前回と同じ10人）
- 10人のプレイヤーを選択
- 各プレイヤーの希望ロールを設定
- レートに基づいた自動チーム分け
- 試合結果の登録とレートの更新

### ロビー参加（共有リンク）
- `/join/lobby/{inviteToken}` から参加（初回のみ自分の名前を選択）
- チーム分け画面の「リンク共有」で URL をコピーして Discord に貼る

## コミュニティ（P1）

- **ログイン**: コミュニティ + ユーザー名 + パスワード（コミュニティごとにアカウント）
- **新規登録**: 上記に加え、コミュニティのパスコード（初回のみ・メンバーに共有）
- プリセット:
  - **249** … パスコード `0249`（プレイヤータグ `249` のデータはこちらへ分離）
  - **きらくに** … ID `kirakuni`、パスコード `5656`（タグ `きらくに`）
- `/community/create` → 任意の新規コミュニティ + 管理者ユーザー
- セッションは httpOnly Cookie（`SESSION_SECRET` 必須）

### 既存データの分離（初回）

登録時に自動実行されます。手動で走らせる場合:

```bash
curl -X POST https://<your-app>/api/migration/setup-communities \
  -H "Content-Type: application/json" \
  -d '{"migrationSecret":"YOUR_SESSION_SECRET"}'
```

タグが `249` と `きらくに` の両方あるプレイヤーは **249** 側に入ります。

### 既存プレイヤーのログインアカウント

分離後、各コミュニティの **メンバー1人につき1アカウント** を自動作成します（初回登録・移行時）。

- **仮パスワード**: `0000`（ログイン用。新規「登録」は不要）
- **ユーザー名**: ニックネーム／名前の英数字部分。日本語のみの場合は `m_` + ID の一部

手動で再実行する場合:

```bash
curl -X POST https://<your-app>/api/migration/seed-auth-users \
  -H "Content-Type: application/json" \
  -d '{"migrationSecret":"YOUR_SESSION_SECRET"}'
```

## チーム分け（P0）

- **126通り**のチーム分割 + **ハンガリアン法**でロール割当
- **3候補**: パーティーバランス / レート均等 / ランダム
- **ELO**: 試合結果で自動更新（◎○△× の係数で実効レートを計算）
- ロール適性: ◎100% / ○95% / △90% / ×は割当不可（◎は1つのみ）

## データ構造

レガシーの `players` / `matches` は先に `communities/default` へ移行され、タグに応じて `249` / `kirakuni` へコピーされます。

```
communities/{id}
  members/{memberId}
  matches/{matchId}
  lobbies/{lobbyId}
```

Firestore ルールは `firestore.rules` をデプロイしてください:

```bash
firebase deploy --only firestore:rules
```

本番では必ず次を設定してください（未設定時は API が 500 を返します）。

- `SESSION_SECRET` — ランダムな長い文字列
- `FIREBASE_SERVICE_ACCOUNT_JSON` — Firebase サービスアカウント JSON（1行）。試合登録・移行・コミュ作成・ELO 手動編集は Admin 経由で書き込みます

## ELO

試合後の ELO は **個人の現在値 vs 相手チーム平均** で期待勝率を計算し、メンバーごとに異なる Δ を付与します（同一チーム内でも強いプレイヤーほど勝利時の上昇は小さくなります）。

## 試合登録

試合結果は `/api/match/register` 経由で **1つの writeBatch** にまとめて保存されます（Cookie セッション必須）。

## データ移行

既存データの移行は `/api/community/enter-default`（「メインに入る」）でのみ実行されます。クライアントの一覧取得では移行しません。

### 試合履歴
- 過去の試合結果の表示
- 参加者、チーム分け、勝者の確認

## 技術スタック

- Next.js
- TypeScript
- Chakra UI
- Firebase (Firestore)

## 開発環境のセットアップ

1. リポジトリのクローン
```bash
git clone https://github.com/satokota1/Team-auto-split-tool.git
cd Team-auto-split-tool
```

2. 依存関係のインストール
```bash
npm install
```

3. 環境変数の設定
`.env.local`ファイルを作成し、以下の環境変数を設定してください：
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. 開発サーバーの起動
```bash
npm run dev
```

## デプロイ

このプロジェクトはVercelにデプロイされています。mainブランチへのプッシュで自動的にデプロイされます。

## ライセンス

MIT
