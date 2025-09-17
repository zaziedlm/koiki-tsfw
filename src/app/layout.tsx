import './globals.css';
import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header>
          <h1>KOIKI-(TS)FW</h1>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
