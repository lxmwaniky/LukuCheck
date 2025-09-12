'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { auth, googleProvider, signInWithPopup } from '@/config/firebase';
import { createUserProfileInFirestore } from '@/actions/userActions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface GoogleAuthButtonProps {
  mode: 'signin' | 'signup';
  onSuccess?: (user: any) => void;
  onError?: (error: any) => void;
  disabled?: boolean;
  className?: string;
  referrerUid?: string | null;
}

export function GoogleAuthButton({ 
  mode, 
  onSuccess, 
  onError, 
  disabled = false,
  className = '',
  referrerUid = null
}: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleAuth = async () => {
    if (!auth) {
      toast({
        title: "Authentication Error",
        description: "Firebase authentication is not available.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if this is a new user by examining the creation time
      const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;
      
      if (isNewUser && referrerUid) {
        // For new users with referrals, create profile with referral info
        // This needs to happen before AuthContext processes the user
        const profileResult = await createUserProfileInFirestore(
          user.uid,
          user.email || '',
          user.displayName || user.email?.split('@')[0] || 'User',
          referrerUid
        );

        if (!profileResult.success) {
          console.error('Failed to create profile with referral:', profileResult.error);
        }
      }
      // For other cases (existing users or new users without referrals), 
      // let AuthContext handle profile creation
      
      toast({
        title: mode === 'signin' ? 'Login Successful!' : 'Account Created!',
        description: mode === 'signin' ? 'Welcome back!' : 'Welcome to LukuCheck!',
      });

      if (onSuccess) {
        onSuccess(user);
      }
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in was cancelled. Please try again.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Pop-up blocked. Please enable pop-ups for this site.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "An account already exists with this email address using a different sign-in method.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = "Sign-in cancelled. Please try again.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection and try again.";
      }

      toast({
        title: mode === 'signin' ? "Sign-in Failed" : "Sign-up Failed",
        description: errorMessage,
        variant: "destructive",
      });

      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleAuth}
      disabled={disabled || isLoading}
      className={`w-full relative ${className}`}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <svg
          className="mr-2 h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      )}
      {mode === 'signin' ? 'Continue with Google' : 'Sign up with Google'}
    </Button>
  );
}