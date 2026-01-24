'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { registerUser } from '../../actions/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    setIsPending(true);
    
    try {
      const result = await registerUser({ email, password, name: name || undefined });
      
      if (result.success) {
        setSuccess(true);
        setError('');
        // Automatically log in after registration
        const loginResult = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });
        
        if (loginResult?.ok) {
          router.push('/todos');
        } else {
          // If auto-login fails, redirect to login page
          router.push('/login');
        }
      } else {
        setError(result.error || 'ユーザー登録に失敗しました');
        setSuccess(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー登録に失敗しました');
      setSuccess(false);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '480px', marginTop: '3rem' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem' }}>新規ユーザー登録</h2>
        
        {error && (
          <p className="alert-danger" style={{ marginBottom: '1rem' }}>
            ⚠️ {error}
          </p>
        )}
        
        {success && (
          <p className="alert-success" style={{ marginBottom: '1rem' }}>
            ✅ 登録が完了しました。ログインしています...
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <label>
            <span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              氏名（任意）
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田 太郎"
              autoComplete="name"
            />
          </label>

          <label>
            <span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              メールアドレス *
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
              パスワード *
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8文字以上"
              autoComplete="new-password"
              required
              minLength={8}
            />
            <small className="text-muted" style={{ display: 'block', marginTop: '0.25rem' }}>
              8文字以上で入力してください
            </small>
          </label>

          <label>
            <span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              パスワード（確認） *
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="パスワードを再入力"
              autoComplete="new-password"
              required
              minLength={8}
            />
            <small className="text-muted" style={{ display: 'block', marginTop: '0.25rem' }}>
              確認のため、もう一度同じパスワードを入力してください
            </small>
          </label>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isPending}
            style={{ width: '100%' }}
          >
            {isPending ? '登録中...' : '登録する'}
          </button>
        </form>

        <p className="text-muted" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          すでにアカウントをお持ちですか？{' '}
          <Link href="/login" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
