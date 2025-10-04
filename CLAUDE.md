# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

KOIKI-(TS)FW は、Python ベースの KOIKI-FW の機能を Next.js + TypeScript に移植したエンタープライズグレードのフルスタックフレームワークテンプレート。Next.js 15.5、Prisma、NextAuth.js、tRPC、BullMQ を組み合わせ、型安全性とセキュアな実装を提供する。

## 開発コマンド

### 基本コマンド

```bash
# 開発サーバー起動（Turbopack使用）
pnpm dev

# 本番ビルド
pnpm build

# 本番サーバー起動
pnpm start

# BullMQワーカー起動（メール送信ジョブ処理）
pnpm worker
```

### Prismaコマンド

```bash
# マイグレーション作成・適用
pnpm prisma migrate dev --name <migration_name>

# 本番マイグレーション適用
pnpm prisma migrate deploy

# Prisma Studio起動（DBブラウザ）
pnpm prisma studio

# Prismaクライアント再生成
pnpm prisma generate
```

### テストコマンド

```bash
# ユニットテスト（vitest）
pnpm test:unit

# 統合テスト
pnpm test:integration

# E2Eテスト
pnpm test:e2e
```

統合テストとE2Eテストは `scripts/` 配下のMJSスクリプトで実行される。テスト環境用の環境変数は `.env.test` を参照。

### Docker環境

```bash
# 最小構成（App + PostgreSQL）
docker compose up --build

# フル構成（Redis、MailHog、Worker含む）
docker compose --profile full up --build
```

## アーキテクチャ

### tRPC API構成

tRPC APIは `src/server/api/routers/` 配下のルーターで構成される：

- **app.ts**: 各ルーターを統合したルートルーター（`AppRouter` 型をエクスポート）
- **auth.ts**: 認証関連（登録、メール認証、パスワード検証）
- **user.ts**: ユーザー管理
- **todo.ts**: TODO CRUD

エンドポイント: `/api/trpc/[trpc]`（`src/app/api/trpc/[trpc]/route.ts`）

### 認証フロー

- NextAuth.js（v4）+ Prisma Adapter
- 資格情報ベース認証（メール＋パスワード）
- メール検証トークンは `EmailVerificationToken` モデルで管理
- パスワードポリシー: `src/lib/passwordPolicy.ts`
- ログイン試行レート制限: `src/lib/registerRateLimiter.ts`（Redis使用時のみ有効）
- RBAC補助関数: `src/lib/auth.ts` の `hasRole()`

### コンテキスト解決

tRPCコンテキスト（`src/server/trpc.ts`）は以下を含む：

- `session`: NextAuth.jsセッション
- `req`: Requestオブジェクト
- `ip`: クライアントIPアドレス（`x-real-ip` → `x-forwarded-for` → `cf-connecting-ip` の順で解決）

### データモデル（Prisma）

主要モデル（`prisma/schema.prisma`）：

- **User**: ユーザー本体（`hashedPassword`, `emailVerified`, `roles`, `todos` 等）
- **Role / Permission / RolePermission**: RBAC用の権限管理
- **UserRole**: User-Role多対多リレーション
- **Session**: NextAuth.jsセッション管理
- **Todo**: サンプルドメインモデル
- **EmailVerificationToken**: メール検証トークン

### Redis依存機能

以下の機能は `REDIS_URL` 環境変数が設定されている場合のみ有効化される：

- **レートリミット**: `src/lib/rateLimit.ts` + `src/middleware.ts`（10リクエスト/60秒）
- **メールキュー**: `src/lib/queue.ts` + `src/jobs/emailJob.ts` + `src/jobs/worker.ts`

Redis未設定時は自動的にスキップされ、エラーにならない。

### ロギング

- Pino（`src/lib/logger.ts`）によるJSON構造化ログ
- 監査ログは `logger.info({ audit: true, ... })` で記録

## 重要な実装パターン

### 環境変数の条件分岐

Redis、SMTP等の外部依存は環境変数の有無で機能を有効/無効化する。未設定時は常に安全にスキップする実装パターンを踏襲すること。

### Next.js 15対応

- `cookies()` / `headers()` は非同期API（`await cookies()`）
- Turbopack使用（`--turbo` フラグ）
- 型付きルーティング有効化（`typedRoutes: true`）

### テスト戦略

- vitestでユニットテスト（`.env.test` + `vitest.setup.ts`）
- 統合テスト・E2Eテストは専用スクリプト（`scripts/*.mjs`）経由で実行
- Prismaモックは必要に応じてテスト用DBまたはシングルトンリセット

### tRPCプロシージャの使い分け

- `publicProcedure`: 認証不要
- `protectedProcedure`: 認証必須（セッション必須、`UNAUTHORIZED`エラー）

## Fork・再利用に関する注意

このリポジトリはパブリック公開だが、無断Forkは禁止。利用前に必ずリポジトリ管理者（@zaziedlm）に連絡すること。
