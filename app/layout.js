import './globals.css';

export const metadata = { title: 'Wanderer', description: 'A walk through a dotted world.' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
