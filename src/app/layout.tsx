import './globals.css';
import { ReactNode } from 'react';
import { Providers } from './providers';
import { Navigation } from './navigation';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          <Navigation />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
