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
  openGraph: {
    title: 'Harvestly | Smart Budget Tracking',
    description:
      'Cultivate your financial future with Harvestly. Track spending, set savings goals, manage debt, and visualize your financial health.',
    url: 'https://harvestlyapp.com',
    siteName: 'Harvestly',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Control your finances with Harvestly',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Harvestly | Smart Budget Tracking',
    description:
      'Cultivate your financial future with Harvestly. Track spending, set savings goals, manage debt, and visualize your financial health.',
    images: ['/og-image.png'],
  },
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
