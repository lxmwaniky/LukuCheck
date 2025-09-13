
'use client';
import { useState, useEffect, type ChangeEvent, useRef } from 'react';
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
  AlertDialogDescription,
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
  REFERRAL_ROCKSTAR: { id: "REFERRAL_ROCKSTAR", name: "Referral Rockstar", description: "Successfully referred 3 new stylists!", icon: Gift, colorClass: "text-emerald-500" },
  STREAK_STARTER_3: { id: "STREAK_STARTER_3", name: "Streak Starter", description: "Submitted outfits for 3 consecutive days.", icon: Flame, colorClass: "text-orange-500" },
  STREAK_KEEPER_7: { id: "STREAK_KEEPER_7", name: "Streak Keeper (7 Days)", description: "Submitted outfits for 7 consecutive days.", icon: Flame, colorClass: "text-red-500" },
  TOP_3_FINISHER: { id: "TOP_3_FINISHER", name: "Top 3 Finisher", description: "Achieved a Top 3 rank on the daily leaderboard!", icon: Trophy, colorClass: "text-yellow-500" },
  PERFECT_SCORE: { id: "PERFECT_SCORE", name: "Perfect Score!", description: "Achieved a 10/10 AI rating on an outfit.", icon: StarIconProp, colorClass: "text-yellow-400" },
  CENTURY_CLUB: { id: "CENTURY_CLUB", name: "Century Club", description: "Earned 100 LukuPoints!", icon: Users, colorClass: "text-teal-500" },
  LEGEND_STATUS: { id: "LEGEND_STATUS", name: "Legend Status", description: "Reached 250 LukuPoints - truly legendary!", icon: LegendIcon, colorClass: "text-blue-500" },
};

