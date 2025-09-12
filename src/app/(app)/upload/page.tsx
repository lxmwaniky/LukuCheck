
'use client';
import { useState, type ChangeEvent, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { processOutfitWithAI } from '@/actions/outfitActions';
import type { StyleSuggestionsOutput } from '@/ai/flows/style-suggestions';
import { handleLeaderboardSubmissionPerks } from '@/actions/userActions';
import { UploadCloud, Sparkles, Send, Info, Loader2, Star, Palette, Shirt, MessageSquareQuote, Ban, Clock, ShieldAlert, ImageOff, Eye, XCircle, RefreshCw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { db, storage } from '@/config/firebase';
import { doc, getDoc, setDoc, updateDoc, Timestamp, collection, addDoc, query, where, getDocs as getFirestoreDocs } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { format, set, isBefore, isAfter, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { TIMING_CONFIG, TIMING_MESSAGES } from '@/config/timing';

// AI Usage Limits
const DEFAULT_FREE_TIER_AI_LIMIT = 2;

interface ProcessedOutfitClient extends StyleSuggestionsOutput {
  outfitImageBase64: string; // Store base64 for AI and pre-submission
  outfitImageURLForDisplay: string; // Could be base64 or Firebase URL post-submission
  outfitImageFirebaseURL?: string; // Firebase URL after submission
  submittedToLeaderboard?: boolean;
  localId: string;
}

const formatTimeLeft = (ms: number): string => {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const toYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function getAiUsageDateString(): string {
  const now = new Date();
  const currentHour = now.getHours();
  let targetDate = new Date(now);
  if (currentHour < 6) { // AI usage resets at 6 AM
    targetDate.setDate(now.getDate() - 1);
  }
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dayString = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayString}`;
}

// Placeholder for client-side image compression.
// For production, integrate a library like 'browser-image-compression'.
// async function compressImage(file: File): Promise<string> {

//   // This is where you'd use browser-image-compression or similar
//   // For now, just reading the file as base64.
//   // console.log(`Original file size: ${file.size / 1024 / 1024} MB`);
//   // const options = {
//   //   maxSizeMB: 0.5, // Max 0.5MB
//   //   maxWidthOrHeight: 1024, // Max 1024px
//   //   useWebWorker: true,
//   // };
//   try {
//     // const compressedFile = await imageCompression(file, options);
//     // console.log(`Compressed file size: ${compressedFile.size / 1024 / 1024} MB`);
//     // return new Promise((resolve, reject) => {
//     //    const reader = new FileReader();
//     //    reader.onloadend = () => resolve(reader.result as string);
//     //    reader.onerror = reject;
//     //    reader.readAsDataURL(compressedFile);
//     // });
//     // For now, returning original base64 if compression library not integrated
//     return new Promise((resolve, reject) => {
//        const reader = new FileReader();
//        reader.onloadend = () => resolve(reader.result as string);
//        reader.onerror = reject;
//        reader.readAsDataURL(file);
//     });
//   } catch (error) {
//     // console.error('Error compressing image:', error);
//     // Fallback to original if compression fails
//     return new Promise((resolve, reject) => {
//        const reader = new FileReader();
//        reader.onloadend = () => resolve(reader.result as string);
//        reader.onerror = reject;
//        reader.readAsDataURL(file);
//     });
//   }
// }


export default function UploadPage() {
  const { user, userProfile, loading: authLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64Preview, setImageBase64Preview] = useState<string | null>(null); // For current upload preview
  const [isProcessingAIRating, setIsProcessingAIRating] = useState(false);

  const [todaysRatedOutfits, setTodaysRatedOutfits] = useState<ProcessedOutfitClient[]>([]);
  const [selectedOutfitForDetails, setSelectedOutfitForDetails] = useState<ProcessedOutfitClient | null>(null);

  const [aiUsage, setAiUsage] = useState({ count: 0, limitReached: false });
  const [currentAiLimit, setCurrentAiLimit] = useState(DEFAULT_FREE_TIER_AI_LIMIT);
  const [isSubmittingToLeaderboard, setIsSubmittingToLeaderboard] = useState(false);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);

  const [isSubmissionWindowOpen, setIsSubmissionWindowOpen] = useState(false);
  const [isSubmissionNotYetOpen, setIsSubmissionNotYetOpen] = useState(false);
  const [timeLeftToSubmissionOpen, setTimeLeftToSubmissionOpen] = useState(0);
  const [timeLeftToSubmissionClose, setTimeLeftToSubmissionClose] = useState(0);

  const fetchAIUsageOnClient = useCallback(async () => {
    if (!user || !db) return;

    // Determine effective AI limit (custom or default)
    const userCustomLimit = userProfile?.aiUsageLimit;
    const effectiveLimit = (typeof userCustomLimit === 'number' && userCustomLimit >= 0)
                            ? userCustomLimit
                            : DEFAULT_FREE_TIER_AI_LIMIT;
    setCurrentAiLimit(effectiveLimit);

    const usageDateString = getAiUsageDateString();
    const usageDocPath = `users/${user.uid}/aiUsage/${usageDateString}`;
    const usageRef = doc(db, usageDocPath);
    try {
      const usageSnap = await getDoc(usageRef);

      if (usageSnap.exists()) {
        const data = usageSnap.data();
        const count = data.count || 0;
        setAiUsage({ count, limitReached: count >= effectiveLimit });
      } else {
        setAiUsage({ count: 0, limitReached: effectiveLimit === 0 }); // if limit is 0, it's immediately reached
      }
    } catch (error) {
      setAiUsage({ count: 0, limitReached: effectiveLimit === 0 });
    }
  }, [user, userProfile?.aiUsageLimit]);

  const clientIncrementAIUsage = useCallback(async (): Promise<{ success: boolean; error?: string; limitReached?: boolean }> => {
    if (!user || !db) return { success: false, error: 'User ID or DB is required.' };

    const userCustomLimit = userProfile?.aiUsageLimit;
    const effectiveLimit = (typeof userCustomLimit === 'number' && userCustomLimit >= 0)
                            ? userCustomLimit
                            : DEFAULT_FREE_TIER_AI_LIMIT;
    setCurrentAiLimit(effectiveLimit); // Ensure currentAiLimit state is also up-to-date

    if (effectiveLimit === 0) {
      setAiUsage({ count: 0, limitReached: true });
      toast({ title: 'AI Usage Disabled', description: `Your AI usage limit is set to 0.`, variant: 'default' });
      return { success: false, error: `AI usage limit is 0.`, limitReached: true };
    }

    const usageDateString = getAiUsageDateString();
    const usageDocPath = `users/${user.uid}/aiUsage/${usageDateString}`;
    const usageRef = doc(db, usageDocPath);

    try {
      const usageSnap = await getDoc(usageRef);
      let currentCount = 0;
      if (usageSnap.exists()) currentCount = usageSnap.data()?.count || 0;

      if (currentCount >= effectiveLimit) {
        setAiUsage({ count: currentCount, limitReached: true });
        toast({ title: 'Usage Limit Reached', description: `AI usage limit (${effectiveLimit}/day) reached. Resets 6 AM local time.`, variant: 'default' });
        return { success: false, error: `AI usage limit (${effectiveLimit}/day) reached.`, limitReached: true };
      }
      const newCount = currentCount + 1;
      if (!usageSnap.exists()) {
        await setDoc(usageRef, { count: newCount, lastUsed: Timestamp.now() });
      } else {
        await updateDoc(usageRef, { count: newCount, lastUsed: Timestamp.now() });
      }
      setAiUsage({ count: newCount, limitReached: newCount >= effectiveLimit });
      return { success: true, limitReached: newCount >= effectiveLimit };
    } catch (error: any) {
      let errorMessage = `AI usage update failed: ${error.message || "Unknown error"}`;
      if (error.message?.includes('PERMISSION_DENIED') || error.code === 'permission-denied') {
        errorMessage = "Permission denied to update AI usage. Check Firestore rules.";
      }
      toast({ title: 'AI Usage Error', description: errorMessage, variant: 'destructive' });
      await fetchAIUsageOnClient();
      return { success: false, error: errorMessage };
    }
  }, [user, userProfile?.aiUsageLimit, fetchAIUsageOnClient, toast]);

  useEffect(() => {
    const checkSubmissionStatusAndWindow = async () => {
      if (!user) return;
      const now = new Date();
      const submissionOpenTime = set(now, { hours: TIMING_CONFIG.SUBMISSION_OPEN_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });
      const submissionCloseTime = set(now, { hours: TIMING_CONFIG.SUBMISSION_CLOSE_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });
      const currentSubmissionWindowOpen = isAfter(now, submissionOpenTime) && isBefore(now, submissionCloseTime);
      setIsSubmissionWindowOpen(currentSubmissionWindowOpen);
      const currentSubmissionNotYetOpen = isBefore(now, submissionOpenTime);
      setIsSubmissionNotYetOpen(currentSubmissionNotYetOpen);
      setTimeLeftToSubmissionOpen(submissionOpenTime.getTime() - now.getTime());
      setTimeLeftToSubmissionClose(submissionCloseTime.getTime() - now.getTime());

      await fetchAIUsageOnClient(); // This will also set currentAiLimit

      const todaysDateStr = toYYYYMMDD(now);
      if (db) {
        const outfitsCollectionRef = collection(db, 'outfits');
        const q = query(outfitsCollectionRef, where('userId', '==', user.uid), where('leaderboardDate', '==', todaysDateStr));
        try {
          const querySnapshot = await getFirestoreDocs(q);
          setHasSubmittedToday(!querySnapshot.empty);
        } catch (error) {
           // Error reading submission status, handled by UI defaults
        }
      }
    };
    if (user) checkSubmissionStatusAndWindow();
    const interval = setInterval(() => { if (user) checkSubmissionStatusAndWindow(); }, 60000);
    return () => clearInterval(interval);
  }, [user, fetchAIUsageOnClient]);

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setSelectedOutfitForDetails(null); // Clear any previously selected outfit details

      // **TODO: Implement robust client-side image compression here**
      // Example using a placeholder function:
      // const compressedBase64 = await compressImage(file);
      // setImageBase64Preview(compressedBase64);

      // For now, without a real compression library, just read the file:
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64Preview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetRating = async () => {
    if (!imageFile || !imageBase64Preview || !user || !storage) {
      toast({ title: 'Missing information', description: 'Please select an image and ensure you are logged in.', variant: 'destructive' });
      return;
    }
    setIsProcessingAIRating(true);
    setSelectedOutfitForDetails(null); // Clear previous selection

    try {
      // For cost optimization, we pass the base64 data URI directly to the AI.
      // The image is only uploaded to Firebase Storage if the user explicitly submits to the leaderboard.
      const processedBase64ForAI = imageBase64Preview; // This should be the (potentially compressed) base64

      const incrementResult = await clientIncrementAIUsage();
      if (!incrementResult.success) {
        setIsProcessingAIRating(false);
        return; // Stop if usage limit reached or error during increment
      }

      const aiProcessingResult = await processOutfitWithAI({ photoDataUri: processedBase64ForAI });

      if (aiProcessingResult.success && aiProcessingResult.data) {
        const newRatedOutfit: ProcessedOutfitClient = {
          ...aiProcessingResult.data,
          outfitImageBase64: processedBase64ForAI, // Store the base64 used for AI
          outfitImageURLForDisplay: processedBase64ForAI, // Initially display base64
          submittedToLeaderboard: false,
          localId: Date.now().toString() + Math.random().toString(36).substring(2, 9) // Unique ID for client-side list
        };
        // Add to the start of the array and keep only the latest N (e.g., 5)
        setTodaysRatedOutfits(prev => [newRatedOutfit, ...prev].slice(0, 5));
        setImageFile(null);
        setImageBase64Preview(null);
        toast({ title: 'AI Analysis Complete!', description: `Outfit rated ${aiProcessingResult.data.rating.toFixed(1)}/10. Ready for review.` });
      } else {
        toast({ title: 'AI Analysis Failed', description: aiProcessingResult.error || 'Unknown error during AI processing.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsProcessingAIRating(false);
    }
  };

  const handleSelectOutfitForDetails = (outfit: ProcessedOutfitClient) => {
    setSelectedOutfitForDetails(outfit);
  };

  const handleSubmitToLeaderboard = async () => {
    if (!user || !userProfile || !selectedOutfitForDetails || !selectedOutfitForDetails.outfitImageBase64 || !db || !storage) {
      toast({ title: 'Error', description: 'No outfit selected or missing data for submission.', variant: 'destructive' });
      return;
    }
    if (!selectedOutfitForDetails.isActualUserOutfit) {
      toast({ title: "Invalid Submission", description: selectedOutfitForDetails.validityCritique || "This outfit cannot be submitted due to AI validation.", variant: "destructive" });
      return;
    }
    if (hasSubmittedToday) {
      toast({ title: "Already Submitted", description: "You've already submitted an outfit today.", variant: "default" });
      return;
    }
    if (!isSubmissionWindowOpen) {
      toast({ title: "Submissions Closed", description: `Submissions are ${isSubmissionNotYetOpen ? `not open yet (opens in ${formatTimeLeft(timeLeftToSubmissionOpen)})` : 'closed for today.'}`, variant: "default" });
      return;
    }

    setIsSubmittingToLeaderboard(true);
    try {
      // Upload image to Firebase Storage now that user wants to submit
      const imageFileName = `outfits/${user.uid}/${Date.now()}_${selectedOutfitForDetails.localId}.jpg`;
      const imageRef = ref(storage, imageFileName);

      // Use the stored base64 for upload
      await uploadString(imageRef, selectedOutfitForDetails.outfitImageBase64, 'data_url', { contentType: 'image/jpeg' });
      const uploadedOutfitFirebaseURL = await getDownloadURL(imageRef);
      if (!uploadedOutfitFirebaseURL) throw new Error("Failed to upload image to Firebase Storage or get download URL.");


      const leaderboardDateStr = toYYYYMMDD(new Date());
      const outfitsCollectionRef = collection(db, 'outfits');
      const outfitData = {
        userId: user.uid,
        username: userProfile.username,
        userPhotoURL: userProfile.customPhotoURL || userProfile.photoURL,
        outfitImageURL: uploadedOutfitFirebaseURL, // Use the actual Firebase Storage URL
        rating: selectedOutfitForDetails.rating,
        colorSuggestions: selectedOutfitForDetails.colorSuggestions,
        lookSuggestions: selectedOutfitForDetails.lookSuggestions,
        submittedAt: Timestamp.now(),
        leaderboardDate: leaderboardDateStr,
        complimentOrCritique: selectedOutfitForDetails.complimentOrCritique,
        isActualUserOutfit: selectedOutfitForDetails.isActualUserOutfit,
        validityCritique: selectedOutfitForDetails.validityCritique || null,
      };
      await addDoc(outfitsCollectionRef, outfitData);
      toast({ title: 'Success!', description: 'Outfit submitted to the leaderboard.' });

      setHasSubmittedToday(true);
      // Update the specific outfit in the list to mark as submitted and use Firebase URL for display
      setTodaysRatedOutfits(prevOutfits =>
        prevOutfits.map(o => o.localId === selectedOutfitForDetails.localId ? { ...o, submittedToLeaderboard: true, outfitImageURLForDisplay: uploadedOutfitFirebaseURL, outfitImageFirebaseURL: uploadedOutfitFirebaseURL } : o)
      );
      setSelectedOutfitForDetails(prev => prev ? { ...prev, submittedToLeaderboard: true, outfitImageURLForDisplay: uploadedOutfitFirebaseURL, outfitImageFirebaseURL: uploadedOutfitFirebaseURL } : null);

      const perksResult = await handleLeaderboardSubmissionPerks(user.uid, selectedOutfitForDetails.rating);
      if (perksResult.success) {
        toast({ title: 'Perks Updated!', description: perksResult.message || 'Points & badges processed.', duration: 2000 });
        await refreshUserProfile();
      } else {
        toast({ title: 'Perks Error', description: perksResult.error, variant: 'destructive' });
      }

    } catch (error: any) {
      let errorMessage = 'Failed to submit to leaderboard.';
      if (error.code === 'storage/unauthorized' || error.message?.toLowerCase().includes('permission denied to access object')) {
          errorMessage = 'Permission denied to upload image to Firebase Storage. Check Storage rules.';
      } else if (error.code === 'permission-denied' || error.message?.toLowerCase().includes('permission denied')) {
          errorMessage = 'Permission denied to submit to leaderboard (Firestore). Check Firestore security rules.';
      } else if (error.message) {
          errorMessage = error.message;
      }
      toast({ title: 'Submission Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSubmittingToLeaderboard(false);
    }
  };

  if (authLoading) {
    return <div className="flex justify-center items-center h-full p-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2 text-muted-foreground">Loading Your Style Studio...</span></div>;
  }

  const getRatingDisabled = !imageFile || isProcessingAIRating || aiUsage.limitReached;
  const imageInputDisabled = aiUsage.limitReached || isProcessingAIRating;

  const submitToLeaderboardButtonDisabled = isSubmittingToLeaderboard ||
    !selectedOutfitForDetails ||
    selectedOutfitForDetails.submittedToLeaderboard ||
    hasSubmittedToday ||
    !isSubmissionWindowOpen ||
    (selectedOutfitForDetails && !selectedOutfitForDetails.isActualUserOutfit);

  let submitToLeaderboardButtonText = "Submit to Daily Leaderboard";
  if (selectedOutfitForDetails && !selectedOutfitForDetails.isActualUserOutfit) submitToLeaderboardButtonText = "Cannot Submit (Invalid Image)";
  else if (hasSubmittedToday || selectedOutfitForDetails?.submittedToLeaderboard) submitToLeaderboardButtonText = "Submitted Today!";
  else if (!isSubmissionWindowOpen && !isSubmissionNotYetOpen) submitToLeaderboardButtonText = "Submission Window Closed";
  else if (isSubmissionNotYetOpen) submitToLeaderboardButtonText = `Submissions Open In: ${formatTimeLeft(timeLeftToSubmissionOpen)}`;

  return (
    <div className="container mx-auto py-6 sm:py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
        <Card className="shadow-xl rounded-lg">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl flex items-center text-primary">
              <UploadCloud className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8" /> Submit Your Look
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">Get feedback, then choose your best look for the leaderboard!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="outfitImage" className="text-base sm:text-lg font-medium">Outfit Photo</Label>
              <Input id="outfitImage" type="file" accept="image/*" onChange={handleImageChange} className="file:text-primary file:font-semibold file:mr-2" disabled={imageInputDisabled} />
              <p className="text-xs text-muted-foreground">Tip: Clear, well-lit photos get better AI feedback. Consider compressing images client-side before upload.</p>
            </div>

            {imageBase64Preview && (
              <div className="mt-3 sm:mt-4 border-2 border-dashed border-primary/30 rounded-lg overflow-hidden shadow-inner p-2 bg-muted/20">
                <Image src={imageBase64Preview} alt="Outfit preview" width={500} height={500} className="object-contain w-full h-auto max-h-[300px] sm:max-h-[400px] rounded-md" data-ai-hint="fashion clothing detail" />
              </div>
            )}

            <Alert variant="default" className="bg-secondary/30 border-secondary">
              <Info className="h-4 w-4 text-secondary-foreground" />
              <AlertTitle className="font-semibold">AI Usage: {aiUsage.count}/{currentAiLimit} Analyses Used Today</AlertTitle>
              <AlertDescription className="text-xs sm:text-sm">
                {aiUsage.limitReached ? `You've reached your daily AI analysis limit. Resets 6 AM local time.` : `Get up to ${currentAiLimit} AI ratings per day (resets 6 AM).`}
                 {userProfile?.aiUsageLimit !== null && userProfile?.aiUsageLimit !== undefined && <span className="block mt-1 text-blue-600 dark:text-blue-400">You have a custom daily limit set by an admin.</span>}
              </AlertDescription>
            </Alert>

            {!hasSubmittedToday && isSubmissionNotYetOpen && timeLeftToSubmissionOpen > 0 && (
              <Alert variant="default" className="bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300">
                <Clock className="h-4 w-4" />
                <AlertTitle>Submissions Open Soon</AlertTitle>
                <AlertDescription className="text-xs sm:text-sm">
                  {TIMING_MESSAGES.SUBMISSION_OPEN_SOON(formatTimeLeft(timeLeftToSubmissionOpen))}
                </AlertDescription>
              </Alert>
            )}

            {!hasSubmittedToday && !isSubmissionWindowOpen && !isSubmissionNotYetOpen && (
              <Alert variant="destructive">
                <Ban className="h-4 w-4" />
                <AlertTitle>Submissions Closed for Today</AlertTitle>
                <AlertDescription className="text-xs sm:text-sm">
                  {TIMING_MESSAGES.SUBMISSION_CLOSED_TODAY}
                </AlertDescription>
              </Alert>
            )}

            {hasSubmittedToday && (
              <Alert variant="default" className="bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Submission Complete for Today</AlertTitle>
                <AlertDescription className="text-xs sm:text-sm">
                  You've already submitted an outfit for today's leaderboard. Check back tomorrow!
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleGetRating} disabled={getRatingDisabled} className="w-full text-base sm:text-lg py-3">
              {isProcessingAIRating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
              Get AI Rating & Suggestions
            </Button>
          </CardFooter>
        </Card>

        <div className="md:col-span-1 space-y-6 sm:space-y-8">
          {isProcessingAIRating && !selectedOutfitForDetails && todaysRatedOutfits.length === 0 && (
            <Card className="shadow-xl rounded-lg animate-pulse">
              <CardHeader className="items-center">
                <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary" />
                <CardTitle className="text-lg sm:text-xl font-semibold text-foreground mt-3">Our AI is analyzing your style...</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <Progress value={50} className="w-3/4 mx-auto" />
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">This might take a few moments.</p>
              </CardContent>
            </Card>
          )}

          {todaysRatedOutfits.length > 0 && !selectedOutfitForDetails && (
            <Card className="shadow-xl rounded-lg animate-in fade-in duration-500">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Today's Rated Looks</CardTitle>
                <CardDescription className="text-sm sm:text-base">Review your outfits and choose one to submit.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {todaysRatedOutfits.map((outfit) => (
                  <Card key={outfit.localId} className={cn("p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 transition-all hover:shadow-md", outfit.submittedToLeaderboard ? "bg-green-500/10 border-green-500/30" : "bg-card hover:bg-muted/50", !outfit.isActualUserOutfit && "border-destructive/50")}>
                    <Image src={outfit.outfitImageURLForDisplay} alt="Rated outfit" width={72} height={72} className="rounded-md aspect-square object-cover border-2 border-primary/20 shadow-sm" data-ai-hint="fashion clothing item"/>
                    <div className="flex-grow text-center sm:text-left">
                      <p className="text-2xl sm:text-3xl font-bold text-primary">{outfit.rating.toFixed(1)}<span className="text-lg text-muted-foreground">/10</span></p>
                      {!outfit.isActualUserOutfit && <p className="text-xs text-destructive mt-0.5">{outfit.validityCritique || "AI flagged this image."}</p>}
                    </div>
                    <Button
                      onClick={() => handleSelectOutfitForDetails(outfit)}
                      disabled={!outfit.isActualUserOutfit || outfit.submittedToLeaderboard}
                      variant={outfit.submittedToLeaderboard ? "ghost" : "default"}
                      size="sm"
                      className="w-full sm:w-auto mt-2 sm:mt-0"
                    >
                      {outfit.submittedToLeaderboard ? <><Star className="mr-2 h-4 w-4 text-green-600 fill-green-600"/>Submitted!</> : <><Eye className="mr-2 h-4 w-4"/>Review & Prepare</>}
                    </Button>
                  </Card>
                ))}
              </CardContent>
               {hasSubmittedToday && (
                  <CardFooter>
                    <Alert variant="default" className="mt-4 bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 w-full">
                        <ShieldAlert className="h-5 w-5" />
                        <AlertTitle>Leaderboard Submission Sent!</AlertTitle>
                        <AlertDescription>
                            You've successfully submitted an outfit for today. Check the leaderboard later!
                        </AlertDescription>
                    </Alert>
                  </CardFooter>
                )}
            </Card>
          )}

          {selectedOutfitForDetails && (
            <Card className="shadow-xl rounded-lg animate-in fade-in duration-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl sm:text-2xl flex items-center text-accent">
                            <Sparkles className="mr-2 sm:mr-3 h-6 w-6 sm:h-7 sm:w-7" /> AI Feedback
                        </CardTitle>
                        <CardDescription className="text-sm sm:text-base">Here's what our fashion AI thinks.</CardDescription>
                    </div>
                     <Button variant="ghost" size="icon" onClick={() => setSelectedOutfitForDetails(null)} className="ml-auto -mt-2 -mr-2 sm:mt-0 sm:mr-0">
                        <XCircle className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                        <span className="sr-only">Close details</span>
                    </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {!selectedOutfitForDetails.isActualUserOutfit && (
                  <Alert variant="destructive">
                    <ImageOff className="h-5 w-5" />
                    <AlertTitle>Image Validity Issue</AlertTitle>
                    <AlertDescription>{selectedOutfitForDetails.validityCritique}</AlertDescription>
                  </Alert>
                )}

                <div className="text-center py-2">
                  <p className="text-4xl sm:text-5xl font-bold text-primary">{selectedOutfitForDetails.rating.toFixed(1)}<span className="text-xl sm:text-2xl text-muted-foreground">/10</span></p>
                  <div className="flex justify-center mt-1">
                    {[...Array(10)].map((_, i) => (
                      <Star key={i} className={`h-5 w-5 sm:h-6 sm:w-6 ${i < Math.round(selectedOutfitForDetails.rating) ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`} />
                    ))}
                  </div>
                </div>

                <Separator className="my-3 sm:my-4" />

                <div>
                  <h3 className="text-md sm:text-lg font-semibold mb-1 flex items-center"><MessageSquareQuote className="mr-2 h-5 w-5 text-primary"/>Stylist's Verdict:</h3>
                  <p className="text-sm sm:text-base text-foreground/90 italic bg-muted/30 p-2 rounded-md border">{selectedOutfitForDetails.complimentOrCritique || "No specific verdict provided."}</p>
                </div>

                <div>
                  <h3 className="text-md sm:text-lg font-semibold mb-1 flex items-center"><Palette className="mr-2 h-5 w-5 text-primary"/>Color Suggestions:</h3>
                  {selectedOutfitForDetails.colorSuggestions && selectedOutfitForDetails.colorSuggestions.length > 0 ? (
                    <ul className="list-disc list-inside space-y-0.5 text-sm sm:text-base text-foreground/90 pl-3">
                      {selectedOutfitForDetails.colorSuggestions.map((color, index) => <li key={index}>{color}</li>)}
                    </ul>
                  ) : (<p className="text-sm sm:text-base text-muted-foreground italic">No specific color suggestions provided.</p>)}
                </div>

                <div>
                  <h3 className="text-md sm:text-lg font-semibold mb-1 flex items-center"><Shirt className="mr-2 h-5 w-5 text-primary"/>Look Suggestions:</h3>
                  <p className="text-sm sm:text-base text-foreground/90">{selectedOutfitForDetails.lookSuggestions || "No specific look suggestions provided."}</p>
                </div>

                {selectedOutfitForDetails.outfitImageURLForDisplay && (
                  <div className="mt-3 border-2 border-dashed border-primary/30 rounded-lg overflow-hidden shadow-inner p-1 bg-muted/20">
                    <Image src={selectedOutfitForDetails.outfitImageURLForDisplay} alt="Processed outfit" width={300} height={300} className="object-contain w-full h-auto max-h-[200px] sm:max-h-[250px] rounded" data-ai-hint="model clothing detail"/>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSubmitToLeaderboard}
                  disabled={submitToLeaderboardButtonDisabled}
                  className="w-full text-base sm:text-lg py-3 bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {isSubmittingToLeaderboard ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                  {submitToLeaderboardButtonText}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
