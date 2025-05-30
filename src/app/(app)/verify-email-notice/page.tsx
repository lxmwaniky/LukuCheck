
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/config/firebase'; 
import { sendEmailVerification } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MailCheck, Loader2, Send, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const POLLING_INTERVAL = 5000; // Check every 5 seconds

export default function VerifyEmailNoticePage() {
  const { user, userProfile, loading, refreshUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  useEffect(() => {
    if (!loading && user && user.emailVerified) {
      router.replace('/upload');
    }
    if (!loading && !user) {
      router.replace('/login'); 
    }
  }, [user, loading, router]);

  // Polling for email verification status
  useEffect(() => {
    if (user && !user.emailVerified) {
      const intervalId = setInterval(async () => {
        if (auth.currentUser) {
          setIsCheckingStatus(true);
          try {
            await auth.currentUser.reload();
            // refreshUserProfile will update the user object in AuthContext
            await refreshUserProfile(); 
            // The main useEffect (above) will catch the change in user.emailVerified and redirect
          } catch (error) {
            console.warn("Polling: Failed to reload user status", error);
            // Don't toast on polling errors to avoid spamming user
          } finally {
            setIsCheckingStatus(false);
          }
        }
      }, POLLING_INTERVAL);

      return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }
  }, [user, refreshUserProfile]);
  
  const handleResendVerificationEmail = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to resend verification email.", variant: "destructive" });
      return;
    }
    setIsResending(true);
    try {
      await sendEmailVerification(user);
      toast({ title: 'Verification Email Resent', description: 'Please check your inbox (and spam folder).' });
    } catch (error: any) {
      console.error("Error resending verification email:", error);
      toast({ title: "Error", description: error.message || "Failed to resend verification email.", variant: "destructive" });
    } finally {
      setIsResending(false);
    }
  };

  const handleManualRefresh = async () => {
    if (!user) return; 
    setIsCheckingStatus(true);
    try {
      await user.reload();
      await refreshUserProfile(); // This will update context and trigger re-render + useEffect for redirection if verified
      
      // Check local auth.currentUser after reload, before context fully updates
      if (auth.currentUser?.emailVerified) {
        toast({title: "Verified!", description: "Redirecting..."});
        router.push('/upload'); // Explicit push in case context update is slightly delayed
      } else {
        toast({title: "Still Pending", description: "Your email is not yet verified. Please check your inbox or try resending."});
      }
    } catch (error) {
        console.error("Error during manual refresh:", error);
        toast({title: "Refresh Error", description: "Could not refresh status. Please try again.", variant: "destructive"});
    } finally {
        setIsCheckingStatus(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <p>Redirecting...</p>
      </div>
    );
  }


  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <MailCheck className="h-16 w-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl sm:text-3xl font-bold">Verify Your Email Address</CardTitle>
          <CardDescription className="text-md sm:text-lg text-muted-foreground mt-2">
            A verification link has been sent to <strong className="text-foreground">{user?.email}</strong>.
            Please click the link in the email to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            If you haven't received the email after a few minutes, please check your spam or junk folder.
            The page will automatically check your verification status.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleResendVerificationEmail} disabled={isResending} className="w-full sm:w-auto">
              {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Resend Verification Email
            </Button>
            <Button onClick={handleManualRefresh} variant="outline" className="w-full sm:w-auto" disabled={isCheckingStatus}>
              {isCheckingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              I've Verified, Refresh Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

