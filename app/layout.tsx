import './globals.css';
import type { ReactNode } from 'react';

export const metadata = { title: 'Wanderer', description: 'A walk through a dotted world.' };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
