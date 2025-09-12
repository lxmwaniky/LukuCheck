
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/config/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { MailCheck, Loader2, Send, RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const POLLING_INTERVAL = 5000; // Check every 5 seconds

export default function VerifyEmailNoticePage() {
  const { user, userProfile, loading, refreshUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [emailSentCount, setEmailSentCount] = useState(1); // First email sent during signup
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());

  useEffect(() => {
    if (!loading && user && user.emailVerified) {
      router.replace('/upload'); // Updated redirect
    }
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Polling for email verification status
  useEffect(() => {
    if (user && !user.emailVerified && auth) {
      const intervalId = setInterval(async () => {
        if (auth && auth.currentUser) {
          setIsCheckingStatus(true);
          setLastCheckTime(Date.now());
          try {
            await auth.currentUser.reload();
            await refreshUserProfile();
          } catch (error) {
            // console.warn("Polling: Failed to reload user status", error);
          } finally {
            setIsCheckingStatus(false);
          }
        }
      }, POLLING_INTERVAL);

      return () => clearInterval(intervalId);
    }
  }, [user, refreshUserProfile]);

  // Track time elapsed
  useEffect(() => {
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setTimeElapsed(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  const handleResendVerificationEmail = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to resend verification email.", variant: "destructive" });
      return;
    }
    setIsResending(true);
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/upload`, // Updated redirect
        handleCodeInApp: true,
      };
      await sendEmailVerification(user, actionCodeSettings);
      setEmailSentCount(prev => prev + 1);
      toast({ title: 'Verification Email Resent', description: 'Please check your inbox (and spam folder).' });
    } catch (error: any) {
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
      await refreshUserProfile();

      if (auth && auth.currentUser?.emailVerified) {
        toast({title: "Verified!", description: "Redirecting..."});
        router.push('/upload'); // Updated redirect
      } else {
        toast({title: "Still Pending", description: "Your email is not yet verified. Please check your inbox or try resending."});
      }
    } catch (error) {
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

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getStatusColor = () => {
    if (isCheckingStatus) return "text-blue-600";
    if (timeElapsed < 60000) return "text-green-600"; // First minute - optimistic
    if (timeElapsed < 300000) return "text-yellow-600"; // 5 minutes - patient
    return "text-orange-600"; // Longer - may need help
  };

  const getProgressValue = () => {
    // Show progress based on typical email delivery time (0-60 seconds)
    const progressTime = Math.min(timeElapsed, 60000);
    return (progressTime / 60000) * 100;
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl rounded-xl">
        <CardHeader className="text-center">
          <div className="relative mb-4 mx-auto">
            <MailCheck className="h-16 w-16 text-primary mx-auto" />
            {isCheckingStatus && (
              <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-1">
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">Verify Your Email Address</CardTitle>
          <CardDescription className="text-md sm:text-lg text-muted-foreground mt-2">
            A verification link has been sent to <strong className="text-foreground">{user?.email}</strong>.
            Please click the link in the email to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status and Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Checking verification status...</span>
              <span className={`font-medium ${getStatusColor()}`}>
                {isCheckingStatus ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(timeElapsed)}
                  </span>
                )}
              </span>
            </div>
            
            {timeElapsed < 60000 && (
              <div className="space-y-2">
                <Progress value={getProgressValue()} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  Email typically arrives within 60 seconds
                </p>
              </div>
            )}
          </div>

          {/* Status Alerts */}
          {timeElapsed > 120000 && timeElapsed < 300000 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Still waiting?</strong> Check your spam/junk folder. Email delivery can sometimes take a few minutes.
              </AlertDescription>
            </Alert>
          )}

          {timeElapsed > 300000 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Taking longer than expected?</strong> Try resending the email or contact support if the problem persists.
              </AlertDescription>
            </Alert>
          )}

          {emailSentCount > 1 && (
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Email resent!</strong> You've received {emailSentCount} verification emails. Check your inbox and spam folder.
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <div className="text-sm text-muted-foreground space-y-2 bg-muted/30 p-4 rounded-lg">
            <p className="font-medium text-foreground">What to do next:</p>
            <ul className="space-y-1 ml-4">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                <span>Check your inbox for an email from LukuCheck</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                <span>Click the verification link in the email</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                <span>This page will automatically detect verification</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button onClick={handleResendVerificationEmail} disabled={isResending} className="w-full sm:w-auto">
              {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {emailSentCount > 1 ? 'Send Again' : 'Resend Email'}
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