const POINTS_PER_REFERRAL = 2;
const REFERRALS_FOR_ROCKSTAR_BADGE = 3;
const POINTS_REFERRAL_ROCKSTAR = 10;

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

  useEffect(() => {
    if (userProfile) {
      setCurrentUsername(userProfile.username || '');
      setPhotoPreview(userProfile.customPhotoURL || userProfile.photoURL || null);
      setTiktokUrl(userProfile.tiktokUrl || '');
      setInstagramUrl(userProfile.instagramUrl || '');
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
    if (currentUsername.length < 3) {
        toast({ title: 'Error', description: 'Username (display name) must be at least 3 characters.', variant: 'destructive' });
        return;
    }
    setIsSubmitting(true);

    try {
      const result = await updateUserProfileInFirestore({
        userId: user.uid,
        username: currentUsername !== (userProfile?.username || user.displayName) ? currentUsername : undefined,
        photoDataUrl: newPhotoDataUrlForUpload ? newPhotoDataUrlForUpload : undefined,
        currentPhotoUrl: userProfile?.customPhotoURL || userProfile?.photoURL,
        tiktokUrl: tiktokUrl,
        instagramUrl: instagramUrl,
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
    if (currentUsername.length < 3) {
        toast({ title: 'Error', description: 'Username (display name) must be at least 3 characters.', variant: 'destructive' });
        return;
    }
    setIsSubmitting(true);

    try {
      const result = await updateUserProfileInFirestore({
        userId: user.uid,
        username: currentUsername,
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
    if (auth.currentUser?.providerData.some(provider => provider.providerId === 'password')) {
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
        if (auth.currentUser?.providerData.some(provider => provider.providerId === 'password')) {
            if (!reauthPassword) {
                toast({ title: 'Password Required', description: 'Please enter your password to confirm deletion.', variant: 'destructive' });
                setIsReauthenticating(false);
                return;
            }
            const credential = EmailAuthProvider.credential(user.email, reauthPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            toast({ title: 'Re-authentication Successful', description: 'Proceeding with account deletion...' });
        } else {
             toast({ title: 'Confirmation Received', description: 'Proceeding with account deletion...' });
        }

        const dataDeletionResult = await deleteUserData(user.uid);
        if (!dataDeletionResult.success) {
          throw new Error(dataDeletionResult.error || 'Server action failed to delete account data.');
        }

        toast({ title: 'Account Deleted', description: 'Your account and all associated data have been permanently deleted.' });

        await signOut(auth);
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

  // Check if this is a new user who needs to complete profile setup
  // Only show setup if user has never set a username AND doesn't have a display name
  const needsProfileSetup = !userProfile.username && !user.displayName;
  
  if (needsProfileSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container max-w-2xl mx-auto p-4 py-8">
          <Card className="shadow-lg border-primary/20 bg-white/80 backdrop-blur dark:bg-gray-800/80">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700">
              <UserIcon className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold">Welcome to LukuCheck!</CardTitle>
            <CardDescription className="text-lg">
              Let's set up your profile to get started
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="setup-username" className="text-base font-medium">Choose your username</Label>
              <p className="text-sm text-muted-foreground mb-2">This will be displayed on the leaderboard</p>
              <Input
                id="setup-username"
                type="text"
                value={currentUsername}
                onChange={(e) => setCurrentUsername(e.target.value)}
                placeholder="Enter a unique username (min. 3 characters)"
                className="text-lg h-12"
              />
            </div>
            
            <div className="text-center">
              <Button 
                onClick={handleProfileUpdate}
                disabled={isSubmitting || currentUsername.trim().length < 3}
                size="lg"
                className="px-8 h-12 text-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Complete Setup
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  const avatarDisplayName = currentUsername || userProfile?.email?.split('@')[0] || 'L';
  const isPasswordProvider = auth.currentUser?.providerData.some(provider => provider.providerId === 'password');

  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/auth?ref=${user.uid}` : '';

  const handleCopyReferralLink = () => {
    if (referralLink && navigator.clipboard) {
      navigator.clipboard.writeText(referralLink)
        .then(() => {
          toast({ title: "Link Copied!", description: "Referral link copied to clipboard." });
        })
        .catch(err => {
          toast({ title: "Copy Failed", description: "Could not copy link. Please try manually.", variant: "destructive" });
        });
    } else {
        toast({ title: "Copy Failed", description: "Clipboard API not available. Please copy manually.", variant: "destructive" });
    }
  };

  const userBadges = userProfile?.badges?.map(badgeId => BADGE_DEFINITIONS[badgeId]).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl mx-auto py-6 sm:py-8 px-2 sm:px-0">
        <Card className="shadow-xl rounded-xl bg-white/80 backdrop-blur dark:bg-gray-800/80">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-2xl sm:text-3xl flex items-center text-primary">
              <UserIcon className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:h-8" />
              Edit Your Profile
            </CardTitle>
            <CardDescription>Keep your LukuCheck profile up-to-date and shine!</CardDescription>
          </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 sm:space-y-6 pt-6">
            <div className="flex flex-col items-center space-y-3 sm:space-y-4">
              <Avatar className="w-28 h-28 sm:w-32 sm:h-32 border-4 border-primary/50 shadow-lg ring-2 ring-primary/20">
                <AvatarImage src={photoPreview || undefined} alt={currentUsername} className="object-cover" />
                <AvatarFallback className="text-3xl sm:text-4xl bg-muted text-muted-foreground">
                  {avatarDisplayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" size="sm" className="relative shadow-sm hover:shadow-md transition-shadow">
                <Camera className="mr-2 h-4 w-4" />
                Change Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="photoUpload"
                  aria-label="Upload profile photo"
                />
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username" className="flex items-center text-md sm:text-lg mb-1">
                <UserIcon className="mr-2 h-4 w-4 sm:h-5 sm:h-5 text-muted-foreground" />
                Display Name
              </Label>
              <Input
                id="username"
                type="text"
                value={currentUsername}
                onChange={(e) => setCurrentUsername(e.target.value)}
                className="text-sm sm:text-base"
                placeholder="Your awesome display name"
                minLength={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tiktokUrl" className="flex items-center text-md sm:text-lg mb-1">
                <LinkIconProp className="mr-2 h-4 w-4 sm:h-5 sm:h-5 text-muted-foreground" />
                TikTok URL (Optional)
              </Label>
              <Input
                id="tiktokUrl"
                type="url"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                className="text-sm sm:text-base"
                placeholder="https://tiktok.com/@yourusername"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="instagramUrl" className="flex items-center text-md sm:text-lg mb-1">
                <Instagram className="mr-2 h-4 w-4 sm:h-5 sm:h-5 text-muted-foreground" />
                Instagram URL (Optional)
              </Label>
              <Input
                id="instagramUrl"
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                className="text-sm sm:text-base"
                placeholder="https://instagram.com/yourusername"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="flex items-center text-md sm:text-lg mb-1">
                <Mail className="mr-2 h-4 w-4 sm:h-5 sm:h-5 text-muted-foreground" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={userProfile?.email || ''}
                disabled
                className="text-sm sm:text-base bg-muted/60 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full text-base sm:text-lg py-3 rounded-lg shadow-md hover:shadow-lg transition-shadow" disabled={isSubmitting || isDeleting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:h-5 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4 sm:h-5 sm:h-5" />
              )}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="shadow-lg rounded-xl">
            <CardHeader>
                <CardTitle className="text-xl flex items-center"><Coins className="mr-2 h-6 w-6 text-yellow-500"/>Your LukuPoints</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold text-primary">{userProfile?.lukuPoints ?? 0}</p>
            </CardContent>
        </Card>
        <Card className="shadow-lg rounded-xl">
            <CardHeader>
                <CardTitle className="text-xl flex items-center"><Flame className="mr-2 h-6 w-6 text-destructive"/>Your LukuStreak</CardTitle>
            </CardHeader>
            <CardContent>
                 <p className="text-4xl font-bold text-primary">
                    {userProfile.currentStreak ?? 0} Day{userProfile.currentStreak === 1 ? '' : 's'}
                </p>
                {userProfile.lastSubmissionDate && <p className="text-xs text-muted-foreground mt-1">Last submission: {new Date(userProfile.lastSubmissionDate).toLocaleDateString()}</p>}
            </CardContent>
        </Card>
      </div>


      {userBadges.length > 0 && (
        <Card className="mt-8 shadow-lg rounded-xl">
            <CardHeader>
                <CardTitle className="text-xl flex items-center"><BadgeCheck className="mr-2 h-6 w-6 text-primary"/>Your Badges</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                    <TooltipProvider>
                    {userBadges.map(badge => (
                        <Tooltip key={badge.id}>
                            <TooltipTrigger asChild>
                                <div className="flex flex-col items-center p-2 rounded-md hover:bg-accent/10 w-24 text-center cursor-default">
                                    <badge.icon className={`h-8 w-8 sm:h-10 sm:w-10 ${badge.colorClass || 'text-accent'}`} />
                                    <span className="text-xs mt-1.5 font-medium truncate">{badge.name}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                <p className="font-semibold">{badge.name}</p>
                                <p className="text-xs text-muted-foreground">{badge.description}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                    </TooltipProvider>
                </div>
            </CardContent>
        </Card>
      )}

      <Card className="mt-8 shadow-lg rounded-xl">
        <CardHeader>
            <CardTitle className="text-xl flex items-center"><ListChecks className="mr-2 h-6 w-6 text-primary"/>Your LukuCheck Stats</CardTitle>
        </CardHeader>
        <CardContent>
            {statsLoading ? (
                <div className="flex items-center space-x-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading stats...</span>
                </div>
            ) : profileStats ? (
                <div className="space-y-3 text-sm sm:text-base">
                    <div className="flex items-center">
                        <ListChecks className="mr-2 h-5 w-5 text-primary" />
                        <span>Total Submissions: <strong>{profileStats.totalSubmissions}</strong></span>
                    </div>
                    <div className="flex items-center">
                        <StarIconProp className="mr-2 h-5 w-5 text-accent fill-accent" />
                        <span>Average Rating: <strong>{profileStats.averageRating !== null ? profileStats.averageRating.toFixed(1) : 'N/A'}</strong></span>
                    </div>
                    <div className="flex items-center">
                        <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                        <span>Highest Rating: <strong>{profileStats.highestRating !== null ? profileStats.highestRating.toFixed(1) : 'N/A'}</strong></span>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">No stats available yet. Start submitting outfits!</p>
            )}
        </CardContent>
      </Card>

      <Card className="mt-8 shadow-lg rounded-xl">
        <CardHeader>
            <CardTitle className="text-xl flex items-center"><Gift className="mr-2 h-6 w-6 text-primary"/>Refer & Earn!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Share your unique referral link. For every friend who signs up & verifies, you get <strong className="text-accent">{POINTS_PER_REFERRAL} LukuPoints!</strong> Refer {REFERRALS_FOR_ROCKSTAR_BADGE} friends for the "Referral Rockstar" badge & a <strong className="text-accent">{POINTS_REFERRAL_ROCKSTAR} LukuPoint</strong> bonus! (They get 5 LukuPoints on signup!)
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 border rounded-lg bg-muted/30">
              <Input
                id="referralLink"
                type="text"
                value={referralLink}
                readOnly
                className="text-sm bg-background flex-grow"
                aria-label="Your referral link"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyReferralLink}
                className="w-full sm:w-auto shadow-sm hover:shadow-md"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            </div>
        </CardContent>
      </Card>

      <Card className="mt-8 shadow-xl rounded-xl border-destructive/50">
        <CardHeader className="border-b border-destructive/30 pb-4">
            <CardTitle className="text-xl flex items-center text-destructive"><ShieldAlert className="mr-2 h-6 w-6"/>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">
                Deleting your account is permanent and cannot be undone. All your data, including profile information, outfit submissions, LukuPoints, and AI usage history, will be removed.
                {isPasswordProvider ? " This action requires you to re-enter your password." : " Please confirm you wish to proceed."}
            </p>
             <AlertDialog open={showReauthDialog} onOpenChange={(open) => {
                setShowReauthDialog(open);
                if (!open) {
                    setIsDeleting(false);
                    setReauthPassword('');
                }
             }}>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full sm:w-auto" disabled={isSubmitting || (isDeleting && isReauthenticating)} onClick={handleDeleteAccountRequest}>
                        {(isDeleting && isReauthenticating) || (isDeleting && !isReauthenticating && showReauthDialog) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Delete My Account
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-lg">
                    <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center">
                        <ShieldAlert className="mr-2 h-5 w-5 text-destructive"/>
                        {isPasswordProvider ? "Re-authentication Required" : "Confirm Account Deletion"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {isPasswordProvider
                           ? "For your security, please re-enter your password to confirm account deletion. This action cannot be undone."
                           : "Are you sure you want to permanently delete your account and all associated data? This action cannot be undone."
                        }
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    {isPasswordProvider && (
                        <div className="space-y-2 py-2">
                            <Label htmlFor="reauth-password">Password</Label>
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
                    <AlertDialogFooter>
                    <AlertDialogCancel disabled={isReauthenticating} onClick={() => { setIsDeleting(false); setReauthPassword(''); }}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={proceedWithDeletion}
                        disabled={isReauthenticating || (isPasswordProvider && !reauthPassword)}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                        {isReauthenticating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Confirm Deletion
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardContent>
      </Card>

      <Dialog open={showCropDialog} onOpenChange={(isOpen) => {
          setShowCropDialog(isOpen);
          if (!isOpen) {
            setImageSrcToCrop(null);
          }
      }}>
        <DialogContent className="sm:max-w-md p-0 flex flex-col max-h-[85vh] rounded-lg">
          <DialogHeader className="p-4 border-b shrink-0">
            <DialogTitle className="flex items-center"><CropIcon className="mr-2 h-5 w-5"/>Crop Your Photo</DialogTitle>
          </DialogHeader>
          <div className="p-4 flex flex-col items-center flex-grow overflow-y-auto">
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
                  className="max-w-full max-h-full object-contain"
                />
              </ReactCrop>
            )}
            <canvas ref={previewCanvasRef} className="hidden" />
          </div>
          <DialogFooter className="p-4 border-t gap-2 shrink-0">
            <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => setImageSrcToCrop(null)}>
                    <XIcon className="mr-2 h-4 w-4" /> Cancel
                </Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveCrop} disabled={!completedCrop}>
              <Save className="mr-2 h-4 w-4" /> Save Crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

