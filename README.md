# KOIKI-(TS)FW – Next.jsフルスタックフレームワーク テンプレート

このリポジトリは、Python ベースの KOIKI‑FW (FastAPI) の堅牢なエンタープライズ機能を Next.js + TypeScript へ移植するためのプロジェクトテンプレートです。Prisma、NextAuth.js、Server Actions、BullMQ などの OSS を組み合わせ、クリーンな構成とセキュアな実装を提供します。KOIKI‑FW v0.6.0 の特徴を再現しつつ、React Server Components による高速表示を実現します。

> **Next.js 16 対応**：本テンプレートは Next.js 16.2.9、React 19.2.7、Prisma 7.8 (adapter-pg) を使用します。Node.js の最低要件は 20.19 で、標準の Docker イメージは Node.js 22.20 に固定しています。型付きルーティング (`typedRoutes`) を有効にし、開発サーバーは Turbopack (`pnpm dev`) を利用します。本番ビルドは標準の `next build` コマンドを使用し、Next.js 16 のデフォルト設定に従います。

## 主な特徴

- **型安全なデータアクセス**: Prisma ORM によるモデル定義と自動マイグレーション。
- **Server Actions + RSC**: Next.js 16 の Server Actions と React Server Components による型安全な API 通信と高速レンダリング。
- **認証・認可**: NextAuth.js (Prisma Adapter) による資格情報ベースのサインインを実装。`hasRole` ヘルパーを備えた RBAC 補助関数も用意しています。
- **レートリミット**: `REDIS_URL` を指定した場合、rate‑limiter-flexible + Redis で API への連続アクセスを制限。未設定の場合は自動的にスキップします。
- **ジョブキュー**: BullMQ によるメール送信ジョブ処理。Redis 未設定時はキュー投入をスキップし安全に動作します。
- **ロギング**: Pino による高速JSONロギング。必要に応じて Prometheus エクスポーターを追加可。
- **テスト容易性**: Server Actions や依存性注入を利用し、ユニットテストやE2Eテストを容易にする。

## ディレクトリ構成

```
.
├── prisma/
│   ├── schema.prisma            # Prisma データモデル
│   └── migrations/              # 自動生成されるマイグレーション
├── prisma.config.ts             # Prisma 7 CLI 設定 / DATABASE_URL 読み込み
├── src/
│   ├── app/
│   │   ├── layout.tsx           # 全体レイアウト (Server Component)
│   │   ├── page.tsx             # ルートページ (Server Component)
│   │   ├── register/            # ユーザー登録ページ
│   │   ├── login/               # ログインページ
│   │   ├── todos/               # TODO管理ページ (RSC + Client Component)
│   │   ├── ui-guide/            # UI ガイドページ
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts  # NextAuth.js 認証ルート
│   │       └── health/route.ts              # ヘルスチェック
│   ├── actions/
│   │   ├── auth.ts              # 認証関連の Server Actions
│   │   └── todo.ts              # TODO管理の Server Actions
│   ├── lib/
│   │   ├── prisma.ts            # Prisma クライアント (PostgreSQL adapter-pg)
│   │   ├── auth.ts              # 認証ユーティリティ (RBAC など)
│   │   ├── logger.ts            # Pino ロガー設定
│   │   ├── queue.ts             # BullMQ キュー
│   │   └── rateLimit.ts         # レートリミット
│   ├── jobs/
│   │   ├── worker.ts            # BullMQ ワーカー
│   │   └── emailJob.ts          # メール送信ジョブ
│   └── proxy.ts                 # Next.js 16 Proxy (レート制限)
├── docs/
│   └── koiki-tsfw-guide_0.2.0.md  # 詳細ガイド (v0.2.0)
├── .env.example                 # 環境変数サンプル
├── .mcp.json                    # Next.js DevTools MCP 設定
├── AGENTS.md                    # コーディングエージェント向けルール
├── Dockerfile                   # Node.js 22.20 マルチステージビルド
├── docker-compose.yml           # アプリ / Postgres / Redis / MailHog
├── package.json                 # 依存ライブラリ
├── next.config.ts               # Next.js 設定 (Next.js 16)
└── tsconfig.json                # TypeScript 設定
```

## セットアップ

1. **実行環境の確認**

   Node.js 20.19 以上と、`package.json` に指定された pnpm 9.15.5 を使用します。Docker と同じ条件にそろえる場合は Node.js 22.20 を使用してください。

   ```bash
   node --version
   corepack pnpm --version
   ```

   `pnpm` コマンドが直接利用できない環境では、以降の `pnpm` を `corepack pnpm` に読み替えてください。

2. **依存インストール**

   ```bash
   corepack pnpm install
   ```

3. **PostgreSQL 起動**

   Docker Compose の PostgreSQL のみを起動します。

   ```bash
   docker compose up -d postgres
   ```

4. **環境変数の準備**

   ```bash
   cp .env.example .env
   ```

   Windows PowerShell では次のコマンドを使用します。

   ```powershell
   Copy-Item .env.example .env
   ```

   `.env.example` の `DATABASE_URL` はコンテナ間通信用の `postgres:5432` です。ホストOS上で `pnpm dev` や Prisma CLI を実行する場合は、`.env` を次のように変更します。

   ```dotenv
   DATABASE_URL=postgresql://koiki:koiki@localhost:5432/koiki
   ```

