
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Ghost, Home } from 'lucide-react'; // Changed icon to Ghost
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md w-full"> {/* Added w-full here */}
          <Ghost className="mx-auto h-24 w-24 text-primary sm:h-32 sm:w-32 animate-bounce" /> {/* Changed icon and styling */}
          <h1 className="mt-8 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Boo! Page Lost in the Ether
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Looks like this page has vanished like a friendly ghost. Or maybe the URL was a bit spooky?
          </p>
          <p className="mt-2 text-muted-foreground">
            Don't worry, we can help you find your way back from the spectral plane!
          </p>
          <div className="mt-10">
            <Link href="/" passHref legacyBehavior>
              <Button size="lg" className="text-lg py-3">
                <Home className="mr-2 h-5 w-5" />
                Return to Safe Ground
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
