
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { auth, sendPasswordResetEmail } from '@/config/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, Send, ArrowLeft, Shirt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Check your inbox for a link to reset your password.',
      });
    } catch (error: any) {
      console.error('Password Reset Error:', error);
      let errorMessage = "Failed to send password reset email. Please try again.";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No user found with this email address.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "The email address is not valid.";
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <Link href="/" passHref aria-label="Back to Home">
            <Shirt className="mx-auto h-12 w-12 text-primary mb-4 cursor-pointer hover:opacity-80 transition-opacity" />
          </Link>
          <CardTitle className="text-3xl font-bold text-primary">Forgot Your Password?</CardTitle>
          <CardDescription className="text-md">
            {emailSent 
              ? "An email has been sent with instructions."
              : "Enter your email address and we'll send you a link to reset your password."
            }
          </CardDescription>
        </CardHeader>
        {!emailSent ? (
          <form onSubmit={handlePasswordReset}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email" className="flex items-center mb-1.5"><Mail className="mr-2 h-4 w-4 text-muted-foreground"/>Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button type="submit" className="w-full text-lg py-3" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                Send Reset Link
              </Button>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="text-center py-4">
            <p className="text-green-600 dark:text-green-400">Please check your email (including spam folder) for the reset link.</p>
          </CardContent>
        )}
        <CardFooter className="pt-0">
            <Link href="/login" legacyBehavior passHref>
                <Button variant="link" className="w-full text-muted-foreground hover:text-primary">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Button>
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
