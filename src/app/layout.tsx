
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@vercel/analytics/react';
import { lukuCheckStructuredData, organizationStructuredData } from '@/lib/structured-data';
// Removed Alert and AlertTriangle imports as the banner is removed

const geistSans = GeistSans;
const geistMono = GeistMono;

const APP_NAME = 'LukuCheck';
const APP_DESCRIPTION = 'Rate your outfit and climb the leaderboard! Fashion AI technology meets community.';
const APP_URL = 'https://lukucheck.lxmwaniky.me'; 
const APP_PREVIEW_IMAGE_URL = 'https://placehold.co/1200x630.png?text=LukuCheck';


export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME} - By ${CREATOR_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    'LukuCheck',
    'fashion AI',
    'outfit rating',
    'style app',
    'fashion community',
    'AI fashion analysis',
    'outfit feedback',
    'style leaderboard',
    'fashion technology',
    'clothing analysis',
    'style suggestions'
  ],
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    siteName: `${APP_NAME} - By ${CREATOR_NAME}`,
    title: {
        default: `${APP_NAME} - By ${CREATOR_NAME}`,
        template: `%s | ${APP_NAME} - By ${CREATOR_NAME}`,
    },
    description: APP_DESCRIPTION,
    url: APP_URL,
    locale: 'en_US',
    images: [
      {
        url: APP_PREVIEW_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: `${APP_NAME} - Fashion AI App by ${CREATOR_NAME}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: {
        default: `${APP_NAME} - By ${CREATOR_NAME}`,
        template: `%s | ${APP_NAME} - By ${CREATOR_NAME}`,
    },
    description: APP_DESCRIPTION,
    creator: `@${CREATOR_NAME.replace(' ', '')}`,
    images: [APP_PREVIEW_IMAGE_URL],
  },
  verification: {
    google: 'add-your-google-verification-code-here',
  },
  alternates: {
    canonical: APP_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(lukuCheckStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
        />
        <meta name="author" content={CREATOR_NAME} />
        <meta name="creator" content={CREATOR_NAME} />
        <meta name="owner" content={CREATOR_NAME} />
        <meta name="designer" content={CREATOR_NAME} />
        <meta name="developer" content={CREATOR_NAME} />
        <meta property="article:author" content={CREATOR_NAME} />
        <link rel="canonical" href={APP_URL} />
      </head>
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
