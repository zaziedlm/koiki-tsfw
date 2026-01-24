import Link from 'next/link';

export default async function HomePage() {
  return (
    <div className="container" style={{ marginTop: '3rem' }}>
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '1rem' }}>Welcome to KOIKI-(TS)FW</h2>
        <p style={{ marginBottom: '2rem' }}>
          Next.js を用いたエンタープライズアプリケーションのスタート地点です。
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/register" className="btn btn-primary">
            新規登録
          </Link>
          <Link href="/login" className="btn btn-outline">
            ログイン
          </Link>
          <Link href="/ui-guide" className="btn btn-outline">
            UIガイド
          </Link>
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: '1rem' }}>主な機能</h3>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem' }}>
            <li>ユーザー登録とログイン</li>
            <li>TODO管理機能（タスクの追加・完了）</li>
            <li>セキュアな認証とセッション管理</li>
            <li>レスポンシブなUIデザイン</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
