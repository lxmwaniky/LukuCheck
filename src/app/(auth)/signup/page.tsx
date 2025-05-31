
'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { auth, createUserWithEmailAndPassword, sendEmailVerification, updateProfile as updateFirebaseAuthProfile } from '@/config/firebase';
import { createUserProfileInFirestore, checkUsernameAvailability } from '@/actions/userActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, User as UserIconProp, Lock, Loader2, Eye, EyeOff, CheckCircle, XCircle, RefreshCw, ArrowLeft, Shirt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';

function SignupForm() {
  const { user, loading, refreshUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'error'>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const debouncedUsername = useDebounce(username, 500);

  const referrerUid = searchParams.get('ref');

  useEffect(() => {
    if (!loading && user) {
      // AuthContext and AppLayout handle redirect to /verify-email-notice or /upload
    }
  }, [user, loading, router]);

  useEffect(() => {
    const verifyDisplayName = async () => {
      if (!debouncedUsername || debouncedUsername.length < 3) {
        setUsernameStatus('idle');
        setUsernameError(null);
        if (debouncedUsername && debouncedUsername.length > 0 && debouncedUsername.length < 3) {
            setUsernameError("Username (display name) must be at least 3 characters.");
        }
        return;
      }
      setUsernameStatus('checking');
      setUsernameError(null);
      try {
        const result = await checkUsernameAvailability(debouncedUsername);
        if (result.available) {
          setUsernameStatus('available');
        } else {
          setUsernameStatus('error');
          setUsernameError(result.message || "This username might not be suitable.");
        }
      } catch (error) {
        setUsernameStatus('error');
        setUsernameError("Could not check username. Try again.");
        console.error("Error checking username availability:", error);
      }
    };
    if (debouncedUsername) verifyDisplayName();
    else setUsernameStatus('idle');
  }, [debouncedUsername]);


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      toast({ title: "Agreement Required", description: "Please accept the Terms of Service and Privacy Policy to continue.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
        toast({ title: "Error", description: "Password should be at least 6 characters.", variant: "destructive" });
        return;
    }
     if (username.length < 3) {
        toast({ title: "Error", description: "Username (display name) must be at least 3 characters.", variant: "destructive" });
        return;
    }
    if (usernameStatus === 'checking'){
        toast({ title: "Please wait", description: "Still checking username availability.", variant: "default" });
        return;
    }
    if (usernameStatus === 'error' && username.length >=3) {
        toast({ title: "Username Issue", description: usernameError || "Please choose a different username.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        await updateFirebaseAuthProfile(firebaseUser, { displayName: username });

        const profileResult = await createUserProfileInFirestore(
          firebaseUser.uid,
          email,
          username,
          referrerUid
        );

        if (!profileResult.success) {
          console.error("Signup Error: Firestore profile creation failed:", profileResult.error);
          toast({
            title: "Profile Creation Issue",
            description: profileResult.error || "Could not save all profile details. Please try updating your profile later or contact support.",
            variant: "destructive",
          });
        }
        
        const actionCodeSettings = {
          url: `${window.location.origin}/upload`, 
          handleCodeInApp: true,
        };
        await sendEmailVerification(firebaseUser, actionCodeSettings);
        toast({
          title: 'Account Created!',
          description: 'Please check your email to verify your account.'
        });
        
        await refreshUserProfile(); 
        router.push('/verify-email-notice');

      } else {
        throw new Error("Failed to create Firebase Auth user.");
      }
    } catch (error: any) {
      console.error('Signup Error:', error);
      let errorMessage = error.message || "An unexpected error occurred during sign-up.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already in use. If it\'s yours, please try logging in or use a different email.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password (at least 6 characters).';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'The email address format is invalid. Please check and try again.';
      } else if (error.code === 'auth/operation-not-allowed' || 
                 (error.message && (error.message.includes('Domain not found') || error.message.includes('allowlisted') || error.message.includes('authorized domain')))) {
        errorMessage = 'Account created, but failed to send verification email. Your app\'s domain (' + window.location.origin + ') might not be allowlisted in Firebase console (Authentication -> Settings -> Authorized domains). Please check this setting.';
      }
      toast({
        title: "Sign-up Issue",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  if (loading || (!loading && user && user.emailVerified)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading or redirecting...</p>
      </div>
    );
  }

  const getUsernameInputState = () => {
    if (usernameError && username.length >=3 ) return "border-destructive";
    if (usernameStatus === 'available' && username.length >=3) return "border-green-500";
    return "";
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <Link href="/" passHref aria-label="Back to Home">
          <Shirt className="mx-auto h-12 w-12 text-primary mb-4 cursor-pointer hover:opacity-80 transition-opacity" />
        </Link>
        <CardTitle className="text-3xl font-bold text-primary">Create Your LukuCheck Account</CardTitle>
        <CardDescription className="text-md">
          Join the community and start rating!
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSignup}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email" className="flex items-center mb-1.5"><Mail className="mr-2 h-4 w-4 text-muted-foreground"/>Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>
           <div>
            <Label htmlFor="username" className="flex items-center mb-1.5"><UserIconProp className="mr-2 h-4 w-4 text-muted-foreground"/>Username (for display)</Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_cool_name (min. 3 chars)"
                required
                minLength={3}
                disabled={isSubmitting}
                autoComplete="username"
                className={getUsernameInputState()}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5">
                  {usernameStatus === 'checking' && <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />}
                  {usernameStatus === 'available' && username.length >=3 && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {usernameStatus === 'error' && username.length >=3 && <XCircle className="h-5 w-5 text-destructive" />}
              </div>
            </div>
             {usernameError && username.length >=3 && <p className="text-xs text-destructive mt-1">{usernameError}</p>}
             {(!usernameError && username.length > 0 && username.length < 3) && <p className="text-xs text-destructive mt-1">Username (display name) must be at least 3 characters.</p>}
             {usernameStatus === 'available' && username.length >=3 && <p className="text-xs text-green-600 dark:text-green-400 mt-1">Username looks good!</p>}
          </div>
          <div>
            <Label htmlFor="password" className="flex items-center mb-1.5"><Lock className="mr-2 h-4 w-4 text-muted-foreground"/>Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (min. 6 characters)"
                required
                minLength={6}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
               <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="flex items-center mb-1.5"><Lock className="mr-2 h-4 w-4 text-muted-foreground"/>Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={toggleConfirmPasswordVisibility}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                disabled={isSubmitting}
                aria-labelledby="terms-label"
            />
            <Label htmlFor="terms" id="terms-label" className="text-sm font-normal text-muted-foreground">
                I agree to the LukuCheck <Link href="/terms-of-service" legacyBehavior><a target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Terms of Service</a></Link> and <Link href="/privacy-policy" legacyBehavior><a target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Privacy Policy</a></Link>.
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-2">
          <Button
            type="submit"
            className="w-full text-lg py-3"
            disabled={isSubmitting || usernameStatus === 'checking' || (usernameError !== null && username.length >=3 && usernameStatus === 'error') || (username.length > 0 && username.length < 3) || !agreedToTerms }
          >
            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserIconProp className="mr-2 h-5 w-5" />}
            Sign Up
          </Button>
          <div className="text-sm text-center w-full flex justify-between">
            <span>Already have an account? </span>
            <Link href="/login" legacyBehavior passHref>
              <a className="text-primary hover:underline">Login here</a>
            </Link>
          </div>
           <Link href="/" legacyBehavior passHref>
                <Button variant="link" className="w-full text-muted-foreground hover:text-primary mt-2">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Button>
            </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen flex-col items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
        <SignupForm />
      </div>
    </Suspense>
  )
}
