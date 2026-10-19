import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'APK Sender - Share APK Files Easily',
  description: 'Upload any APK and get a shareable download link. Simple, fast, and free.',
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
