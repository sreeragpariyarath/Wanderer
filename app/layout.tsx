import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import './globals.css';

const volkswagenSerial = localFont({
  src: [
    {
      path: './fonts/fonnts.com-volkswagen_serial-light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: './fonts/fonnts.com-volkswagen_serial-lightitalic.otf',
      weight: '300',
      style: 'italic',
    },
    {
      path: './fonts/fonnts.com-volkswagen_serial-regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/fonnts.com-volkswagen_serial-italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: './fonts/fonnts.com-volkswagen_serial-medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/fonnts.com-volkswagen_serial-mediumitalic.otf',
      weight: '500',
      style: 'italic',
    },
    {
      path: './fonts/fonnts.com-volkswagen_serial-bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: './fonts/fonnts.com-volkswagen_serial-bolditalic.otf',
      weight: '700',
      style: 'italic',
    },
    {
      path: './fonts/fonnts.com-volkswagen_serial-xbold.otf',
      weight: '800',
      style: 'normal',
    },
    {
      path: './fonts/fonnts.com-volkswagen_serial-xbolditalic.otf',
      weight: '800',
      style: 'italic',
    },
    {
      path: './fonts/fonnts.com-volkswagen_serial-black.otf',
      weight: '900',
      style: 'normal',
    },
    {
      path: './fonts/fonnts.com-volkswagen_serial-blackitalic.otf',
      weight: '900',
      style: 'italic',
    },
  ],
  variable: '--font-volkswagen-serial',
  display: 'swap',
  preload: false,
  fallback: ['Arial', 'sans-serif'],
});

export const metadata = {
  title: 'Wanderer',
  description: 'A walk through a dotted world.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={volkswagenSerial.variable}>
      <body>{children}</body>
    </html>
  );
}
