
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
import { Camera, User as UserIcon, Mail, Save, Loader2, Trash2, ShieldAlert, Link as LinkIconProp, Instagram, ListChecks, Star as StarIcon, Trophy, Gift, Copy, Coins, CropIcon, XIcon, BadgeIcon, Flame } from 'lucide-react';
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
import { signOut, deleteUser as deleteFirebaseAuthUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
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
}

const BADGE_DEFINITIONS: Record<string, BadgeDetails> = {
  PROFILE_PRO: { id: "PROFILE_PRO", name: "Profile Pro", description: "Completed profile with custom photo and social links.", icon: UserIcon },
  FIRST_SUBMISSION: { id: "FIRST_SUBMISSION", name: "First Submission", description: "Submitted first outfit to the leaderboard.", icon: Trophy },
  REFERRAL_ROCKSTAR: { id: "REFERRAL_ROCKSTAR", name: "Referral Rockstar", description: "Successfully referred 3 new stylists!", icon: Gift },
  STREAK_STARTER_3: { id: "STREAK_STARTER_3", name: "Streak Starter (3 Days)", description: "Submitted outfits for 3 consecutive days.", icon: Flame },
  STREAK_KEEPER_7: { id: "STREAK_KEEPER_7", name: "Streak Keeper (7 Days)", description: "Submitted outfits for 7 consecutive days.", icon: Flame },
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReauthDialog, setShowReauthDialog] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [isReauthenticating, setIsReauthenticating] = useState(false);

  const [profileStats, setProfileStats] = useState<UserProfileStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Image Cropper State
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
                } else {
                    console.error("Failed to fetch profile stats:", result.error);
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
        tiktokUrl: tiktokUrl, // Send current value, server will check if it's new
        instagramUrl: instagramUrl, // Send current value
      });

      if (result.success) {
        toast({ title: 'Success', description: result.message || 'Profile updated successfully!' });
        setNewPhotoDataUrlForUpload(null); 
        await refreshUserProfile();
      } else {
        toast({ title: 'Error updating profile', description: result.error || 'An unknown error occurred.', variant: 'destructive' });
      }
    } catch (error: any) {
      console.error("Error submitting profile update:", error);
      toast({ title: 'Error updating profile', description: error.message || "An unexpected error occurred.", variant: 'destructive' });
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
        
        if (auth.currentUser) {
            await deleteFirebaseAuthUser(auth.currentUser);
        }

        toast({ title: 'Account Deleted', description: 'Your account and all associated data have been permanently deleted.' });
        
        await signOut(auth); 
        router.push('/signup');

    } catch (error: any) {
      errorOccurred = true;
      caughtError = error;
      console.error("Account Deletion Error:", error);
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
    return <div className="flex justify-center items-center h-full p-4"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Loading profile...</span></div>;
  }

  if (!userProfile && !authLoading) {
    return <div className="text-center p-4">Loading user profile details. If this persists, please try again or re-login.</div>;
  }
  
  if (!user) {
    // AppLayout should handle redirection. This is a fallback.
    // useEffect(() => { router.replace('/login'); }, [router]); 
    return <div className="text-center p-4">Please log in to view your profile. Redirecting...</div>;
  }


  const avatarDisplayName = currentUsername || userProfile?.email?.split('@')[0] || 'L';
  const isPasswordProvider = auth.currentUser?.providerData.some(provider => provider.providerId === 'password');

  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${user.uid}` : '';

  const handleCopyReferralLink = () => {
    if (referralLink && navigator.clipboard) {
      navigator.clipboard.writeText(referralLink)
        .then(() => {
          toast({ title: "Link Copied!", description: "Referral link copied to clipboard." });
        })
        .catch(err => {
          console.error('Failed to copy referral link: ', err);
          toast({ title: "Copy Failed", description: "Could not copy link. Please try manually.", variant: "destructive" });
        });
    } else {
        toast({ title: "Copy Failed", description: "Clipboard API not available. Please copy manually.", variant: "destructive" });
    }
  };

  const userBadges = userProfile?.badges?.map(badgeId => BADGE_DEFINITIONS[badgeId]).filter(Boolean) || [];

  return (
    <div className="max-w-2xl mx-auto p-2 sm:p-0">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl flex items-center">
            <UserIcon className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            Edit Your Profile
          </CardTitle>
          <CardDescription>Keep your LukuCheck profile up-to-date.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="flex flex-col items-center space-y-3 sm:space-y-4">
              <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-primary shadow-md">
                <AvatarImage src={photoPreview || undefined} alt={currentUsername} className="object-cover" />
                <AvatarFallback className="text-3xl sm:text-4xl">
                  {avatarDisplayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" size="sm" className="relative">
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

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="username" className="flex items-center text-base sm:text-lg mb-1.5">
                <UserIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
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

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="tiktokUrl" className="flex items-center text-base sm:text-lg mb-1.5">
                <LinkIconProp className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
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

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="instagramUrl" className="flex items-center text-base sm:text-lg mb-1.5">
                <Instagram className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
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


            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="email" className="flex items-center text-base sm:text-lg mb-1.5">
                <Mail className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={userProfile?.email || ''}
                disabled
                className="text-sm sm:text-base bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full text-base sm:text-lg py-2.5 sm:py-3" disabled={isSubmitting || isDeleting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              )}
              Save Changes
            </Button>
          </CardFooter>
        </form>

        <Separator className="my-4 sm:my-6" />

        <CardContent className="space-y-4">
            <div>
                <h3 className="text-xl font-semibold mb-3">Your Social Links</h3>
                <div className="flex items-center space-x-3">
                    {userProfile?.tiktokUrl ? (
                        <Link href={userProfile.tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label="TikTok Profile">
                            <Button variant="outline" size="icon" className="rounded-full h-10 w-10 sm:h-12 sm:w-12">
                                <LinkIconProp className="h-5 w-5 sm:h-6 sm:w-6" />
                            </Button>
                        </Link>
                    ) : null}

                    {userProfile?.instagramUrl ? (
                         <Link href={userProfile.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram Profile">
                            <Button variant="outline" size="icon" className="rounded-full h-10 w-10 sm:h-12 sm:w-12">
                                <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
                            </Button>
                        </Link>
                    ) : null}
                </div>
                 {(!userProfile?.tiktokUrl && !userProfile?.instagramUrl) && (
                    <p className="text-sm text-muted-foreground mt-2">You haven't added any social media links yet. Edit your profile to add them!</p>
                )}
            </div>
        </CardContent>

        <Separator className="my-4 sm:my-6" />

        <CardContent className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <Coins className="mr-2 h-6 w-6 text-yellow-500" />
                  LukuPoints
                </h3>
                <p className="text-3xl font-bold text-primary">
                  {userProfile?.lukuPoints ?? 0}
                </p>
              </div>
              
            {userProfile?.currentStreak !== undefined && userProfile.currentStreak > 0 && (
                <div>
                    <h3 className="text-xl font-semibold mb-2 flex items-center">
                        <Flame className="mr-2 h-6 w-6 text-destructive" />
                        LukuStreak
                    </h3>
                    <p className="text-2xl font-bold text-primary">
                        {userProfile.currentStreak} Day{userProfile.currentStreak > 1 ? 's' : ''}!
                    </p>
                    {userProfile.lastSubmissionDate && <p className="text-xs text-muted-foreground">Last submission: {userProfile.lastSubmissionDate}</p>}
                </div>
            )}

            {userBadges.length > 0 && (
                 <div>
                    <h3 className="text-xl font-semibold mb-3 flex items-center">
                        <BadgeIcon className="mr-2 h-6 w-6 text-primary" />
                        Your Badges
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        <TooltipProvider>
                        {userBadges.map(badge => (
                            <Tooltip key={badge.id}>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-2 border-accent hover:bg-accent/10">
                                        <badge.icon className="h-6 w-6 text-accent" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-semibold">{badge.name}</p>
                                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                        </TooltipProvider>
                    </div>
                </div>
            )}

            <div>
                <h3 className="text-xl font-semibold mb-3">Your LukuCheck Stats</h3>
                {statsLoading ? (
                    <div className="flex items-center space-x-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading stats...</span>
                    </div>
                ) : profileStats ? (
                    <div className="space-y-2 text-sm sm:text-base">
                        <div className="flex items-center">
                            <ListChecks className="mr-2 h-5 w-5 text-primary" />
                            <span>Total Submissions: <strong>{profileStats.totalSubmissions}</strong></span>
                        </div>
                        <div className="flex items-center">
                            <StarIcon className="mr-2 h-5 w-5 text-accent fill-accent" />
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
            </div>
        </CardContent>

        <Separator className="my-4 sm:my-6" />

        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h3 className="text-xl font-semibold flex items-center">
              <Gift className="mr-2 h-6 w-6 text-primary" />
              Refer a Stylist & Earn LukuPoints!
            </h3>
            <p className="text-sm text-muted-foreground">
              Share your unique referral link with friends. For every friend who signs up and verifies their email, you'll earn <strong className="text-accent">2 LukuPoints!</strong> (Plus, they get 5 LukuPoints on signup!)
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 border rounded-md bg-secondary/30">
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
                className="w-full sm:w-auto"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </div>
        </CardContent>

        <Separator className="my-4 sm:my-6" />

        <CardContent>
            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
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
                    <AlertDialogContent>
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
            </div>
        </CardContent>
        <CardFooter />
      </Card>

      {/* Image Cropping Dialog */}
      <Dialog open={showCropDialog} onOpenChange={(isOpen) => {
          setShowCropDialog(isOpen);
          if (!isOpen) {
            setImageSrcToCrop(null); 
          }
      }}>
        <DialogContent className="sm:max-w-md p-0 flex flex-col max-h-[85vh]">
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
  );
}

    