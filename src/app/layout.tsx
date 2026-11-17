import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jobhunter — Your career workspace',
  description: 'Organize job opportunities, build your career profile, and prepare focused resumes for your next role.',
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

