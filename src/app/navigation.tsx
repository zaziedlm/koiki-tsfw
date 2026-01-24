'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export function Navigation() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
      padding: '1rem 0',
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <div>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>KOIKI-(TS)FW</h1>
          </Link>
        </div>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isLoading ? (
            <span className="text-muted">読み込み中...</span>
          ) : session ? (
            <>
              <span className="text-muted">
                こんにちは、{session.user?.name || session.user?.email}さん
              </span>
              <Link href="/todos" className="btn btn-outline">
                TODO管理
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="btn btn-outline"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-outline">
                ログイン
              </Link>
              <Link href="/register" className="btn btn-primary">
                新規登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
