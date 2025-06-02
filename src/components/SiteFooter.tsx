
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Coffee, MessageSquareQuote } from 'lucide-react'; // Changed MessageSquareQuestion to MessageSquareQuote
import { buttonVariants } from '@/components/ui/button'; 
import { cn } from '@/lib/utils'; 

export function SiteFooter() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  // const contactEmail = 'lxmwaniky@gmail.com'; // Kept for direct contact if needed elsewhere
  const paypalEmail = 'lekko254@gmail.com';
  const paypalDonationUrl = `https://www.paypal.com/donate/?business=${encodeURIComponent(paypalEmail)}&no_recurring=0&item_name=Support+LukuCheck&currency_code=USD`;

  return (
    <footer className="py-6 md:px-8 md:py-0 border-t">
      <div className="container flex flex-col items-center justify-center gap-4 md:h-20 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          {currentYear ? `© ${currentYear} ` : '© '}
          <a
            href="https://lxmwaniky.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline underline-offset-4"
          >
            Alex Nyambura
          </a>
          . All Rights Reserved.
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <Link href="/terms-of-service" legacyBehavior passHref>
            <a className="hover:text-primary hover:underline underline-offset-4">Terms of Service</a>
          </Link>
          <Link href="/privacy-policy" legacyBehavior passHref>
            <a className="hover:text-primary hover:underline underline-offset-4">Privacy Policy</a>
          </Link>
          <Link href="/submit-ticket" legacyBehavior passHref>
            <a className="flex items-center hover:text-primary hover:underline underline-offset-4">
              <MessageSquareQuote className="mr-1 h-4 w-4" /> Support / Report Issue
            </a>
          </Link>
          <a
            href={paypalDonationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-auto px-3 py-1.5" 
            )}
            aria-label="Donate to support LukuCheck"
          >
            <Coffee className="mr-1.5 h-4 w-4" /> Donate
          </a>
        </div>
      </div>
    </footer>
  );
}
