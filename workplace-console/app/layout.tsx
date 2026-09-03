import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SendWiseWorkplace Console',
  description:
    'Privacy-preserving workplace harassment nudge system — HR, PoSH IC, and EAP consoles.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
