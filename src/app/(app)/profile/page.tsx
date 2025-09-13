
'use client';
import { useState, useEffect, type ChangeEvent, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { updateUserProfileInFirestore, deleteUserData, getUserProfileStats, type UserProfileStats } from '@/actions/userActions';
import { useToast } from '@/hooks/use-toast';
import { Camera, User as UserIcon, Mail, Save, Loader2, Trash2, ShieldAlert, Link as LinkIconProp, Instagram, ListChecks, Star as StarIconProp, Trophy, Gift, Copy, CropIcon, XIcon, BadgeCheck, Users, ShieldCheck as LegendIcon, Award, Flame, Coins } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { signOut, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Helper function to generate a centered crop
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

// Helper function to draw canvas preview
async function canvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop
) {
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();
  ctx.translate(-cropX, -cropY);
  ctx.translate(centerX, centerY);
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight
  );
  ctx.restore();
}

interface BadgeDetails {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  colorClass?: string;
}

const BADGE_DEFINITIONS: Record<string, BadgeDetails> = {
  PROFILE_PRO: { id: "PROFILE_PRO", name: "Profile Pro", description: "Completed profile with custom photo and social links.", icon: UserIcon, colorClass: "text-blue-500" },
  FIRST_SUBMISSION: { id: "FIRST_SUBMISSION", name: "First Submission", description: "Submitted first outfit to the leaderboard.", icon: Award, colorClass: "text-green-500" },
  STREAK_STARTER_3: { id: "STREAK_STARTER_3", name: "Streak Starter", description: "Submitted outfits for 3 consecutive days.", icon: Flame, colorClass: "text-orange-500" },
  STREAK_KEEPER_7: { id: "STREAK_KEEPER_7", name: "Streak Keeper (7 Days)", description: "Submitted outfits for 7 consecutive days.", icon: Flame, colorClass: "text-red-500" },
  TOP_3_FINISHER: { id: "TOP_3_FINISHER", name: "Top 3 Finisher", description: "Achieved a Top 3 rank on the daily leaderboard!", icon: Trophy, colorClass: "text-yellow-500" },
  PERFECT_SCORE: { id: "PERFECT_SCORE", name: "Perfect Score!", description: "Achieved a 10/10 AI rating on an outfit.", icon: StarIconProp, colorClass: "text-yellow-400" },
  CENTURY_CLUB: { id: "CENTURY_CLUB", name: "Century Club", description: "Earned 100 LukuPoints!", icon: Users, colorClass: "text-teal-500" },
  LEGEND_STATUS: { id: "LEGEND_STATUS", name: "Legend Status", description: "Reached 250 LukuPoints - truly legendary!", icon: LegendIcon, colorClass: "text-blue-500" },
};


