# KOIKI-(TS)FW v0.1.0 ガイド

## はじめに

KOIKI-(TS)FW は、FastAPI ベースである [KOIKI-FW v0.6.0](https://github.com/zaziedlm/koiki-pyfw) を Next.js + TypeScript で再設計したフルスタック開発フレームワークです。React Server Components と Next.js 15 系の機能を活かしつつ、Prisma・NextAuth.js・tRPC・BullMQ・Pino などを OSS コンポーネントとして組み合わせ、同様の Developer Experience（開発者体験） と機能要件をフロントエンド中心のエコシステムで達成することを目標にしています。

本書では、リポジトリ全体の設計思想・主要機能・構成要素を俯瞰し、Python 版ドキュメントにおける考え方との対応関係を整理します。

---

## 技術スタック

| カテゴリ | 採用技術 | 役割 | リンク |
| --- | --- | --- | --- |
| Web フレームワーク | Next.js 15 App Router | サーバーサイドレンダリングと API ルーティング | [Next.js](https://nextjs.org/) |
| 言語 | TypeScript 5.9 / React 19 | 型安全と最新 RSC 互換 UI | [TypeScript](https://www.typescriptlang.org/) |
| ORM / DB | Prisma Client + PostgreSQL | スキーマ定義・マイグレーション・DB アクセス | [Prisma](https://www.prisma.io/) |
| 認証 | NextAuth.js (Credentials Provider) | セッション・RBAC 補助 | [NextAuth.js](https://next-auth.js.org/) |
| API | tRPC v11 | 型安全な App Router API | [tRPC](https://trpc.io/) |
| キュー / ジョブ | BullMQ + Redis | 非同期ジョブ処理・メール送信 | [BullMQ](https://docs.bullmq.io/) |
| ロギング | Pino | JSON ログ出力・構造化ログ | [Pino](https://getpino.io/) |
| レート制御 | rate-limiter-flexible + Redis | API ミドルウェアでのリクエスト制御 | [rate-limiter-flexible](https://github.com/animir/node-rate-limiter-flexible) |
| メール | Nodemailer | SMTP 経由の通知送信 | [Nodemailer](https://nodemailer.com/) |

---

## ディレクトリ概要

```
.
├─ prisma/              # Prisma スキーマとマイグレーション
├─ src/
│  ├─ app/              # Next.js App Router (UI / Route Handler)
│  │  ├─ api/          # NextAuth と tRPC エンドポイント
│  │  ├─ ui-guide/     # デザインシステムのデモページ
│  │  ├─ layout.tsx    # アプリ全体のレイアウト
│  │  └─ globals.css   # デザイントークン & ベーススタイル
│  ├─ lib/              # 共通ライブラリ (Prisma, Auth, Queue, Logger …)
│  ├─ server/           # tRPC ルーターとサーバーコンテキスト
│  ├─ jobs/             # BullMQ ジョブ定義とワーカー
│  └─ middleware.ts     # レートリミット用 Next.js ミドルウェア
├─ docker-compose.yml   # Postgres / Redis / MailHog / Worker コンテナ
├─ Dockerfile           # マルチステージビルド (Turbopack 対応)
└─ docs/koiki-tsfw-guide.md  # 本ガイド
```

---

## アーキテクチャの全体像

* Next.js App Router を「アプリケーション層」と位置付け、UI と Route Handler (API) を同一フォルダで管理します。
* Prisma を「データ層」とし、TypeScript 型と DB モデルを一元化します。Python 版の SQLAlchemy + Pydantic 相当の責務を集約しました。
* tRPC で API をモジュール化し、`src/server/api/routers` 以下で Python 版の `libkoiki` 配下に相当する機能を構成しています。
* BullMQ と Nodemailer により非同期ジョブと通知送信を担当し、Redis を共通インフラとして利用します (オプション)。
* ミドルウェアでは Redis バックエンドのレートリミットを提供し、API エントリポイントを守ります。
* ロギングは Pino による JSON 出力を基本とし、将来的な Prometheus 連携を想定しています。

---

## アプリケーション層 (Next.js App Router)

* `src/app/layout.tsx` は HTML エントリポイントとしてグローバルスタイルを読み込み、共通ヘッダーを描画します。
* `src/app/page.tsx` はトップページのサンプルです。サーバーコンポーネントで静的 UI を提供します。
* `src/app/ui-guide/page.tsx` は UI コンポーネント・タイポグラフィ・フォームのカタログです。`globals.css` で定義したトークンが反映されるかを手元で検証できます。
* `src/app/globals.css` ではライト/ダークテーマへの対応、コンポーネント用のユーティリティクラス、`grid` レイアウトなどの基礎設計を提供しています。

### Route Handler

* `src/app/api/auth/[...nextauth]/route.ts` に NextAuth.js の設定を集約し、Credentials Provider により E メール / パスワード認証を実装します。
* `src/app/api/trpc/[trpc]/route.ts` は tRPC ルーターを Next.js の fetch ハンドラーとして公開します。Python 版の `app/api` (FastAPI Router) に相当します。

---

## 認証と RBAC 補助

* NextAuth.js は JWT セッション戦略を使用し、`next-auth.d.ts` によって `session.user.id` を型拡張しています。
* 認証処理では Prisma Adapter と `src/lib/auth.ts` のヘルパー (`hashPassword` / `verifyPassword` / `hasRole`) を利用します。
* `hasRole` は Prisma のリレーションを使い RBAC 判定を行います。将来的に Python 版の Permission モデルと同等の拡張が可能です。

---

## API 層 (tRPC)

* `src/server/trpc.ts` で tRPC の初期化と `createContext` を定義し、NextAuth セッションを API 各処理へ注入します。
* `src/server/api/routers/app.ts` がアプリ単位のルーターを構成し、`user` / `todo` / `auth` のサブモジュールを集約しています。
* 個別ルーターの責務:
  * `userRouter` (`me`, `list`) — セッションからユーザー情報を読み出すクエリを提供。
  * `todoRouter` (`list`, `create`, `toggle`) — ユーザーに紐づく Todo の CRUD 相当を実装し、Python 版のサービス + リポジトリ層の役割を統合しています。
  * `authRouter` (`register`, `resetRequest`) — ユーザー登録と簡易パスワードリセットメール送信を担当。BullMQ 経由でメールジョブを enqueue します。
* `protectedProcedure` により NextAuth セッション必須 API を宣言的に表現します。

---

## データモデリング (Prisma)

* `prisma/schema.prisma` は Python 版 `libkoiki/models`/`schemas` の役割を統合し、`User`・`Role`・`Permission`・`Todo` などのエンティティを定義します。
* Prisma Client は `src/lib/prisma.ts` でシングルトンとして管理し、開発環境でのホットリロードにも対応します。
* マイグレーションは `pnpm prisma migrate dev` で生成・適用できます。Docker 実行時は `pnpm prisma migrate deploy` を自動実行します。

---

## ミドルウェアとレートリミット

* `src/middleware.ts` は Next.js の Edge/Node ミドルウェアとして `rateLimit` を呼び出し、`/api` 配下のリクエスト頻度を制御します。
* `src/lib/rateLimit.ts` では Redis URL が設定された場合のみ `rate-limiter-flexible` を初期化し、IP ベースで 60 秒あたり 10 リクエストに制限します。Redis が無い場合は no-op として動作します。

---

## バックグラウンドジョブ (BullMQ)

* `src/lib/queue.ts` で Redis 接続とメール用 Queue インスタンスを lazy に生成します。
* `src/jobs/emailJob.ts` の `enqueueEmail` はキュー未設定時に警告ログのみを出力し、安全にスキップします。
* `src/jobs/worker.ts` は BullMQ Worker を起動し、メール送信ジョブを処理します。Redis が未設定ならワーカーは即終了して開発中の誤起動を防ぎます。
* `pnpm worker` スクリプトを通して開発環境からワーカーを実行できます。

---

## メール送信

* `src/lib/mailer.ts` は Nodemailer のトランスポートを `.env` 経由で構成し、HTML メール送信関数 `sendEmail` を提供します。
* Docker の `mailhog` サービス (profile `full`) でローカル開発中のメール確認が可能です。

---

## ロギングとモニタリング

* `src/lib/logger.ts` で Pino ロガーを初期化し、LOG_LEVEL に応じた JSON ログを標準出力へ記録します。
* Python 版で利用していた structlog + Prometheus に相当する機能は未移植です。今後は Pino Transport や OpenTelemetry Exporter の追加を前提に拡張できます。

---

## UI デザイン基盤

* `src/app/globals.css` で CSS カスタムプロパティ (デザイントークン)・レスポンシブグリッド・コンポーネントスタイル (`.btn`, `.badge`, `.card` など) を定義します。
* `src/app/ui-guide/page.tsx` はライト/ダーク切り替え、タイポグラフィ、ボタン、フォーム、カード、アラートなどのプレビューを提供し、スタイル設計のリファレンスとして機能します。
* 今後は Storybook や Playwright Visual Regression との連携を検討できます。

---

## 環境変数と設定

* `.env.example` に必須/任意の設定が整理されています。
  * `DATABASE_URL` — PostgreSQL への接続。
  * `NEXTAUTH_URL` / `NEXTAUTH_SECRET` — セッション生成に必須。
  * `REDIS_URL` — レートリミットと BullMQ を有効化する場合に設定。
  * `SMTP_*` — メール送信用トランスポート。
* `next.config.ts` は typedRoutes と Server Actions を有効化しており、Next.js 15.5 の Turbopack ビルドを前提にしています。
* `tsconfig.json` では strict mode を強制し、Next.js 用の型定義プラグインを組み込んでいます。

---

## ローカル開発手順

1. 依存関係のインストール
   ```bash
   pnpm install
   ```
2. Prisma 初期化とマイグレーション
   ```bash
   pnpm prisma migrate dev --name init
   ```
3. 開発サーバー起動 (Turbopack)
   ```bash
   pnpm dev
   ```
4. バックグラウンドワーカーの起動 (Redis 利用時)
   ```bash
   pnpm worker
   ```
5. 必要に応じて `.env` を編集し、`REDIS_URL` や SMTP 設定を追加します。

---

## Docker / コンテナ運用

* `docker-compose.yml` で以下のサービスをまとめて起動できます。
  * `app`: Next.js 本体 (Postgres 依存)。
  * `worker`: BullMQ ワーカー (Redis + MailHog に依存)。`--profile full` 指定時のみ起動します。
  * `postgres`: 開発用 PostgreSQL 16。
  * `redis`: キューとレート制御用 Redis。
  * `mailhog`: メール捕捉用 UI (http://localhost:8025)。
* ビルドと起動:
  ```bash
  docker compose up --build
  ```
* Redis/メールまで含めて動作確認する場合:
  ```bash
  docker compose --profile full up --build
  ```
* Dockerfile はマルチステージ構成で、依存解決 → Prisma 生成 → Turbopack ビルド → ランタイムの順にイメージを最適化しています。社内 CA を追加できるよう `/docker/certs` を読み込む仕組みも継承しています。

---

## テストと品質管理

* 現状は自動テストのセットアップが未実装です。Python 版で提供していた pytest / セキュリティテスト (slowapi) に相当する仕組みが課題となります。
* 優先度の高い TODO:
  * Prisma Schema を用いたシードデータ・E2E テスト (Playwright または Vitest + tRPC テストクライアント)。
  * BullMQ ジョブの単体テスト (Queue Mock) と Mailer の検証。
  * Lint / Format / Type Check CI (GitHub Actions) の導入。
  * レートリミットや RBAC の回帰テスト。

---

## Python 版からの差分とロードマップ

| 項目 | FastAPI 版 | Next.js 版の現状 | 今後の課題 |
| --- | --- | --- | --- |
| 認証 | JWT + OAuth2 | NextAuth.js Credentials | OAuth プロバイダ対応、Permission API 拡充 |
| RBAC | Role/Permission サービス層 | Prisma と `hasRole` のみ | 権限管理 UI、tRPC ミドルウェアの拡張 |
| レート制御 | slowapi | rate-limiter-flexible | Redis 無し環境での代替、メトリクス収集 |
| 背景ジョブ | Celery | BullMQ | 遅延ジョブ種別の追加、監視工具 (Arena 等) |
| ロギング | structlog + Prometheus | Pino | Access Log 統合、OpenTelemetry |
| テスト | pytest / security scripts | 未整備 | playwright / vitest / lint CI |
| ドキュメント | docs/*.md | 本ガイドのみ | API リファレンス、チュートリアル整備 |

Python 版ドキュメント (`docs/design_kkfw_0.6.0.md`) に記載された DDD / Modular Monolith の考え方は、本リポジトリでも tRPC ルーターの分割や Prisma モデルで引き続き活かせます。必要に応じて `src/server/api/routers` を機能軸で細分化し、UI 層にも同じ語彙 (Todo、Auth など) を導入すると保守性が向上します。

---

## 参考資料

* KOIKI-FW v0.6.0 ドキュメント: [`docs/design_kkfw_0.6.0.md`](https://raw.githubusercontent.com/zaziedlm/koiki-pyfw/master/docs/design_kkfw_0.6.0.md)
* Next.js 15 リリースノート: <https://nextjs.org/blog>
* tRPC v11 ドキュメント: <https://trpc.io/docs>
* Prisma Schema リファレンス: <https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference>
* BullMQ ガイド: <https://docs.bullmq.io/>
* Pino ロギング: <https://getpino.io/>

---

今後は FastAPI 版と同様に、セキュリティテストや CI/CD、監視ツールを段階的に移植することで、Next.js 版フレームワークの完成度を高めることができます。
