
'use client';
import { useState, type ChangeEvent, useEffect } from 'react';
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
import { UploadCloud, Sparkles, Send, Info, Loader2, Star, Palette, Shirt, MessageSquareQuote, Ban, Clock, ShieldAlert, ImageOff, Eye } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { db, storage } from '@/config/firebase';
import { doc, getDoc, setDoc, updateDoc, Timestamp, collection, addDoc, query, where, getDocs as getFirestoreDocs } from 'firebase/firestore'; 
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { format, subDays, set, isBefore, isAfter, addDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProcessedOutfitClient extends StyleSuggestionsOutput {
 outfitImageURL: string;
 submittedToLeaderboard?: boolean;
 localId: string; // For React key prop
}

const AI_USAGE_DAILY_LIMIT = 5; 

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
  if (currentHour < 6) {
    targetDate.setDate(now.getDate() - 1);
  }
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dayString = String(targetDate.getDate()).padStart(2, '0'); 
  return `${year}-${month}-${dayString}`;
}


export default function UploadPage() {
  const { user, userProfile, loading: authLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessingAIRating, setIsProcessingAIRating] = useState(false);
  
  const [todaysRatedOutfits, setTodaysRatedOutfits] = useState<ProcessedOutfitClient[]>([]);
  const [selectedOutfitForDetails, setSelectedOutfitForDetails] = useState<ProcessedOutfitClient | null>(null);

  const [aiUsage, setAiUsage] = useState({ count: 0, limitReached: false });
  const [isSubmittingToLeaderboard, setIsSubmittingToLeaderboard] = useState(false);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);

  const [isSubmissionWindowOpen, setIsSubmissionWindowOpen] = useState(false);
  const [isSubmissionNotYetOpen, setIsSubmissionNotYetOpen] = useState(false);
  const [timeLeftToSubmissionOpen, setTimeLeftToSubmissionOpen] = useState(0);
  const [timeLeftToSubmissionClose, setTimeLeftToSubmissionClose] = useState(0);


  const fetchAIUsageOnClient = async () => {
    if (!user) return;
    const usageDateString = getAiUsageDateString();
    const usageDocPath = `users/${user.uid}/aiUsage/${usageDateString}`;
    const usageRef = doc(db, usageDocPath);
    try {
      const usageSnap = await getDoc(usageRef);
      if (usageSnap.exists()) {
        const data = usageSnap.data();
        const count = data.count || 0;
        setAiUsage({ count, limitReached: count >= AI_USAGE_DAILY_LIMIT });
      } else {
        setAiUsage({ count: 0, limitReached: false });
      }
    } catch (error) {
      console.error("[UploadPage DEBUG] fetchAIUsageOnClient - Failed to fetch AI usage:", error);
    }
  };

  const clientIncrementAIUsage = async (): Promise<{ success: boolean; error?: string; limitReached?: boolean }> => {
    if (!user) return { success: false, error: 'User ID is required.'};
    const usageDateString = getAiUsageDateString();
    const usageDocPath = `users/${user.uid}/aiUsage/${usageDateString}`;
    const usageRef = doc(db, usageDocPath);
    try {
      const usageSnap = await getDoc(usageRef);
      let currentCount = 0;
      if (usageSnap.exists()) currentCount = usageSnap.data()?.count || 0;
      if (currentCount >= AI_USAGE_DAILY_LIMIT) {
        setAiUsage({ count: currentCount, limitReached: true });
        toast({ title: 'Usage Limit Reached', description: `AI usage limit (${AI_USAGE_DAILY_LIMIT}/day) reached. Resets 6 AM local time.`, variant: 'default' });
        return { success: false, error: `AI usage limit (${AI_USAGE_DAILY_LIMIT}/day) reached.`, limitReached: true };
      }
      const newCount = currentCount + 1;
      if (!usageSnap.exists()) {
        await setDoc(usageRef, { count: newCount, lastUsed: Timestamp.now() });
      } else {
        await updateDoc(usageRef, { count: newCount, lastUsed: Timestamp.now() });
      }
      setAiUsage({ count: newCount, limitReached: newCount >= AI_USAGE_DAILY_LIMIT });
      return { success: true, limitReached: newCount >= AI_USAGE_DAILY_LIMIT };
    } catch (error: any) {
      let errorMessage = `AI usage update failed: ${error.message || "Unknown error"}`;
      if (error.message?.includes('PERMISSION_DENIED') || error.code === 'permission-denied') {
          errorMessage = "Permission denied to update AI usage. Check Firestore rules.";
      }
      console.error("[UploadPage DEBUG] clientIncrementAIUsage - Error:", error, "Message:", errorMessage);
      toast({ title: 'AI Usage Error', description: errorMessage, variant: 'destructive' });
      await fetchAIUsageOnClient();
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    const checkSubmissionStatusAndWindow = async () => {
      if (!user) return;
      const now = new Date();
      const submissionOpenTime = set(now, { hours: 6, minutes: 0, seconds: 0, milliseconds: 0 });
      const submissionCloseTime = set(now, { hours: 14, minutes: 55, seconds: 0, milliseconds: 0 });
      const currentSubmissionWindowOpen = isAfter(now, submissionOpenTime) && isBefore(now, submissionCloseTime);
      setIsSubmissionWindowOpen(currentSubmissionWindowOpen);
      const currentSubmissionNotYetOpen = isBefore(now, submissionOpenTime);
      setIsSubmissionNotYetOpen(currentSubmissionNotYetOpen);
      setTimeLeftToSubmissionOpen(submissionOpenTime.getTime() - now.getTime());
      setTimeLeftToSubmissionClose(submissionCloseTime.getTime() - now.getTime());
      fetchAIUsageOnClient();
      const todaysDateStr = toYYYYMMDD(now);
      const outfitsCollectionRef = collection(db, 'outfits');
      const q = query(outfitsCollectionRef, where('userId', '==', user.uid), where('leaderboardDate', '==', todaysDateStr));
      try {
        const querySnapshot = await getFirestoreDocs(q);
        setHasSubmittedToday(!querySnapshot.empty);
      } catch (error) {
        console.error("[UploadPage] Error checking for today's submission:", error);
        toast({ title: "Error", description: "Could not verify previous submissions.", variant: "destructive" });
      }
    };
    if (user) checkSubmissionStatusAndWindow();
    const interval = setInterval(() => { if (user) checkSubmissionStatusAndWindow(); }, 60000);
    return () => clearInterval(interval);
  }, [user, toast]); 

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setSelectedOutfitForDetails(null); // Clear selection if new image is chosen
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGetRating = async () => {
    if (!imageFile || !imagePreview || !user) {
      toast({ title: 'Missing information', description: 'Please select an image and ensure you are logged in.', variant: 'destructive' });
      return;
    }
    setIsProcessingAIRating(true);
    setSelectedOutfitForDetails(null);
    try {
      const incrementResult = await clientIncrementAIUsage();
      if (!incrementResult.success) {
        setIsProcessingAIRating(false);
        return; 
      }
      const imageFileName = `outfits/${user.uid}/${Date.now()}_${imageFile.name}`;
      const imageRef = ref(storage, imageFileName);
      await uploadString(imageRef, imagePreview, 'data_url');
      const uploadedOutfitImageURL = await getDownloadURL(imageRef);
      if (!uploadedOutfitImageURL) throw new Error("Failed to upload image or get download URL.");
      const aiProcessingResult = await processOutfitWithAI({ photoDataUri: imagePreview });

      if (aiProcessingResult.success && aiProcessingResult.data) {
        const newRatedOutfit: ProcessedOutfitClient = {
          ...aiProcessingResult.data,
          outfitImageURL: uploadedOutfitImageURL,
          submittedToLeaderboard: false,
          localId: Date.now().toString() + Math.random().toString(36).substring(2,9) // Unique local ID
        };
        setTodaysRatedOutfits(prev => [...prev, newRatedOutfit]);
        setImageFile(null);
        setImagePreview(null);
        toast({ title: 'AI Analysis Complete!', description: `Outfit rated ${aiProcessingResult.data.rating.toFixed(1)}/10. Ready for review.` });
      } else {
        toast({ title: 'AI Analysis Failed', description: aiProcessingResult.error || 'Unknown error during AI processing.', variant: 'destructive' });
      }
    } catch (error: any) {
      let errorMessage = error.message || 'An unexpected error occurred.';
      if (error.code === 'storage/unauthorized') errorMessage = "Permission denied to upload image. Check Storage rules.";
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsProcessingAIRating(false);
    }
  };

  const handleSelectOutfitForDetails = (outfit: ProcessedOutfitClient) => {
    setSelectedOutfitForDetails(outfit);
  };

  const handleSubmitToLeaderboard = async () => {
    if (!user || !userProfile || !selectedOutfitForDetails || !selectedOutfitForDetails.outfitImageURL) {
      toast({ title: 'Error', description: 'No outfit selected or missing data for submission.', variant: 'destructive'});
      return;
    }
     if (!selectedOutfitForDetails.isActualUserOutfit) {
      toast({ title: "Invalid Submission", description: selectedOutfitForDetails.validityCritique || "This outfit cannot be submitted due to AI validation.", variant: "destructive"});
      return;
    }
    if (hasSubmittedToday) {
      toast({ title: "Already Submitted", description: "You've already submitted an outfit today.", variant: "default"});
      return;
    }
    if (!isSubmissionWindowOpen) {
       toast({ title: "Submissions Closed", description: `Submissions are ${isSubmissionNotYetOpen ? `not open yet (opens in ${formatTimeLeft(timeLeftToSubmissionOpen)})` : 'closed for today.'}`, variant: "default"});
      return;
    }

    setIsSubmittingToLeaderboard(true);
    try {
      const leaderboardDateStr = toYYYYMMDD(new Date());
      const outfitsCollectionRef = collection(db, 'outfits');
      const outfitData = {
        userId: user.uid,
        username: userProfile.username,
        userPhotoURL: userProfile.customPhotoURL || userProfile.photoURL,
        outfitImageURL: selectedOutfitForDetails.outfitImageURL,
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
      setTodaysRatedOutfits(prevOutfits => 
        prevOutfits.map(o => o.localId === selectedOutfitForDetails.localId ? {...o, submittedToLeaderboard: true } : o)
      );
      setSelectedOutfitForDetails(prev => prev ? {...prev, submittedToLeaderboard: true} : null);


      const perksResult = await handleLeaderboardSubmissionPerks(user.uid, selectedOutfitForDetails.rating);
      if (perksResult.success) {
        toast({ title: 'Perks Updated!', description: perksResult.message || 'Points & badges processed.', duration: 2000});
        await refreshUserProfile();
      } else {
        toast({ title: 'Perks Error', description: perksResult.error, variant: 'destructive'});
      }

    } catch (error: any) {
      let errorMessage = 'Failed to submit to leaderboard.';
      if (error.code === 'permission-denied' || error.message?.toLowerCase().includes('permission denied')) {
          errorMessage = 'Permission denied to submit to leaderboard. Check Firestore security rules.';
      } else if (error.message) {
          errorMessage = error.message;
      }
      toast({ title: 'Submission Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSubmittingToLeaderboard(false);
    }
  };

  if (authLoading) {
     return <div className="flex justify-center items-center h-full p-4"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Loading...</span></div>;
  }

  const getRatingDisabled = !imageFile || isProcessingAIRating || aiUsage.limitReached;
  const imageInputDisabled = aiUsage.limitReached;

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl flex items-center"><UploadCloud className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8 text-primary" /> Upload Your Outfit</CardTitle>
          <CardDescription>Get feedback, then choose your best look for the leaderboard!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="outfitImage" className="text-base sm:text-lg">Outfit Photo</Label>
            <Input id="outfitImage" type="file" accept="image/*" onChange={handleImageChange} className="file:text-primary file:font-semibold" disabled={imageInputDisabled || isProcessingAIRating}/>
          </div>

          {imagePreview && (
            <div className="mt-3 sm:mt-4 border rounded-lg overflow-hidden shadow-md">
              <Image src={imagePreview} alt="Outfit preview" width={500} height={500} className="object-contain w-full h-auto max-h-[300px] sm:max-h-[400px]" data-ai-hint="fashion clothing"/>
            </div>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>AI Usage: {aiUsage.count}/{AI_USAGE_DAILY_LIMIT} Analyses Used Today</AlertTitle>
            <AlertDescription className="text-xs sm:text-sm">
              {aiUsage.limitReached ? `You've reached your daily AI analysis limit. Resets 6 AM local time.` : `Get up to ${AI_USAGE_DAILY_LIMIT} AI ratings per day (resets 6 AM local time).`}
            </AlertDescription>
          </Alert>

           {!hasSubmittedToday && isSubmissionNotYetOpen && timeLeftToSubmissionOpen > 0 && (
            <Alert variant="default" className="bg-secondary/50 border-secondary">
                <Clock className="h-4 w-4" />
                <AlertTitle>Submissions Open Soon</AlertTitle>
                <AlertDescription className="text-xs sm:text-sm">
                  Today's submission window (6 AM - 2:55 PM) for the leaderboard opens in: <span className="font-semibold">{formatTimeLeft(timeLeftToSubmissionOpen)}</span>.
                </AlertDescription>
            </Alert>
          )}

          {!hasSubmittedToday && !isSubmissionWindowOpen && !isSubmissionNotYetOpen && (
             <Alert variant="destructive">
                <Ban className="h-4 w-4" />
                <AlertTitle>Submissions Closed for Today</AlertTitle>
                <AlertDescription className="text-xs sm:text-sm">
                  The 2:55 PM deadline for today's leaderboard submissions has passed. Try again tomorrow from 6 AM!
                </AlertDescription>
            </Alert>
          )}

          {hasSubmittedToday && (
             <Alert variant="default" className="bg-secondary/50 border-secondary">
                <Ban className="h-4 w-4" />
                <AlertTitle>Submission Complete for Today</AlertTitle>
                <AlertDescription className="text-xs sm:text-sm">
                You've already submitted an outfit for today's leaderboard. Check back tomorrow!
                </AlertDescription>
            </Alert>
          )}

        </CardContent>
        <CardFooter>
          <Button onClick={handleGetRating} disabled={getRatingDisabled} className="w-full text-base sm:text-lg py-2.5 sm:py-3">
            {isProcessingAIRating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
            Get AI Rating & Suggestions
          </Button>
        </CardFooter>
      </Card>

      {todaysRatedOutfits.length > 0 && !selectedOutfitForDetails && (
        <Card className="shadow-xl md:col-span-2 animate-in fade-in duration-500">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">Today's Rated Outfits</CardTitle>
            <CardDescription>Review your outfits and choose one to submit to the daily leaderboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaysRatedOutfits.map((outfit) => (
              <Card key={outfit.localId} className={cn("p-4 flex flex-col sm:flex-row items-center gap-4", outfit.submittedToLeaderboard && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700")}>
                <Image src={outfit.outfitImageURL} alt="Rated outfit" width={80} height={80} className="rounded-md aspect-square object-cover border" data-ai-hint="fashion clothing thumbnail"/>
                <div className="flex-grow text-center sm:text-left">
                  <p className="text-2xl font-bold text-primary">{outfit.rating.toFixed(1)}<span className="text-lg text-muted-foreground">/10</span></p>
                  {!outfit.isActualUserOutfit && <p className="text-xs text-destructive mt-1">{outfit.validityCritique || "AI flagged this image."}</p>}
                </div>
                <Button 
                  onClick={() => handleSelectOutfitForDetails(outfit)} 
                  disabled={!outfit.isActualUserOutfit || outfit.submittedToLeaderboard}
                  variant={outfit.submittedToLeaderboard ? "ghost" : "default"}
                  className="w-full sm:w-auto"
                >
                  {outfit.submittedToLeaderboard ? <><Star className="mr-2 h-4 w-4 text-green-500 fill-green-500"/>Submitted!</> : <><Eye className="mr-2 h-4 w-4"/>Review & Prepare</>}
                </Button>
              </Card>
            ))}
             {hasSubmittedToday && (
                <Alert variant="default" className="mt-4 bg-green-50 dark:bg-green-800/30 border-green-600">
                    <ShieldAlert className="h-5 w-5 text-green-700 dark:text-green-400" />
                    <AlertTitle>Leaderboard Submission Sent!</AlertTitle>
                    <AlertDescription>
                        You've successfully submitted an outfit for today. Check the leaderboard later!
                    </AlertDescription>
                </Alert>
            )}
          </CardContent>
        </Card>
      )}
      
      {isProcessingAIRating && !selectedOutfitForDetails && todaysRatedOutfits.length === 0 && (
         <div className="md:col-span-1 flex flex-col items-center justify-center space-y-4 p-6 sm:p-8 bg-card rounded-lg shadow-xl min-h-[300px]">
            <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary" />
            <p className="text-lg sm:text-xl font-semibold text-foreground">Our AI is analyzing your style...</p>
            <Progress value={50} className="w-full" />
            <p className="text-xs sm:text-sm text-muted-foreground">This might take a few moments.</p>
        </div>
      )}


      {selectedOutfitForDetails && (
        <Card className="shadow-xl md:col-span-2 animate-in fade-in duration-500"> {/* Make it span 2 cols on md+ if it's the only card in this 'row' */}
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl flex items-center"><Sparkles className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8 text-accent" /> AI Feedback for Selected Outfit</CardTitle>
            <CardDescription>Here's what our fashion AI thinks. You can submit this one to the leaderboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">

            {selectedOutfitForDetails.validityCritique && !selectedOutfitForDetails.isActualUserOutfit && (
                <Alert variant="destructive" className="mt-4">
                    <ImageOff className="h-5 w-5" />
                    <AlertTitle>Image Validity Issue</AlertTitle>
                    <AlertDescription>{selectedOutfitForDetails.validityCritique}</AlertDescription>
                </Alert>
            )}

            <div className="text-center">
              <p className="text-5xl sm:text-6xl font-bold text-primary">{selectedOutfitForDetails.rating.toFixed(1)}<span className="text-2xl sm:text-3xl text-muted-foreground">/10</span></p>
              <div className="flex justify-center mt-1 sm:mt-2">
                {[...Array(10)].map((_, i) => (
                  <Star key={i} className={`h-6 w-6 sm:h-7 sm:w-7 ${i < Math.round(selectedOutfitForDetails.rating) ? 'text-accent fill-accent' : 'text-muted-foreground/50'}`} />
                ))}
              </div>
            </div>

            <Separator className="my-4 sm:my-6" />

            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 flex items-center"><MessageSquareQuote className="mr-2 h-5 w-5 text-primary"/>Stylist's Verdict:</h3>
              <p className="text-sm sm:text-base text-foreground/90 italic">{selectedOutfitForDetails.complimentOrCritique || "No specific verdict provided."}</p>
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 flex items-center"><Palette className="mr-2 h-5 w-5 text-primary"/>Color Suggestions:</h3>
              {selectedOutfitForDetails.colorSuggestions && selectedOutfitForDetails.colorSuggestions.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-sm sm:text-base text-foreground/90 pl-2">
                  {selectedOutfitForDetails.colorSuggestions.map((color, index) => <li key={index}>{color}</li>)}
                </ul>
              ): (<p className="text-sm sm:text-base text-muted-foreground">No specific color suggestions provided.</p>)}
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 flex items-center"><Shirt className="mr-2 h-5 w-5 text-primary"/>Look Suggestions:</h3>
              <p className="text-sm sm:text-base text-foreground/90">{selectedOutfitForDetails.lookSuggestions || "No specific look suggestions provided."}</p>
            </div>

            {selectedOutfitForDetails.outfitImageURL && (
                <div className="mt-3 sm:mt-4 border rounded-lg overflow-hidden shadow-inner">
                    <Image src={selectedOutfitForDetails.outfitImageURL} alt="Processed outfit" width={300} height={300} className="object-contain w-full h-auto max-h-[200px] sm:max-h-[250px]" data-ai-hint="fashion model"/>
                </div>
            )}
            
            <Button variant="outline" onClick={() => setSelectedOutfitForDetails(null)} className="w-full sm:w-auto">
                Back to Rated Outfits List
            </Button>


          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSubmitToLeaderboard}
              disabled={submitToLeaderboardButtonDisabled}
              className="w-full text-base sm:text-lg py-2.5 sm:py-3 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isSubmittingToLeaderboard ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
              {submitToLeaderboardButtonText}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}