export default function ProfilePage() {
  const { user, userProfile, loading: authLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [currentUsername, setCurrentUsername] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [imageSrcToCrop, setImageSrcToCrop] = useState<string | null>(null);
  const [newPhotoDataUrlForUpload, setNewPhotoDataUrlForUpload] = useState<string | null>(null);

  const [tiktokUrl, setTiktokUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUsername, setTiktokUsername] = useState('');
  const [instagramUsername, setInstagramUsername] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReauthDialog, setShowReauthDialog] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [isReauthenticating, setIsReauthenticating] = useState(false);

  const [profileStats, setProfileStats] = useState<UserProfileStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [showCropDialog, setShowCropDialog] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const aspect = 1 / 1;

  // Username validation function
  const validateUsername = (username: string): { isValid: boolean; error?: string } => {
    // Remove leading/trailing whitespace
    const trimmedUsername = username.trim();
    
    if (trimmedUsername.length < 3) {
      return { isValid: false, error: 'Username must be at least 3 characters long.' };
    }
    
    if (trimmedUsername.length > 20) {
      return { isValid: false, error: 'Username cannot exceed 20 characters.' };
    }
    
    // Check for valid characters (letters, numbers, underscores, hyphens, spaces)
    const validCharacterRegex = /^[a-zA-Z0-9_\- ]+$/;
    if (!validCharacterRegex.test(trimmedUsername)) {
      return { isValid: false, error: 'Username can only contain letters, numbers, spaces, underscores, and hyphens.' };
    }
    
    // Check for excessive whitespace
    if (trimmedUsername.includes('  ')) {
      return { isValid: false, error: 'Username cannot contain consecutive spaces.' };
    }
    
    // Check if starts or ends with special characters
    if (/^[-_\s]/.test(trimmedUsername) || /[-_\s]$/.test(trimmedUsername)) {
      return { isValid: false, error: 'Username cannot start or end with spaces, underscores, or hyphens.' };
    }
    
    return { isValid: true };
  };

  // Social media username validation and conversion functions
  const validateTikTokUsername = (username: string): { isValid: boolean; error?: string } => {
    const trimmedUsername = username.trim();
    
    if (trimmedUsername === '') {
      return { isValid: true }; // Empty is allowed
    }
    
    // Remove @ symbol if present
    const cleanUsername = trimmedUsername.replace(/^@/, '');
    
    // TikTok username rules: 2-24 characters, letters, numbers, underscores, periods
    if (cleanUsername.length < 2 || cleanUsername.length > 24) {
      return { isValid: false, error: 'TikTok username must be 2-24 characters long.' };
    }
    
    const validTikTokRegex = /^[a-zA-Z0-9_.]+$/;
    if (!validTikTokRegex.test(cleanUsername)) {
      return { isValid: false, error: 'TikTok username can only contain letters, numbers, underscores, and periods.' };
    }
    
    // Cannot start or end with period
    if (cleanUsername.startsWith('.') || cleanUsername.endsWith('.')) {
      return { isValid: false, error: 'TikTok username cannot start or end with a period.' };
    }
    
    return { isValid: true };
  };

  const validateInstagramUsername = (username: string): { isValid: boolean; error?: string } => {
    const trimmedUsername = username.trim();
    
    if (trimmedUsername === '') {
      return { isValid: true }; // Empty is allowed
    }
    
    // Remove @ symbol if present
    const cleanUsername = trimmedUsername.replace(/^@/, '');
    
    // Instagram username rules: 1-30 characters, letters, numbers, underscores, periods
    if (cleanUsername.length < 1 || cleanUsername.length > 30) {
      return { isValid: false, error: 'Instagram username must be 1-30 characters long.' };
    }
    
    const validInstagramRegex = /^[a-zA-Z0-9_.]+$/;
    if (!validInstagramRegex.test(cleanUsername)) {
      return { isValid: false, error: 'Instagram username can only contain letters, numbers, underscores, and periods.' };
    }
    
    // Cannot start or end with period
    if (cleanUsername.startsWith('.') || cleanUsername.endsWith('.')) {
      return { isValid: false, error: 'Instagram username cannot start or end with a period.' };
    }
    
    return { isValid: true };
  };

  const convertToTikTokUrl = (username: string): string => {
    if (!username.trim()) return '';
    const cleanUsername = username.trim().replace(/^@/, '');
    return `https://www.tiktok.com/@${cleanUsername}`;
  };

  const convertToInstagramUrl = (username: string): string => {
    if (!username.trim()) return '';
    const cleanUsername = username.trim().replace(/^@/, '');
    return `https://www.instagram.com/${cleanUsername}`;
  };

  const extractUsernameFromUrl = (url: string, platform: 'tiktok' | 'instagram'): string => {
    if (!url) return '';
    
    // If it's already just a username (no URL), return it
    if (!url.includes('http') && !url.includes('.com')) {
      return url.replace(/^@/, '');
    }
    
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      if (platform === 'tiktok') {
        // TikTok URLs: https://www.tiktok.com/@username
        const match = pathname.match(/\/@([^\/]+)/);
        return match ? match[1] : '';
      } else {
        // Instagram URLs: https://www.instagram.com/username
        const match = pathname.match(/\/([^\/]+)/);
        return match ? match[1] : '';
      }
    } catch {
      return '';
    }
  };

  const hasChanges = useMemo(() => {
    if (!userProfile) return false;
    return currentUsername !== (userProfile.username || '') ||
           tiktokUsername !== extractUsernameFromUrl(userProfile.tiktokUrl || '', 'tiktok') ||
           instagramUsername !== extractUsernameFromUrl(userProfile.instagramUrl || '', 'instagram') ||
           !!newPhotoDataUrlForUpload;
  }, [userProfile, currentUsername, tiktokUsername, instagramUsername, newPhotoDataUrlForUpload]);

  // Handle username input with real-time validation
  const handleUsernameChange = (value: string) => {
    setCurrentUsername(value);
  };

  useEffect(() => {
    if (userProfile) {
      setCurrentUsername(userProfile.username || '');
      setPhotoPreview(userProfile.customPhotoURL || userProfile.photoURL || null);
      setTiktokUrl(userProfile.tiktokUrl || '');
      setInstagramUrl(userProfile.instagramUrl || '');
      // Extract usernames from existing URLs
      setTiktokUsername(extractUsernameFromUrl(userProfile.tiktokUrl || '', 'tiktok'));
      setInstagramUsername(extractUsernameFromUrl(userProfile.instagramUrl || '', 'instagram'));
    }
    if (user?.uid && !profileStats && !statsLoading) {
        setStatsLoading(true);
        getUserProfileStats(user.uid)
            .then(result => {
                if (result.success && result.data) {
                    setProfileStats(result.data);
                }
            })
            .finally(() => setStatsLoading(false));
    }
  }, [userProfile, user, profileStats, statsLoading]);

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewPhotoDataUrlForUpload(null);
      setCompletedCrop(undefined);
      setCrop(undefined);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrcToCrop(reader.result as string);
        setShowCropDialog(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

  const handleSaveCrop = async () => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      toast({ title: "Error", description: "Cropping data is not complete.", variant: "destructive"});
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    await canvasPreview(image, canvas, completedCrop);

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPhotoPreview(croppedDataUrl);
    setNewPhotoDataUrlForUpload(croppedDataUrl);
    setShowCropDialog(false);
    setImageSrcToCrop(null);
    toast({ title: "Crop Saved", description: "New profile photo is ready to be uploaded."});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to update your profile.', variant: 'destructive' });
      return;
    }
    
    const usernameValidation = validateUsername(currentUsername);
    if (!usernameValidation.isValid) {
      toast({ title: 'Invalid Username', description: usernameValidation.error, variant: 'destructive' });
      return;
    }

    // Validate social media usernames
    const tiktokValidation = validateTikTokUsername(tiktokUsername);
    if (!tiktokValidation.isValid) {
      toast({ title: 'Invalid TikTok Username', description: tiktokValidation.error, variant: 'destructive' });
      return;
    }

    const instagramValidation = validateInstagramUsername(instagramUsername);
    if (!instagramValidation.isValid) {
      toast({ title: 'Invalid Instagram Username', description: instagramValidation.error, variant: 'destructive' });
      return;
    }

    // Convert usernames to URLs
    const finalTikTokUrl = convertToTikTokUrl(tiktokUsername);
    const finalInstagramUrl = convertToInstagramUrl(instagramUsername);
    
    setIsSubmitting(true);

    try {
      const result = await updateUserProfileInFirestore({
        userId: user.uid,
        username: currentUsername.trim() !== (userProfile?.username || user.displayName) ? currentUsername.trim() : undefined,
        photoDataUrl: newPhotoDataUrlForUpload ? newPhotoDataUrlForUpload : undefined,
        currentPhotoUrl: userProfile?.customPhotoURL || userProfile?.photoURL,
        tiktokUrl: finalTikTokUrl,
        instagramUrl: finalInstagramUrl,
      });

      if (result.success) {
        toast({ title: 'Success', description: result.message || 'Profile updated successfully!' });
        setNewPhotoDataUrlForUpload(null);
        await refreshUserProfile();
      } else {
        toast({ title: 'Error updating profile', description: result.error || 'An unknown error occurred.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error updating profile', description: error.message || "An unexpected error occurred.", variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to update your profile.', variant: 'destructive' });
      return;
    }
    
    const usernameValidation = validateUsername(currentUsername);
    if (!usernameValidation.isValid) {
      toast({ title: 'Invalid Username', description: usernameValidation.error, variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const result = await updateUserProfileInFirestore({
        userId: user.uid,
        username: currentUsername.trim(),
        photoDataUrl: newPhotoDataUrlForUpload ? newPhotoDataUrlForUpload : undefined,
        currentPhotoUrl: userProfile?.customPhotoURL || userProfile?.photoURL,
        tiktokUrl: tiktokUrl,
        instagramUrl: instagramUrl,
      });

      if (result.success) {
        toast({ title: 'Welcome to LukuCheck!', description: 'Your profile has been set up successfully!' });
        setNewPhotoDataUrlForUpload(null);
        await refreshUserProfile();
        // Profile will automatically refresh and show the main profile view
      } else {
        toast({ title: 'Error setting up profile', description: result.error || 'An unknown error occurred.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error setting up profile', description: error.message || "An unexpected error occurred.", variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccountRequest = () => {
    if (!user || !user.email) {
       toast({ title: 'Error', description: 'User session is invalid or email is missing. Please re-login.', variant: 'destructive' });
       return;
    }
    if (auth?.currentUser?.providerData.some(provider => provider.providerId === 'password')) {
       setShowReauthDialog(true);
    } else {
       setShowReauthDialog(true);
    }
    setIsDeleting(true);
  };

  const proceedWithDeletion = async () => {
    if (!user || !user.email) {
      toast({ title: 'Error', description: 'User not found or email missing.', variant: 'destructive' });
      setIsDeleting(false);
      setShowReauthDialog(false);
      return;
    }

    setIsReauthenticating(true);
    let errorOccurred = false;
    let caughtError: any = null;

    try {
        if (auth?.currentUser?.providerData.some(provider => provider.providerId === 'password')) {
            if (!reauthPassword) {
                toast({ title: 'Password Required', description: 'Please enter your password to confirm deletion.', variant: 'destructive' });
                setIsReauthenticating(false);
                return;
            }
            const credential = EmailAuthProvider.credential(user.email, reauthPassword);
            await reauthenticateWithCredential(auth.currentUser!, credential);
            toast({ title: 'Re-authentication Successful', description: 'Proceeding with account deletion...' });
        } else {
             toast({ title: 'Confirmation Received', description: 'Proceeding with account deletion...' });
        }

        const dataDeletionResult = await deleteUserData(user.uid);
        if (!dataDeletionResult.success) {
          throw new Error(dataDeletionResult.error || 'Server action failed to delete account data.');
        }

        toast({ title: 'Account Deleted', description: 'Your account and all associated data have been permanently deleted.' });

        if (auth) {
          await signOut(auth);
        }
        router.push('/auth');

    } catch (error: any) {
      errorOccurred = true;
      caughtError = error;
      let desc = error.message;
      if (error.code === 'auth/wrong-password') {
        desc = "Incorrect password for re-authentication. Please try again.";
        setReauthPassword('');
      } else if (error.code === 'auth/too-many-requests') {
        desc = "Too many re-authentication attempts. Please try again later.";
        setShowReauthDialog(false);
      } else if (error.code === 'auth/requires-recent-login') {
        desc = "This operation is sensitive and requires recent authentication. Please log out and log back in, then try again.";
        setShowReauthDialog(false);
      } else {
        desc = `Account deletion failed: ${error.message || "Unknown error"}`;
      }
      toast({ title: 'Error Deleting Account', description: desc, variant: 'destructive' });
    } finally {
      setIsReauthenticating(false);
      if (errorOccurred && !(caughtError?.code === 'auth/wrong-password')) {
         setShowReauthDialog(false);
         setIsDeleting(false);
      } else if (!errorOccurred) {
         setShowReauthDialog(false);
         setIsDeleting(false);
      }
    }
  };

  if (authLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)] p-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2 text-muted-foreground">Loading profile...</span></div>;
  }

  if (!user) {
    return <div className="text-center p-4 text-muted-foreground">Please log in to view your profile. Redirecting...</div>;
  }

  if (!userProfile) {
    return <div className="text-center p-4 text-muted-foreground">Loading user profile details. If this persists, please try again or re-login.</div>;
  }

  const avatarDisplayName = currentUsername || userProfile?.email?.split('@')[0] || 'L';
  const isPasswordProvider = auth?.currentUser?.providerData.some(provider => provider.providerId === 'password') ?? false;

  const userBadges = userProfile?.badges?.map(badgeId => BADGE_DEFINITIONS[badgeId]).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Your Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account settings and style preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Edit Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                  Profile Information
                </CardTitle>
                <CardDescription>Update your display name and profile photo</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar className="h-20 w-20 border-2 border-gray-200 dark:border-gray-700">
                        <AvatarImage 
                          src={photoPreview || userProfile?.customPhotoURL || userProfile?.photoURL || ''}
                          alt="Profile" 
                        />
                        <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {avatarDisplayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="flex-1">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        className="relative"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Change Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          id="photoUpload"
                        />
                      </Button>
                    </div>
                  </div>

                  {/* Display Name */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">
                      Display Name
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      value={currentUsername}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      className="h-10"
                      placeholder="Your display name (3-20 characters)"
                      minLength={3}
                      maxLength={20}
                    />
                    {currentUsername.trim() && !validateUsername(currentUsername).isValid && (
                      <p className="text-sm text-red-500">
                        {validateUsername(currentUsername).error}
                      </p>
                    )}
                  </div>

                  {/* Social Links - Now inline */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Social Media (Optional)</Label>
                    
                    {/* TikTok */}
                    <div className="space-y-2">
                      <Label htmlFor="tiktokUsername" className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <div className="w-4 h-4 bg-black rounded-sm flex items-center justify-center">
                          <span className="text-white text-xs font-bold">T</span>
                        </div>
                        TikTok Username
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                        <Input
                          id="tiktokUsername"
                          type="text"
                          value={tiktokUsername}
                          onChange={(e) => setTiktokUsername(e.target.value)}
                          className="h-10 pl-6"
                          placeholder="yourusername"
                        />
                      </div>
                      {tiktokUsername.trim() && !validateTikTokUsername(tiktokUsername).isValid && (
                        <p className="text-sm text-red-500">
                          {validateTikTokUsername(tiktokUsername).error}
                        </p>
                      )}
                    </div>

                    {/* Instagram */}
                    <div className="space-y-2">
                      <Label htmlFor="instagramUsername" className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-pink-600" />
                        Instagram Username
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                        <Input
                          id="instagramUsername"
                          type="text"
                          value={instagramUsername}
                          onChange={(e) => setInstagramUsername(e.target.value)}
                          className="h-10 pl-6"
                          placeholder="yourusername"
                        />
                      </div>
                      {instagramUsername.trim() && !validateInstagramUsername(instagramUsername).isValid && (
                        <p className="text-sm text-red-500">
                          {validateInstagramUsername(instagramUsername).error}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                      Email Address
                      <ShieldAlert className="h-4 w-4 text-gray-400" />
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={userProfile?.email || ''}
                      disabled
                      className="h-10 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Email cannot be changed for security reasons
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !hasChanges} 
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Right Column - Stats and Actions */}
          <div className="space-y-6">
            {/* Profile Stats */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Your Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {statsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : profileStats ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {profileStats.totalSubmissions}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Outfits</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {profileStats.averageRating?.toFixed(1) || '--'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {userProfile?.lukuPoints || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">LukuPoints</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {userProfile?.currentStreak || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Streak</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Unable to load stats</p>
                )}
              </CardContent>
            </Card>

            {/* Badges */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userBadges.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {userBadges.map((badge) => {
                      const IconComponent = badge.icon;
                      return (
                        <div
                          key={badge.id}
                          className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <IconComponent className={`h-6 w-6 mx-auto mb-2 ${badge.colorClass}`} />
                          <div className="text-xs font-medium text-gray-900 dark:text-white">
                            {badge.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center text-sm">
                    No badges earned yet. Keep styling to unlock achievements!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/upload">
                    <Camera className="mr-2 h-4 w-4" />
                    Upload New Outfit
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/leaderboard">
                    <Trophy className="mr-2 h-4 w-4" />
                    View Leaderboard
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="shadow-sm border-red-200 dark:border-red-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                  <ShieldAlert className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Permanently delete your LukuCheck account and all associated data.
                  {isPasswordProvider && " This action requires password confirmation for security."}
                </p>

                <AlertDialog open={showReauthDialog} onOpenChange={(open) => {
                  setShowReauthDialog(open);
                  if (!open) {
                    setIsDeleting(false);
                    setReauthPassword('');
                  }
                }}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="w-full" 
                      disabled={isSubmitting || (isDeleting && isReauthenticating)} 
                      onClick={handleDeleteAccountRequest}
                    >
                      {(isDeleting && isReauthenticating) || (isDeleting && !isReauthenticating && showReauthDialog) ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete My Account Forever
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center text-red-600 dark:text-red-400">
                        <ShieldAlert className="mr-2 h-5 w-5"/>
                        Delete Account
                      </AlertDialogTitle>
                      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-4">
                        <p>
                          This action is <strong>permanent and cannot be undone</strong>. All your data will be permanently removed, including:
                        </p>
                        <ul className="text-sm space-y-1 pl-4">
                          <li>• Profile information and photos</li>
                          <li>• All outfit submissions and ratings</li>
                          <li>• LukuPoints and achievement badges</li>
                          <li>• AI usage history and feedback</li>
                        </ul>
                        {isPasswordProvider && (
                          <p className="text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                            Please enter your password to confirm this action.
                          </p>
                        )}
                      </div>
                    </AlertDialogHeader>
                    {isPasswordProvider && (
                      <div className="space-y-3 py-4">
                        <Label htmlFor="reauth-password" className="font-semibold">Password</Label>
                        <Input
                          id="reauth-password"
                          type="password"
                          value={reauthPassword}
                          onChange={(e) => setReauthPassword(e.target.value)}
                          placeholder="Enter your password"
                          disabled={isReauthenticating}
                        />
                      </div>
                    )}
                    <AlertDialogFooter className="gap-3">
                      <AlertDialogCancel 
                        disabled={isReauthenticating} 
                        onClick={() => { setIsDeleting(false); setReauthPassword(''); }}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={proceedWithDeletion}
                        disabled={isReauthenticating || (isPasswordProvider && !reauthPassword)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isReauthenticating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Delete Forever
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Photo Cropping Dialog */}
        <Dialog open={showCropDialog} onOpenChange={(isOpen) => {
          setShowCropDialog(isOpen);
          if (!isOpen) {
            setImageSrcToCrop(null);
          }
        }}>
          <DialogContent className="sm:max-w-2xl p-0 flex flex-col max-h-[90vh]">
            <DialogHeader className="p-6 border-b">
              <DialogTitle className="flex items-center text-xl font-bold">
                <CropIcon className="mr-2 h-5 w-5 text-blue-600"/>
                Crop Your Photo
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 flex flex-col items-center flex-grow overflow-y-auto">
              {imageSrcToCrop && (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspect}
                  minWidth={100}
                  minHeight={100}
                  circularCrop={true}
                  className="flex justify-center items-center w-full h-full"
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imageSrcToCrop}
                    onLoad={onImageLoad}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </ReactCrop>
              )}
              <canvas ref={previewCanvasRef} className="hidden" />
            </div>
            <DialogFooter className="p-6 border-t gap-3">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => setImageSrcToCrop(null)}>
                  <XIcon className="mr-2 h-4 w-4" /> Cancel
                </Button>
              </DialogClose>
              <Button 
                type="button" 
                onClick={handleSaveCrop} 
                disabled={!completedCrop}
              >
                <Save className="mr-2 h-4 w-4" /> Save Crop
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

