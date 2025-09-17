'use client';

import { useEffect, useMemo, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'ui-guide-theme';

function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (mode === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', mode);
  }
}

function persistTheme(mode: ThemeMode) {
  if (typeof window === 'undefined') return;
  if (mode === 'system') {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  } else {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }
}

export default function UiGuidePage() {
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const updatePreference = () => setSystemPrefersDark(media.matches);
    updatePreference();
    media.addEventListener('change', updatePreference);
    return () => media.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
      applyTheme(stored);
    } else {
      applyTheme('system');
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  const resolvedTheme = useMemo(() => {
    return theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme;
  }, [theme, systemPrefersDark]);

  const modeLabels: Record<ThemeMode, string> = {
    light: 'ライト',
    dark: 'ダーク',
    system: 'システム',
  };
  const themeLabel = resolvedTheme === 'dark' ? 'ダーク' : 'ライト';
  const activeThemeLabel = theme === 'system' ? `${themeLabel}（システム設定に追随）` : themeLabel;

  return (
    <div
      className="container"
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <h1>UI デザインチェック</h1>
          <p className="text-muted">
            <code>globals.css</code> で定義したトークンやユーティリティが適用されているか確認するためのサンプル
            です。
          </p>
        </div>
        <div
          className="card"
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}
        >
          <span className="text-muted">テーマ切り替え</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['light', 'dark', 'system'] as const).map((mode) => {
              const isActive = theme === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  className="btn btn-outline"
                  aria-pressed={isActive}
                  onClick={() => setTheme(mode)}
                  style={
                    isActive
                      ? {
                          background: 'var(--primary)',
                          color: 'var(--primary-foreground)',
                          boxShadow: 'var(--shadow-sm)',
                          borderColor: 'var(--primary)',
                        }
                      : undefined
                  }
                >
                  {modeLabels[mode]}
                </button>
              );
            })}
          </div>
          <small className="text-muted">現在の表示テーマ: {activeThemeLabel}</small>
        </div>
      </header>

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <h2>タイポグラフィ</h2>
          <p className="text-muted">見出し・本文・補足テキストのスタイルを確認できます。</p>
        </div>
        <h1>Heading 1 - インパクトのある大見出し</h1>
        <h2>Heading 2 - セクションタイトル</h2>
        <h3>Heading 3 - 小見出し</h3>
        <p>
          段落テキストは十分な行間を確保し、読みやすさを重視した設計になっています。色はライト/ダーク
          モードに応じて自動的に切り替わります。
        </p>
        <p className="text-muted">Muted テキストは補足情報などに利用できます。</p>
        <small>small 要素は注釈や免責事項に最適です。</small>
        <pre>
{`const designTokens = {
  radius: '0.75rem',
  shadow: 'var(--shadow-sm)',
};`}
        </pre>
      </section>

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h2>ボタンとバッジ</h2>
          <p className="text-muted">プライマリ・アウトライン・ステータス用バッジの組み合わせ例です。</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button type="button" className="btn btn-primary">
            アクションを実行
          </button>
          <button type="button" className="btn btn-outline">
            セカンダリボタン
          </button>
          <button type="button" className="btn" disabled>
            無効状態
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="badge">New</span>
          <span className="badge" style={{ background: 'rgba(22, 163, 74, 0.12)', color: 'var(--success)' }}>
            Success
          </span>
          <span className="badge" style={{ background: 'rgba(220, 38, 38, 0.12)', color: 'var(--danger)' }}>
            Alert
          </span>
        </div>
      </section>

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h2>フォーム要素</h2>
          <p className="text-muted">入力フィールドや選択肢、送信ボタンのフォーカス状態を確認しましょう。</p>
        </div>
        <form className="grid" style={{ gap: '1rem' }}>
          <label>
            氏名
            <input name="name" placeholder="山田 太郎" autoComplete="name" />
          </label>
          <label>
            メールアドレス
            <input name="email" type="email" placeholder="taro@example.com" autoComplete="email" />
          </label>
          <label>
            ロール
            <select name="role" defaultValue="">
              <option value="" disabled>
                選択してください
              </option>
              <option value="admin">管理者</option>
              <option value="editor">編集者</option>
              <option value="viewer">閲覧のみ</option>
            </select>
          </label>
          <label>
            備考
            <textarea name="note" rows={3} placeholder="必要であれば補足を記入してください" />
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary">
              送信する
            </button>
            <button type="reset" className="btn btn-outline">
              リセット
            </button>
          </div>
        </form>
      </section>

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h2>カードとグリッド</h2>
          <p className="text-muted">
            <code>.grid</code> と <code>.card</code> を組み合わせてレスポンシブなレイアウトを実現します。
          </p>
        </div>
        <div className="grid grid--two">
          {[1, 2, 3, 4].map((item) => (
            <article key={item} className="card" style={{ gap: '0.75rem', display: 'flex', flexDirection: 'column' }}>
              <h3>カード {item}</h3>
              <p>
                データサマリやダッシュボードのウィジェットに利用できます。カード内でも同じトークンが再利用されます。
              </p>
              <button type="button" className="btn btn-outline">
                詳細を見る
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <h2>フィードバックメッセージ</h2>
          <p className="text-muted">成功・警告などのステータスをテキストだけで表現する例です。</p>
        </div>
        <p className="alert-success">✅ 保存が完了しました。次のステップに進んでください。</p>
        <p className="alert-danger">⚠️ 権限がないため操作を実行できません。管理者にお問い合わせください。</p>
      </section>
    </div>
  );
}
