import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'DevVault - Income Verification for Independent Developers',
  description: 'Professional income verification service for freelance developers. Verify your banking, platform earnings, and generate compliant reports.',
  keywords: 'income verification, freelance developer, banking, documentation, stripe, github sponsors',
  openGraph: {
    title: 'DevVault - Income Verification for Independent Developers',
    description: 'Professional income verification service for freelance developers',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevVault - Income Verification',
    description: 'Professional income verification for independent developers',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="antialiased font-sans bg-slate-50 text-slate-900">
        <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 -z-10" />
        {children}
      </body>
    </html>
  );
}