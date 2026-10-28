import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jobhunter — Career workspace',
  description: 'A focused workspace for job applications, career details, and tailored resumes.',
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
