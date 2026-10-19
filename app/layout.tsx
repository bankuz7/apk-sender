import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'File Sender - Share Any File Easily',
  description: 'Upload any file — APK, images, videos, documents, archives — and get a shareable download link. Simple, fast, and free.',
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
