import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PG Web IDE',
  description: 'PostgreSQL Web IDE for local-pg',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white dark:bg-gray-900 text-black dark:text-white">
        <main className="flex flex-col min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}