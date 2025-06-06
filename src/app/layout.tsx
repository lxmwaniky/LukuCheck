
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@vercel/analytics/react';
// Removed Alert and AlertTriangle imports as the banner is removed

const geistSans = GeistSans;
const geistMono = GeistMono;

const APP_NAME = 'LukuCheck';
const APP_DESCRIPTION = 'Rate your outfit and climb the leaderboard!';
const APP_URL = 'https://lukucheck.vercel.app'; 
const APP_PREVIEW_IMAGE_URL = 'https://placehold.co/1200x630.png?text=LukuCheck';


export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: {
        default: APP_NAME,
        template: `%s | ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    url: APP_URL,
    images: [
      {
        url: APP_PREVIEW_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: `${APP_NAME} Preview`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: {
        default: APP_NAME,
        template: `%s | ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    images: [APP_PREVIEW_IMAGE_URL],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        suppressHydrationWarning={true}
      >
        <Providers>
          {/* Shutdown banner removed */}
          <div className="flex min-h-screen flex-col"> {/* Ensure flex layout pushes footer down */}
            {children}
          </div>
          <Toaster />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
