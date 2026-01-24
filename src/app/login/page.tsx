'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/todos';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('メールアドレスまたはパスワードが正しくありません');
      } else if (result?.ok) {
        window.location.href = callbackUrl;
      }
    } catch (err) {
      setError('ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '480px', marginTop: '3rem' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem' }}>ログイン</h2>
        
        {error && (
          <p className="alert-danger" style={{ marginBottom: '1rem' }}>
            ⚠️ {error}
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <label>
            <span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              メールアドレス
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="taro@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              パスワード
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              autoComplete="current-password"
              required
            />
          </label>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ width: '100%' }}
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <p className="text-muted" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          アカウントをお持ちでないですか？{' '}
          <Link href="/register" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ maxWidth: '480px', marginTop: '3rem' }}>
        <p>読み込み中...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
