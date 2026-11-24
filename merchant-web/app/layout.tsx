import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dukkan Merchant',
  description: 'Manage your store on Dukkan',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
