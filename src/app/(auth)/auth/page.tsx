
'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createUserProfileInFirestore } from '@/actions/userActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User as UserIconProp, Sparkles, Shirt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GoogleAuthButton } from '@/components/ui/google-auth-button';

function AuthForm() {
  const { user, loading, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const returnTo = searchParams.get('returnTo');

  useEffect(() => {
    if (!loading && user) {
      // User is authenticated, redirect to intended page or upload as default
      const redirectPath = returnTo || '/upload';
      router.replace(redirectPath);
    }
  }, [user, loading, router, returnTo]);

  const handleGoogleSignupSuccess = () => {
    // The GoogleAuthButton will handle the success, and useEffect will redirect
    toast({ 
      title: 'Welcome to LukuCheck!', 
      description: "Let's check out some outfits!" 
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header with logo */}
      <div className="flex items-center justify-between p-6">
        <Link href="/" className="flex items-center gap-2">
          <Shirt className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">LukuCheck</span>
        </Link>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col items-center justify-center px-4 py-16 lg:py-32 text-center min-h-[calc(100vh-80px)]">
        <div className="container mx-auto max-w-lg lg:max-w-xl">
          <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 dark:text-white mb-8 lg:mb-12">
            Sign in to your account
          </h1>
          
          <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-12 lg:mb-16 leading-relaxed">
            Continue to LukuCheck
          </p>
          
          <div className="max-w-md mx-auto">
            <GoogleAuthButton 
              mode="signup" 
              onSuccess={handleGoogleSignupSuccess}
              returnTo={returnTo}
              className="w-full py-4 lg:py-5 text-lg lg:text-xl font-medium"
            />
          </div>
          
          <div className="mt-16 lg:mt-20">
            <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 leading-relaxed">
              By continuing, you agree to our{' '}
              <Link href="/terms-of-service" className="text-blue-600 hover:underline">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy-policy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-gray-900"><Loader2 className="h-12 w-12 animate-spin text-blue-600" /></div>}>
      <AuthForm />
    </Suspense>
  )
}