5. **Prisma Client生成とマイグレーション**

   ```bash
   pnpm prisma generate
   pnpm prisma migrate dev
   ```

   既存の初期マイグレーションが含まれているため、通常のセットアップでは新しい `init` マイグレーションを作成しません。スキーマ変更時のみ `--name <migration-name>` を指定してください。

6. **開発サーバ起動**

   ```bash
   pnpm dev
   ```
   > `pnpm dev` は Turbopack を使って開発サーバを立ち上げます。本番ビルドは `pnpm build`（`next build`）で、Next.js 16 のデフォルト設定に従います。

7. **ジョブワーカー起動（Redis利用時）**

   ```bash
   pnpm worker
   ```

詳細な設定は `src/lib/` 以下の各ファイルを参照してください。

## TypeScript 設定の概要

本プロジェクトは Next.js 16 の推奨に合わせ、以下の方針で TypeScript 設定を行っています。

- `moduleResolution: "bundler"` により、`exports` を含む依存解決を Next.js のビルド方式に合わせています。
- `target: "es2022"` でモダンな出力を前提にし、RSC/React 19 の実行環境に整合させています。
- `jsx: "react-jsx"` と Next.js TypeScript プラグインを併用します。

詳細は `tsconfig.json` を参照してください。

## 環境変数（最小セット）

最低限、以下の 3 つが必要です。

- `DATABASE_URL`：PostgreSQL への接続文字列
- `NEXTAUTH_URL`：NextAuth のベース URL
- `NEXTAUTH_SECRET`：セッション署名用のシークレット

`.env.example` をベースに `.env` を作成して設定してください。Next.jsは`.env.local`も読み込みますが、`prisma.config.ts`は`dotenv/config`を通じて`.env`を読むため、DB接続設定は`.env`に記述します。

Prisma 7では、`prisma/schema.prisma`にはDBプロバイダーのみを宣言し、Prisma CLIが使用する接続URLはリポジトリルートの`prisma.config.ts`で読み込みます。アプリケーション本体も同じ`DATABASE_URL`を使用します。

## UIサンプル実装

本テンプレートには、認証とTODO管理の完全な動作サンプルUIが含まれています。

### 実装済みページ

- **`/register`**：ユーザー登録画面
  - メールアドレス、パスワード、氏名（任意）を入力
  - 登録後は自動ログインし `/todos` へリダイレクト
- **`/login`**：ログイン画面
  - NextAuth.js による資格情報認証
  - コールバックURL対応
- **`/todos`**：TODO管理画面（要認証）
  - タスクの追加・完了切替
  - 認証されていない場合は自動的にログイン画面へリダイレクト
- **ナビゲーション**：全ページ共通ヘッダー
  - ログイン状態に応じた表示切替
  - ログアウトボタン

### 利用フロー例

1. `/register` でユーザー登録（自動ログイン）
2. `/todos` でタスク管理
3. ヘッダーからログアウト
4. `/login` で再度ログイン

UIサンプルは Server Actions + RSC による型安全なAPI通信と、NextAuth.js によるセッション管理を実際に体験できる実装例として提供されています。

## API 入口の早見表

- `GET /api/health`：ヘルスチェック
- `/api/auth/*`：NextAuth 認証ルート
- Server Actions：`src/actions/` 配下で定義された型安全な API 関数

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

1. Postgres・Redis・SMTP が起動していることを確認し、`.env.example` を `.env` にコピーして実行場所に合った接続情報を記入します。
2. `pnpm prisma generate`と`pnpm prisma migrate dev`を実行し、Prisma Client生成と既存マイグレーション適用を行います。
3. `pnpm dev` でアプリケーションを起動後、別ターミナルで `pnpm worker` を実行して BullMQ ワーカーを常駐させます。
4. 新規登録 (`/register`) → TODO 作成/更新 (`/todos`) → メール送信ジョブが処理されることを順に確認します。送信ログは Pino を通じてコンソールに出力されます。

## 品質確認

依存更新やリリース前には、最低限以下を実行します。

```bash
pnpm exec tsc --noEmit
pnpm prisma validate
pnpm prisma generate
pnpm prisma migrate status
pnpm audit
pnpm build
docker compose build app
```

依存関係のセキュリティ対応や設計の詳細は、[`docs/koiki-tsfw-guide_0.2.0.md`](docs/koiki-tsfw-guide_0.2.0.md)を参照してください。

## 🔒 Fork・利用に関するご案内

このリポジトリはパブリック公開されていますが、以下の条件を遵守いただける方以外の Fork・再利用はご遠慮ください。

- Fork の前に、必ずリポジトリ管理者（@zaziedlm）にご連絡ください

無断でのForkや再利用が確認された場合、GitHubへの削除申請を行うことがあります。ご理解とご協力をお願いします。

## ライセンス

MIT License

https://opensource.org/license/mit
