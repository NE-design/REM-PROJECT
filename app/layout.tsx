import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'greek'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Property Management',
  description: 'Πλατφόρμα διαχείρισης ακινήτων',
  appleWebApp: { capable: true, title: 'Property Mgmt', statusBarStyle: 'default' },
};
export const viewport: Viewport = { themeColor: '#0b6e7a', viewportFit: 'cover', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
