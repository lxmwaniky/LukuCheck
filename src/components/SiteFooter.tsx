
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquareQuote } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button'; 
import { cn } from '@/lib/utils'; 

export function SiteFooter() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Copyright Section */}
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {currentYear ? `© ${currentYear} ` : '© '}
              LukuCheck. All Rights Reserved.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Fashion AI Rating Platform
            </p>
          </div>

          {/* Links and Actions */}
          <div className="flex flex-wrap justify-center items-center gap-4 text-sm">
            <Link href="/terms-of-service" legacyBehavior passHref>
              <a className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                Terms of Service
              </a>
            </Link>
            <Link href="/privacy-policy" legacyBehavior passHref>
              <a className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                Privacy Policy
              </a>
            </Link>
            <Link href="/submit-ticket" legacyBehavior passHref>
              <a className="flex items-center text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
                <MessageSquareQuote className="mr-1.5 h-4 w-4" /> 
                Support
              </a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
