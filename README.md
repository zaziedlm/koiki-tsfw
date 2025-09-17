# KOIKI-(TS)FW – Next.jsフルスタックフレームワーク テンプレート

このリポジトリは、Python ベースの KOIKI‑FW (FastAPI) の堅牢なエンタープライズ機能を Next.js + TypeScript へ移植するためのプロジェクトテンプレートです。Prisma、NextAuth.js、tRPC、BullMQ などの OSS を組み合わせ、クリーンな構成とセキュアな実装を提供します。KOIKI‑FW v0.6.0 の特徴を再現しつつ、React Server Components による高速表示を実現します。

> **Next.js 15 対応**：本テンプレートは Next.js 15.5 を前提としており、非同期化された `cookies`/`headers` API、型付きルーティング、Turbopack による高速ビルド等を活用できます。`next.config.ts` で `typedRoutes` を有効にしており、`pnpm dev`/`pnpm build` は Turbopack を使用します。

## 主な特徴

- **型安全なデータアクセス**: Prisma ORM によるモデル定義と自動マイグレーション。
- **認証・認可**: NextAuth.js (Prisma Adapter) による資格情報ベースのサインインを実装。`hasRole` ヘルパーを備えた RBAC 補助関数も用意しています。
- **レートリミット**: `REDIS_URL` を指定した場合、rate‑limiter-flexible + Redis で API への連続アクセスを制限。未設定の場合は自動的にスキップします。
- **ジョブキュー**: BullMQ によるメール送信ジョブ処理。Redis 未設定時はキュー投入をスキップし安全に動作します。
- **ロギングと監査**: Pino による高速JSONロギングと監査ログを記録。必要に応じて Prometheus エクスポーターを追加可。
- **テスト容易性**: tRPC や依存性注入を利用し、ユニットテストやE2Eテストを容易にする。

## ディレクトリ構成

```
.
├── prisma/
│   ├── schema.prisma            # Prisma データモデル
│   └── migrations/              # 自動生成されるマイグレーション
├── src/
│   ├── app/
│   │   ├── layout.tsx           # 全体レイアウト (Server Component)
│   │   ├── page.tsx             # ルートページ (Server Component)
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts  # NextAuth.js 認証ルート
│   │       └── trpc/[trpc]/route.ts         # tRPC エンドポイント
│   ├── components/              # UI コンポーネント
│   ├── lib/
│   │   ├── prisma.ts            # Prisma クライアント
│   │   ├── auth.ts              # 認証ユーティリティ (RBAC など)
│   │   ├── logger.ts            # Pino ロガー設定
│   │   ├── queue.ts             # BullMQ キュー
│   │   └── rateLimit.ts         # レートリミット・ログイン試行制限
│   ├── server/
│   │   ├── api/routers/         # tRPC ルーター定義
│   │   │   ├── app.ts           # ルーター統合
│   │   │   ├── user.ts          # ユーザーAPI
│   │   │   ├── auth.ts          # 認証API
│   │   │   └── todo.ts          # TODO管理API
│   │   └── trpc.ts              # tRPC コンテキスト/初期化
│   ├── jobs/
│   │   ├── worker.ts            # BullMQ ワーカー
│   │   └── emailJob.ts          # メール送信ジョブ
│   └── middleware.ts            # Next.js ミドルウェア (レート制限)
├── .env.example                 # 環境変数サンプル
├── package.json                 # 依存ライブラリ
├── next.config.ts               # Next.js 設定 (Next.js 15)
└── tsconfig.json                # TypeScript 設定
```

## セットアップ

1. **依存インストール**

   ```bash
   pnpm install
   ```

2. **Prisma 初期化**

   ```bash
   pnpm prisma migrate dev --name init
   ```

3. **開発サーバ起動**

   ```bash
   pnpm dev
   ```
   > `pnpm dev` は Turbopack を使って開発サーバを立ち上げます。`--turbo` オプションを外したい場合は `package.json` のスクリプトを編集してください。

4. **ジョブワーカー起動**

   ```bash
   pnpm worker
   ```

詳細な設定は `src/lib/` 以下の各ファイルを参照してください。

## コンテナ実行

Docker と Docker Compose を利用すると、アプリケーション本体と PostgreSQL をまとめて起動できます。デフォルト構成では Redis と MailHog を起動せず、キュー処理やレートリミットは自動的に無効化されます。アプリ/ワーカーコンテナはいずれも起動時に `pnpm prisma migrate deploy` を実行し、マイグレーションを自動適用します。

```bash
docker compose up --build
```

- ブラウザ: http://localhost:3000
- PostgreSQL: `postgresql://koiki:koiki@localhost:5432/koiki`
- 生成されるコンテナ: `koiki-ts-app`, `koiki-ts-postgres`

> 企業ネットワークなど自己署名証明書で npm レジストリへアクセスする場合は、ビルド時に TLS 検証を緩めるか、社内 CA を追加してください。暫定対応としては `docker compose build --build-arg NODE_TLS_REJECT_UNAUTHORIZED=0 --build-arg NPM_STRICT_SSL=false` を利用できます（本番利用時は信頼できる CA を追加することを推奨します）。また、Next.js が `next.config.ts` を解釈するため TypeScript などの開発依存も本番イメージに含めています。

### 社内 CA 証明書の取り込み

`docker/certs/` フォルダに社内 CA（例: `nscacert.pem`）を配置すると、Docker イメージのビルド時に `/usr/local/share/ca-certificates/` へコピーされ `update-ca-certificates` が実行されます。拡張子は自動で `.crt` に変換され、Node.js からは `NODE_EXTRA_CA_CERTS` を通じて利用されます。

社内 CA を利用しない場合はフォルダを空のままにしておけば追加処理はスキップされます。

Redis を使ったレートリミットやメールキュー、MailHog を含むフル構成を起動する場合は以下を実行してください。

```bash
docker compose --profile full up --build
```

- MailHog UI: http://localhost:8025
- Redis: `redis://localhost:6379`
- 追加コンテナ: `koiki-ts-worker`, `koiki-ts-redis`, `koiki-ts-mailhog`

`.env.example` をベースに必要な環境変数を `.env` などにコピーし、本番では適切な値に差し替えてください。Redis／SMTP を利用する場合はコメントを外して設定してください。`REDIS_URL` を指定しない場合はメールキューやレートリミットはスキップされ、`pnpm worker` は即時終了します (コンテナの `worker` サービスは `--profile full` でのみ起動します)。

## 動作確認フロー

1. Postgres・Redis・SMTP が起動していることを確認し、`.env` を `.env.local` などにコピーして接続情報を記入します。
2. `pnpm prisma migrate dev --name init` を実行し、Prisma スキーマに基づくテーブルを作成します。
3. `pnpm dev` でアプリケーションを起動後、別ターミナルで `pnpm worker` を実行して BullMQ ワーカーを常駐させます。
4. 新規登録 (`/api/trpc/auth.register`) → TODO 作成/更新 (`/api/trpc/todo.*`) → メール送信ジョブが処理されることを順に確認します。送信ログは Pino を通じてコンソールに出力されます。
