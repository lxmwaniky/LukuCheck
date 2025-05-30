
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Coffee } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button'; // Import buttonVariants
import { cn } from '@/lib/utils'; // Import cn

export function SiteFooter() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const contactEmail = 'lxmwaniky@gmail.com';
  const paypalEmail = 'lekko254@gmail.com';
  const paypalDonationUrl = `https://www.paypal.com/donate/?business=${encodeURIComponent(paypalEmail)}&no_recurring=0&item_name=Support+LukuCheck&currency_code=USD`;

  const bugReportSubject = encodeURIComponent('Bug Report - LukuCheck');
  const bugReportBody = encodeURIComponent(
`Please describe the bug:
[Your description here]

Steps to reproduce:
1.
2.
3.

Expected behavior:
[What you expected to happen]

Actual behavior:
[What actually happened]

Browser/OS (if applicable):
[e.g., Chrome on Windows 10, Safari on iOS 17]`
  );

  const feedbackSubject = encodeURIComponent('Feedback - LukuCheck');
  const feedbackBody = encodeURIComponent(
`I'd like to share some feedback about LukuCheck:

[Your feedback here]`
  );

  const mailtoBugReport = `mailto:${contactEmail}?subject=${bugReportSubject}&body=${bugReportBody}`;
  const mailtoFeedback = `mailto:${contactEmail}?subject=${feedbackSubject}&body=${feedbackBody}`;

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
          <a href={mailtoBugReport} className="hover:text-primary hover:underline underline-offset-4">
            Report a Bug
          </a>
          <a href={mailtoFeedback} className="hover:text-primary hover:underline underline-offset-4">
            Send Feedback
          </a>
          <a
            href={paypalDonationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-auto px-3 py-1.5" // Adjusted padding/height for a slightly smaller button feel
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
