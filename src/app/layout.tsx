
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@vercel/analytics/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

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
          <Alert variant="destructive" className="fixed top-0 left-0 right-0 z-[200] m-4 rounded-lg shadow-lg">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="font-semibold">LukuCheck Temporarily Offline</AlertTitle>
            <AlertDescription className="text-sm">
              Due to operational expenses, LukuCheck is currently offline. We are working hard to bring it back as soon as possible and appreciate your patience. Please check back later!
            </AlertDescription>
          </Alert>
          <div className="flex min-h-screen flex-col pt-24"> {/* Added pt-24 for banner spacing */}
            {children}
          </div>
          <Toaster />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}

