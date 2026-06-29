import type { Metadata } from "next";
import "./globals.css";
import Link from 'next/link';
import { Package, LogIn, UploadCloud } from 'lucide-react';

export const metadata: Metadata = {
  title: "WinRepo Platform",
  description: "Enterprise Windows software repository and deployment platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/software" className="flex items-center gap-2 font-bold text-xl text-blue-600 dark:text-blue-400">
              <Package className="h-6 w-6" />
              WinRepo
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/software" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm transition-colors">
                Software Catalog
              </Link>
              <Link href="/software/upload" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm transition-colors flex items-center gap-1">
                <UploadCloud className="h-4 w-4" /> Upload
              </Link>
              <Link href="/login" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm transition-colors flex items-center gap-1">
                <LogIn className="h-4 w-4" /> Login
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex-grow w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
