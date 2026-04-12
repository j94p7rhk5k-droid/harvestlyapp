import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from '@/components/Providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Harvestly | Smart Budget Tracking',
  description:
    'Cultivate your financial future with Harvestly. Track spending, set savings goals, manage debt, and visualize your financial health — all in one beautiful dashboard.',
  keywords: ['budget', 'finance', 'tracking', 'savings', 'goals', 'expenses'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className={`${inter.className} bg-navy-950 text-white min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
