
'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Shirt, LogIn, Info, CalendarCheck2, PlayCircle, Users, Loader2, HelpCircle, Sparkles, Star as StarIcon, Gift as GiftIcon, Flame, Badge, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, subDays, addDays, set, isBefore, isAfter, isToday } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';


const formatTimeLeft = (ms: number): string => {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const toYYYYMMDD = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export default function HomePage() {
  const { user, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  const [submissionStatusMessage, setSubmissionStatusMessage] = useState("Calculating...");
  const [isSubmissionWindowOpen, setIsSubmissionWindowOpen] = useState(false);
  
  const [leaderboardStatusMessage, setLeaderboardStatusMessage] = useState("Calculating...");
  const [isLeaderboardCurrentlyViewable, setIsLeaderboardCurrentlyViewable] = useState(false);
  const [currentLeaderboardDateForViewing, setCurrentLeaderboardDateForViewing] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);

    const calculateTimes = () => {
      const now = new Date();
      
      // Submission Window Logic (6 AM - 2 PM daily)
      const submissionOpenTimeToday = set(now, { hours: 6, minutes: 0, seconds: 0, milliseconds: 0 });
      const submissionCloseTimeToday = set(now, { hours: 14, minutes: 0, seconds: 0, milliseconds: 0 });
      
      const currentIsSubmissionWindowOpen = isAfter(now, submissionOpenTimeToday) && isBefore(now, submissionCloseTimeToday);
      setIsSubmissionWindowOpen(currentIsSubmissionWindowOpen);

      if (isBefore(now, submissionOpenTimeToday)) { 
        const timeLeft = submissionOpenTimeToday.getTime() - now.getTime();
        setSubmissionStatusMessage(`Submissions open daily 6 AM - 2 PM. Opens in: ${formatTimeLeft(timeLeft)}`);
      } else if (currentIsSubmissionWindowOpen) { 
        const timeLeft = submissionCloseTimeToday.getTime() - now.getTime();
        setSubmissionStatusMessage(`Submissions open! Closes in: ${formatTimeLeft(timeLeft)}`);
      } else { 
        const submissionOpenTimeTomorrow = set(addDays(now, 1), { hours: 6, minutes: 0, seconds: 0, milliseconds: 0 });
        const timeLeft = submissionOpenTimeTomorrow.getTime() - now.getTime();
        setSubmissionStatusMessage(`Submissions closed. Opens tomorrow at 6 AM (in ${formatTimeLeft(timeLeft)})`);
      }

      // Leaderboard Viewing Logic (Today's results: 3 PM today - 2 PM tomorrow)
      let dateWhoseLeaderboardIsRelevant: Date;
      if (isBefore(now, set(now, { hours: 15, minutes:0, seconds:0, milliseconds:0 }))) {
        // Before 3 PM today, we are interested in YESTERDAY's leaderboard
        dateWhoseLeaderboardIsRelevant = subDays(now, 1);
      } else {
        // At or after 3 PM today, we are interested in TODAY's leaderboard
        dateWhoseLeaderboardIsRelevant = new Date(now);
      }
      const relevantLeaderboardDateStr = toYYYYMMDD(dateWhoseLeaderboardIsRelevant);
      setCurrentLeaderboardDateForViewing(relevantLeaderboardDateStr);
      
      const releaseTimeForRelevantLeaderboard = set(dateWhoseLeaderboardIsRelevant, { hours: 15, minutes: 0, seconds: 0, milliseconds: 0 });
      const viewingEndTimeForRelevantLeaderboard = set(addDays(dateWhoseLeaderboardIsRelevant,1), { hours: 14, minutes: 0, seconds: 0, milliseconds: 0 });

      const isReleased = isAfter(now, releaseTimeForRelevantLeaderboard);
      const isStillViewable = isBefore(now, viewingEndTimeForRelevantLeaderboard);
      
      setIsLeaderboardCurrentlyViewable(isReleased && isStillViewable);

      if (!isReleased) { 
        const timeLeft = releaseTimeForRelevantLeaderboard.getTime() - now.getTime();
        setLeaderboardStatusMessage(`Results for ${format(dateWhoseLeaderboardIsRelevant, "MMM d")} release in: ${formatTimeLeft(timeLeft)} (at 3 PM)`);
      } else if (isReleased && isStillViewable) { 
        const timeLeftToCloseViewing = viewingEndTimeForRelevantLeaderboard.getTime() - now.getTime();
        setLeaderboardStatusMessage(`Results for ${format(dateWhoseLeaderboardIsRelevant, "MMM d")} are LIVE! Viewable until 2 PM tomorrow (for ${formatTimeLeft(timeLeftToCloseViewing)})`);
      } else { // After viewing for relevant day has closed
        // Default to showing countdown for today's leaderboard release if it hasn't happened yet, or tomorrow's if today's already passed.
        let nextRelevantDate = isToday(dateWhoseLeaderboardIsRelevant) && now.getHours() >= 15 ? addDays(now, 1) : new Date(now);
        if(isBefore(now, set(now, { hours: 14, minutes:0, seconds:0, milliseconds:0 })) && isToday(dateWhoseLeaderboardIsRelevant)) {
             // This case means it's before 2PM, we were looking at yesterday's. Now we look at today's release.
             nextRelevantDate = new Date(now);
        }

        const nextReleaseTime = set(nextRelevantDate, { hours: 15, minutes: 0, seconds: 0, milliseconds: 0 });
        const timeLeft = nextReleaseTime.getTime() - now.getTime();

        setLeaderboardStatusMessage(`Results for ${format(nextRelevantDate, "MMM d")} release in: ${formatTimeLeft(timeLeft)} (at 3 PM)`);
      }
    };

    calculateTimes();
    const interval = setInterval(calculateTimes, 1000);
    return () => clearInterval(interval);
  }, []);


  if (loading && !isClient) { 
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading LukuCheck...</p>
      </div>
    );
  }

  const faqs = [
    {
      question: "How often can I submit an outfit for AI rating?",
      answer: "You can get AI feedback on your outfits up to 5 times per day, as per your daily AI usage limit."
    },
    {
      question: "How do I earn LukuPoints?",
      answer: "You earn LukuPoints by: Signing up (5 points), adding your TikTok (1 pt) or Instagram (1 pt) links (once each), completing your profile with a custom photo and both social links ('Profile Pro' badge + 5 pts), your first leaderboard submission ('First Submission' badge + 3 pts), daily leaderboard submissions (1 pt for 'LukuStreak'), hitting LukuStreak milestones (e.g., 2 bonus pts for a 3-day streak, 5 bonus for a 7-day streak), and successfully referring 3 new stylists ('Referral Rockstar' badge + 10 pts)."
    },
    {
      question: "What are Badges?",
      answer: "Badges are special achievements! Earn them for: 'Profile Pro' (complete profile), 'First Submission', 'Referral Rockstar' (3 referrals), 'Streak Starter' (3-day streak), and 'Streak Keeper' (7-day streak)."
    },
    {
      question: "How does LukuStreak work?",
      answer: "Submit an outfit to the leaderboard for consecutive days to build your LukuStreak! You earn 1 LukuPoint for each day's submission in your streak, plus bonus points and badges at milestones like 3 and 7 days. If you miss a day, your streak resets."
    },
    {
      question: "When can I submit to the leaderboard?",
      answer: "The submission window is open daily from 6 AM to 2 PM. You can submit one outfit per day during this window."
    },
    {
      question: "When are leaderboard results posted?",
      answer: "Leaderboard results for a given day are released at 3 PM on that day. These results remain viewable until 2 PM the following day."
    },
    {
      question: "How is my outfit rated?",
      answer: "Our advanced AI analyzes your outfit based on various fashion principles, including color coordination, style suitability, and current trends, to provide a rating and personalized suggestions."
    }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container flex flex-col items-center text-center py-8 sm:py-12 md:py-10">
        <Shirt className="w-20 h-20 sm:w-24 sm:h-24 text-primary mb-6" />
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">Welcome</h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl">
          Get your outfits rated by AI, receive style suggestions, earn LukuPoints & Badges, and compete on the daily leaderboard.
        </p>
        
        {!user ? (
          <Link href="/login" passHref legacyBehavior>
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-base sm:text-lg">
              Get Started
            </Button>
          </Link>
        ) : (
           <Link href="/upload" passHref legacyBehavior>
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-base sm:text-lg">
              Rate Your Style
            </Button>
          </Link>
        )}

        {isClient && (
          <Card className="mt-10 max-w-2xl w-full shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center justify-center"><CalendarCheck2 className="mr-3 h-7 w-7 text-primary"/>Daily Challenge Cycle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <p className="text-sm text-muted-foreground px-2 text-center">
                Submissions: Daily <strong>6 AM - 3 PM</strong>.
                Leaderboard: Results released <strong>3 PM daily</strong> (viewable until <strong>2 PM next day</strong>).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card/50">
                  <h4 className="text-lg font-semibold flex items-center">
                    <PlayCircle className={`mr-2 h-5 w-5 ${isSubmissionWindowOpen ? 'text-green-500' : 'text-destructive'}`}/>
                    Outfit Submissions:
                  </h4>
                  <p className="text-sm sm:text-base font-medium">
                    {submissionStatusMessage}
                  </p>
                </div>
                <Link href="/leaderboard" passHref>
                  <div className="p-4 rounded-lg border bg-card/50 hover:bg-secondary/70 transition-colors cursor-pointer h-full flex flex-col justify-center">
                    <h4 className="text-lg font-semibold flex items-center">
                      <Users className={`mr-2 h-5 w-5 ${isLeaderboardCurrentlyViewable ? 'text-accent' : 'text-primary/70'}`}/>
                      Leaderboard:
                    </h4>
                    <p className="text-sm sm:text-base font-medium">{leaderboardStatusMessage}</p>
                  </div>
                </Link>
              </div>
              {isClient && isLeaderboardCurrentlyViewable && !user && currentLeaderboardDateForViewing && (
                <Alert variant="default" className="mt-4 bg-secondary/70">
                  <Info className="h-5 w-5" />
                  <AlertTitle>Leaderboard is Active!</AlertTitle>
                  <AlertDescription className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <span>Log in to view the top styles for {format(new Date(currentLeaderboardDateForViewing + 'T00:00:00Z'), "MMM d")}.</span>
                    <Link href="/login" passHref legacyBehavior>
                      <Button size="sm" className="mt-2 sm:mt-0 sm:ml-auto shrink-0">
                        <LogIn className="mr-2 h-4 w-4" /> Login to View
                      </Button>
                    </Link>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
        
        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full max-w-4xl">
          <div className="p-4 sm:p-6 rounded-lg shadow-lg border bg-card">
            <Sparkles className="w-8 h-8 text-accent mb-3" />
            <h3 className="text-xl sm:text-2xl font-semibold mb-2">Upload & Rate</h3>
            <p className="text-muted-foreground text-sm sm:text-base">Easily upload a photo of your outfit and let our AI provide an instant rating and feedback.</p>
          </div>
          <div className="p-4 sm:p-6 rounded-lg shadow-lg border bg-card">
             <StarIcon className="w-8 h-8 text-accent mb-3" />
            <h3 className="text-xl sm:text-2xl font-semibold mb-2">Earn LukuPoints & Badges</h3>
            <p className="text-muted-foreground text-sm sm:text-base">Gain points and unlock cool badges for profile completion, referrals, daily submissions, and streaks!</p>
          </div>
          <div className="p-4 sm:p-6 rounded-lg shadow-lg border bg-card">
            <Trophy className="w-8 h-8 text-accent mb-3" />
            <h3 className="text-xl sm:text-2xl font-semibold mb-2">Daily Leaderboard</h3>
            <p className="text-muted-foreground text-sm sm:text-base">Submit your best looks and see how you rank against others in the community.</p>
          </div>
        </div>

        <section className="mt-12 sm:mt-16 w-full max-w-3xl">
            <h2 className="text-3xl font-bold mb-6 flex items-center justify-center">
                <HelpCircle className="mr-3 h-8 w-8 text-primary"/>
                Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger 
                        className="text-lg hover:no-underline text-left justify-start gap-2 sm:justify-between"
                    >
                        {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-base text-muted-foreground text-left">
                    {faq.answer}
                    </AccordionContent>
                </AccordionItem>
                ))}
            </Accordion>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}

    
