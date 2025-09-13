
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto py-6 sm:py-8 px-4">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
              <UploadCloud className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Style Analysis Studio
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your outfit, get AI-powered style feedback, and compete on the leaderboard
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
            {/* Upload Section - Left Column */}
            <div className="xl:col-span-2 space-y-6">
              {/* Upload Card */}
              <Card className="overflow-hidden shadow-2xl bg-white/90 backdrop-blur-md dark:bg-gray-800/90 border-0">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl sm:text-2xl">Upload Your Look</CardTitle>
                      <CardDescription className="text-base">Get instant AI feedback on your style</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 sm:p-8">
                  {/* Image Upload Area */}
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="outfitImage" className="text-lg font-medium flex items-center gap-2">
                        <UploadCloud className="h-5 w-5" />
                        Choose Your Outfit Photo
                      </Label>
                      
                      {/* Enhanced Upload Zone */}
                      <div className="relative">
                        <Input 
                          id="outfitImage" 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageChange} 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                          disabled={imageInputDisabled} 
                        />
                        <div className={cn(
                          "border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all duration-300",
                          imageBase64Preview 
                            ? "border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/20" 
                            : "border-gray-300 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:border-blue-600"
                        )}>
                          {imageBase64Preview ? (
                            <div className="space-y-4">
                              <div className="relative mx-auto w-fit">
                                <Image 
                                  src={imageBase64Preview} 
                                  alt="Outfit preview" 
                                  width={300} 
                                  height={300} 
                                  className="rounded-lg shadow-lg max-w-full h-auto max-h-[300px] object-contain border-2 border-white dark:border-gray-700" 
                                />
                                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                                  <Sparkles className="h-4 w-4" />
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <p className="font-medium text-green-600 dark:text-green-400">✓ Image loaded successfully</p>
                                <p>Click to change or drag a new image</p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="mx-auto w-fit p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                <UploadCloud className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="text-lg font-medium text-foreground">Drop your outfit photo here</p>
                                <p className="text-sm text-muted-foreground">or click to browse files</p>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <p>• Supported formats: JPG, PNG, WebP</p>
                                <p>• Best results with good lighting</p>
                                <p>• Clear, full-body or outfit-focused shots work best</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI Usage Status */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-1.5 bg-blue-500 rounded-full">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">AI Analysis Status</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700 dark:text-blue-300">Daily Usage</span>
                          <span className="font-mono font-bold text-blue-900 dark:text-blue-100">
                            {aiUsage.count}/{currentAiLimit}
                          </span>
                        </div>
                        <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((aiUsage.count / Math.max(currentAiLimit, 1)) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {aiUsage.limitReached 
                            ? "Daily limit reached • Resets at 6 AM" 
                            : `${currentAiLimit - aiUsage.count} analyses remaining today`
                          }
                        </p>
                        {userProfile?.aiUsageLimit !== null && userProfile?.aiUsageLimit !== undefined && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            ✓ Custom limit set by admin
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Submission Window Alerts */}
                    {!hasSubmittedToday && isSubmissionNotYetOpen && timeLeftToSubmissionOpen > 0 && (
                      <Alert className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-900 dark:text-amber-100">Leaderboard Opens Soon</AlertTitle>
                        <AlertDescription className="text-amber-700 dark:text-amber-300">
                          {TIMING_MESSAGES.SUBMISSION_OPEN_SOON(formatTimeLeft(timeLeftToSubmissionOpen))}
                        </AlertDescription>
                      </Alert>
                    )}

                    {!hasSubmittedToday && !isSubmissionWindowOpen && !isSubmissionNotYetOpen && (
                      <Alert variant="destructive" className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30">
                        <Ban className="h-4 w-4" />
                        <AlertTitle>Submissions Closed</AlertTitle>
                        <AlertDescription>
                          {TIMING_MESSAGES.SUBMISSION_CLOSED_TODAY}
                        </AlertDescription>
                      </Alert>
                    )}

                    {hasSubmittedToday && (
                      <Alert className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800">
                        <ShieldAlert className="h-4 w-4 text-emerald-600" />
                        <AlertTitle className="text-emerald-900 dark:text-emerald-100">Today's Submission Complete</AlertTitle>
                        <AlertDescription className="text-emerald-700 dark:text-emerald-300">
                          You've already submitted an outfit for today's leaderboard. Check back tomorrow!
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="p-6 sm:p-8 pt-0">
                  <Button 
                    onClick={handleGetRating} 
                    disabled={getRatingDisabled} 
                    size="lg"
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isProcessingAIRating ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Analyzing Your Style...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-3 h-6 w-6" />
                        Get AI Style Analysis
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Results Section - Right Column */}
            <div className="space-y-6">
              {/* AI Processing State */}
              {isProcessingAIRating && !selectedOutfitForDetails && todaysRatedOutfits.length === 0 && (
                <Card className="shadow-xl bg-white/90 backdrop-blur-md dark:bg-gray-800/90 border-0 overflow-hidden">
                  <CardContent className="p-8">
                    <div className="text-center space-y-6">
                      <div className="relative mx-auto w-20 h-20">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-pulse"></div>
                        <div className="absolute inset-2 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                          <Sparkles className="h-8 w-8 text-blue-600 animate-bounce" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold">AI Style Analysis</h3>
                        <p className="text-muted-foreground">Our fashion AI is analyzing your outfit...</p>
                      </div>
                      <Progress value={50} className="h-3" />
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• Analyzing colors and patterns</p>
                        <p>• Evaluating fit and styling</p>
                        <p>• Generating personalized suggestions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Today's Rated Outfits */}
              {todaysRatedOutfits.length > 0 && !selectedOutfitForDetails && (
                <Card className="shadow-xl bg-white/90 backdrop-blur-md dark:bg-gray-800/90 border-0 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-b">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <Star className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Today's Analysis</CardTitle>
                        <CardDescription>Your rated outfits • Choose one for the leaderboard</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    <div className="max-h-[500px] overflow-y-auto">
                      {todaysRatedOutfits.map((outfit, index) => (
                        <div key={outfit.localId} className={cn(
                          "p-6 border-b last:border-b-0 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50",
                          outfit.submittedToLeaderboard && "bg-emerald-50/50 dark:bg-emerald-950/20"
                        )}>
                          <div className="flex items-start gap-4">
                            {/* Image */}
                            <div className="relative flex-shrink-0">
                              <Image 
                                src={outfit.outfitImageURLForDisplay} 
                                alt={`Outfit ${index + 1}`}
                                width={80} 
                                height={80} 
                                className="rounded-xl object-cover border-2 border-gray-200 dark:border-gray-700 shadow-sm" 
                              />
                              {outfit.submittedToLeaderboard && (
                                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1">
                                  <Star className="h-3 w-3 fill-current" />
                                </div>
                              )}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-grow min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                {/* Rating */}
                                <div className="space-y-1">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                      {outfit.rating.toFixed(1)}
                                    </span>
                                    <span className="text-sm text-muted-foreground">/10</span>
                                  </div>
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} className={cn(
                                        "h-3 w-3",
                                        i < Math.round(outfit.rating / 2) 
                                          ? 'text-amber-400 fill-amber-400' 
                                          : 'text-gray-300 dark:text-gray-600'
                                      )} />
                                    ))}
                                  </div>
                                </div>
                                
                                {/* Action Button */}
                                <Button
                                  onClick={() => handleSelectOutfitForDetails(outfit)}
                                  disabled={!outfit.isActualUserOutfit}
                                  variant={outfit.submittedToLeaderboard ? "secondary" : "default"}
                                  size="sm"
                                  className={outfit.submittedToLeaderboard ? "" : "bg-blue-600 hover:bg-blue-700"}
                                >
                                  {outfit.submittedToLeaderboard ? (
                                    <>
                                      <Star className="mr-2 h-4 w-4 text-emerald-600 fill-emerald-600"/>
                                      Submitted
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="mr-2 h-4 w-4"/>
                                      Review
                                    </>
                                  )}
                                </Button>
                              </div>
                              
                              {/* Validity Warning */}
                              {!outfit.isActualUserOutfit && (
                                <Alert variant="destructive" className="mt-3 py-2">
                                  <ImageOff className="h-4 w-4" />
                                  <AlertDescription className="text-xs">
                                    {outfit.validityCritique || "AI flagged this image"}
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  
                  {hasSubmittedToday && (
                    <CardFooter className="bg-emerald-50/50 dark:bg-emerald-950/20 border-t">
                      <Alert className="border-emerald-200 dark:border-emerald-800 bg-transparent w-full">
                        <ShieldAlert className="h-4 w-4 text-emerald-600" />
                        <AlertTitle className="text-emerald-800 dark:text-emerald-200 text-sm">Leaderboard Submission Complete!</AlertTitle>
                        <AlertDescription className="text-emerald-700 dark:text-emerald-300 text-xs">
                          Check the leaderboard later to see how you rank against other stylists today.
                        </AlertDescription>
                      </Alert>
                    </CardFooter>
                  )}
                </Card>
              )}

              {/* AI Feedback Detail View */}
              {selectedOutfitForDetails && (
                <Card className="shadow-xl bg-white/90 backdrop-blur-md dark:bg-gray-800/90 border-0 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-b">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">AI Style Analysis</CardTitle>
                          <CardDescription>Detailed feedback from our fashion AI</CardDescription>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setSelectedOutfitForDetails(null)}
                        className="hover:bg-purple-100 dark:hover:bg-purple-900/30"
                      >
                        <XCircle className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6 space-y-6">
                    {/* Validity Warning */}
                    {!selectedOutfitForDetails.isActualUserOutfit && (
                      <Alert variant="destructive" className="border-red-200 dark:border-red-800">
                        <ImageOff className="h-5 w-5" />
                        <AlertTitle>Image Quality Issue</AlertTitle>
                        <AlertDescription>
                          {selectedOutfitForDetails.validityCritique}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Rating Section */}
                    <div className="text-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border">
                      <div className="space-y-3">
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            {selectedOutfitForDetails.rating.toFixed(1)}
                          </span>
                          <span className="text-xl text-muted-foreground">/10</span>
                        </div>
                        <div className="flex justify-center gap-1">
                          {[...Array(10)].map((_, i) => (
                            <Star key={i} className={cn(
                              "h-5 w-5 transition-colors",
                              i < Math.round(selectedOutfitForDetails.rating) 
                                ? 'text-amber-400 fill-amber-400' 
                                : 'text-gray-300 dark:text-gray-600'
                            )} />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {selectedOutfitForDetails.rating >= 8 ? "Outstanding style!" :
                           selectedOutfitForDetails.rating >= 6 ? "Great look!" :
                           selectedOutfitForDetails.rating >= 4 ? "Good effort!" :
                           "Room for improvement"}
                        </p>
                      </div>
                    </div>

                    {/* Feedback Sections */}
                    <div className="space-y-4">
                      {/* Verdict */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                        <h3 className="font-semibold mb-2 flex items-center gap-2 text-foreground">
                          <MessageSquareQuote className="h-4 w-4 text-blue-600" />
                          Stylist's Verdict
                        </h3>
                        <p className="text-sm leading-relaxed text-foreground/80 italic border-l-4 border-blue-500 pl-4">
                          "{selectedOutfitForDetails.complimentOrCritique || "No specific verdict provided."}"
                        </p>
                      </div>

                      {/* Color Suggestions */}
                      <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                        <h3 className="font-semibold mb-3 flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                          <Palette className="h-4 w-4" />
                          Color Palette Suggestions
                        </h3>
                        {selectedOutfitForDetails.colorSuggestions && selectedOutfitForDetails.colorSuggestions.length > 0 ? (
                          <div className="space-y-2">
                            {selectedOutfitForDetails.colorSuggestions.map((color, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full flex-shrink-0"></div>
                                <span className="text-sm text-emerald-700 dark:text-emerald-300">{color}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-emerald-600 dark:text-emerald-400 italic">No specific color suggestions provided.</p>
                        )}
                      </div>

                      {/* Look Suggestions */}
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                        <h3 className="font-semibold mb-3 flex items-center gap-2 text-amber-800 dark:text-amber-200">
                          <Shirt className="h-4 w-4" />
                          Style Enhancement Tips
                        </h3>
                        <p className="text-sm leading-relaxed text-amber-700 dark:text-amber-300">
                          {selectedOutfitForDetails.lookSuggestions || "No specific look suggestions provided."}
                        </p>
                      </div>
                    </div>

                    {/* Image Display */}
                    {selectedOutfitForDetails.outfitImageURLForDisplay && (
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <div className="text-center">
                          <Image 
                            src={selectedOutfitForDetails.outfitImageURLForDisplay} 
                            alt="Analyzed outfit" 
                            width={400} 
                            height={400} 
                            className="rounded-lg shadow-lg max-w-full h-auto max-h-[300px] object-contain mx-auto border-4 border-white dark:border-gray-700" 
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t">
                    <Button
                      onClick={handleSubmitToLeaderboard}
                      disabled={submitToLeaderboardButtonDisabled}
                      size="lg"
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isSubmittingToLeaderboard ? (
                        <>
                          <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                          Submitting to Leaderboard...
                        </>
                      ) : (
                        <>
                          <Send className="mr-3 h-6 w-6" />
                          {submitToLeaderboardButtonText}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
