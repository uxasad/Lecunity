import './globals.css';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import type { Metadata } from 'next';
import { ThemeToggle } from '@/components/theme-toggle';
import { THEME_STORAGE_KEY } from '@/lib/theme';

const inter = Inter({ subsets: ['latin'] });
const themeInitializationScript = `(() => {
  try {
    const savedTheme = window.localStorage.getItem('${THEME_STORAGE_KEY}');
    document.documentElement.dataset.theme = savedTheme === 'light' ? 'light' : 'dark';
  } catch (error) {
    console.error('Failed to read theme preference:', error);
    document.documentElement.dataset.theme = 'dark';
  }
})();`;

export const metadata: Metadata = {
  title: 'Lecunity - AI-Powered Lecture Transcription',
  description: 'Convert audio and video lectures into structured, comprehensive notes using AI',
  keywords: ['transcription', 'lecture notes', 'AI', 'education', 'study tool'],
  authors: [{ name: 'Lecunity' }],
  openGraph: {
    title: 'Lecunity - AI-Powered Lecture Transcription',
    description: 'Convert audio and video lectures into structured, comprehensive notes using AI',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <Script id="theme-initialization" strategy="beforeInteractive">
          {themeInitializationScript}
        </Script>
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-canvas">
          <header className="bg-surface shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg
                    className="h-8 w-8 text-primary-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h1 className="text-2xl font-bold text-gray-900">Lecunity</h1>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main>{children}</main>
          <footer className="bg-surface border-t border-gray-200 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <p className="text-center text-gray-500 text-sm">
                © {new Date().getFullYear()} Lecunity. Open-source under MIT License.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
