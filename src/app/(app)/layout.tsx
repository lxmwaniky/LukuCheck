
'use client';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react'; 

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (user && !user.emailVerified) {
        // Allow access to /verify-email-notice itself
        if (window.location.pathname !== '/verify-email-notice') {
           router.replace('/verify-email-notice');
        }
      }
    }
  }, [user, userProfile, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading LukuCheck...</p>
      </div>
    );
  }

  if (!user || (user && !user.emailVerified && window.location.pathname !== '/verify-email-notice')) {
    // This case handles redirection state or if user tries to access other app pages before verification
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Redirecting...</p>
      </div>
    );
  }
  

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 container py-4 sm:py-6 md:py-8">{children}</main>
      <SiteFooter />
    </div>
  );
}
