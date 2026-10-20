import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JobHunter AI — LinkedIn Job Extraction & Tailored CV Studio',
  description: 'AI-powered LinkedIn job discovery, resume auto-tailoring, and application assistant.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
