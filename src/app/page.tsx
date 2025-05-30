
'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Shirt, LogIn, Info, CalendarCheck2, PlayCircle, Users, Loader2, HelpCircle, Sparkles, Star as StarIconProp, Trophy, Gift as GiftIcon, Flame, Badge as ProfileBadgeIcon, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, subDays, addDays, set, isBefore, isAfter, isToday, differenceInMilliseconds, isValid } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const formatTimeLeft = (ms: number): string => {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};


export default function HomePage() {
  const { user, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  const [submissionStatusMessage, setSubmissionStatusMessage] = useState("Calculating...");
  const [isSubmissionWindowOpen, setIsSubmissionWindowOpen] = useState(false);

  const [leaderboardStatusMessage, setLeaderboardStatusMessage] = useState("Calculating...");
  const [isLeaderboardReleasedForViewing, setIsLeaderboardReleasedForViewing] = useState(false);
  const [currentViewableLeaderboardDate, setCurrentViewableLeaderboardDate] = useState<Date | null>(null);


  useEffect(() => {
    setIsClient(true);

    const calculateTimes = () => {
      const now = new Date();

      // Submission Window Logic: 6:00 AM to 2:55 PM daily
      const submissionOpenTimeToday = set(now, { hours: 6, minutes: 0, seconds: 0, milliseconds: 0 });
      const submissionCloseTimeToday = set(now, { hours: 14, minutes: 55, seconds: 0, milliseconds: 0 });

      const currentIsSubmissionWindowOpen = isAfter(now, submissionOpenTimeToday) && isBefore(now, submissionCloseTimeToday);
      setIsSubmissionWindowOpen(currentIsSubmissionWindowOpen);

      if (isBefore(now, submissionOpenTimeToday)) {
        const timeLeft = differenceInMilliseconds(submissionOpenTimeToday, now);
        setSubmissionStatusMessage(`Submissions open 6 AM - 2:55 PM. Opens in: ${formatTimeLeft(timeLeft)}`);
      } else if (currentIsSubmissionWindowOpen) {
        const timeLeft = differenceInMilliseconds(submissionCloseTimeToday, now);
        setSubmissionStatusMessage(`Submissions open! Closes in: ${formatTimeLeft(timeLeft)}`);
      } else { // After 2:55 PM today
        const submissionOpenTimeTomorrow = set(addDays(now, 1), { hours: 6, minutes: 0, seconds: 0, milliseconds: 0 });
        const timeLeft = differenceInMilliseconds(submissionOpenTimeTomorrow, now);
        setSubmissionStatusMessage(`Submissions closed. Opens tomorrow at 6 AM (in ${formatTimeLeft(timeLeft)})`);
      }

      // Leaderboard Viewing Logic: Day D's LB: 3 PM on Day D - 2:55 PM on Day D+1
      let leaderboardDateToView: Date;
      const leaderboardViewingDeadlineToday = set(now, { hours: 14, minutes: 55, seconds: 0, milliseconds: 0 }); // 2:55 PM Today

      if (isBefore(now, leaderboardViewingDeadlineToday)) { // Before 2:55 PM today, we look at YESTERDAY's leaderboard.
        leaderboardDateToView = subDays(now, 1);
      } else { // At or after 2:55 PM today, we look at TODAY's leaderboard.
        leaderboardDateToView = new Date(now);
      }
      
      if (isValid(leaderboardDateToView)) {
        setCurrentViewableLeaderboardDate(leaderboardDateToView);
        const releaseTimeForDateToView = set(leaderboardDateToView, { hours: 15, minutes: 0, seconds: 0, milliseconds: 0 }); // 3 PM on its date
        const viewingEndTimeForDateToView = set(addDays(leaderboardDateToView, 1), { hours: 14, minutes: 55, seconds: 0, milliseconds: 0 }); // 2:55 PM the day AFTER

        const isReleased = isAfter(now, releaseTimeForDateToView);
        const isStillViewable = isBefore(now, viewingEndTimeForDateToView);
        
        setIsLeaderboardReleasedForViewing(isReleased && isStillViewable);

        if (!isReleased) { 
          const timeLeftToRelease = differenceInMilliseconds(releaseTimeForDateToView, now);
          setLeaderboardStatusMessage(`Results for ${format(leaderboardDateToView, "MMM d")} release in: ${formatTimeLeft(timeLeftToRelease)} (at 3 PM)`);
        } else if (isReleased && isStillViewable) { 
          const timeLeftToCloseViewing = differenceInMilliseconds(viewingEndTimeForDateToView, now);
          setLeaderboardStatusMessage(`Results for ${format(leaderboardDateToView, "MMM d")} are LIVE! Viewable for: ${formatTimeLeft(timeLeftToCloseViewing)} (until 2:55 PM next day)`);
        } else { 
            // This means we are past the viewing window for leaderboardDateToView.
            // We should be looking at the *next* day's leaderboard which isn't released yet.
            const nextDay = addDays(now, isAfter(now, releaseTimeForDateToView) ? 1 : 0);
            const nextReleaseTime = set(nextDay, { hours: 15, minutes: 0, seconds: 0, milliseconds: 0});

            if (isValid(nextDay)){
                const timeLeft = differenceInMilliseconds(nextReleaseTime, now);
                setLeaderboardStatusMessage(`Results for ${format(nextDay, "MMM d")} release in: ${formatTimeLeft(timeLeft)} (at 3 PM)`);
                setCurrentViewableLeaderboardDate(nextDay); // Update to show countdown for the correct upcoming date
                setIsLeaderboardReleasedForViewing(false);
            } else {
                setLeaderboardStatusMessage("Leaderboard status unavailable.");
            }
        }
      } else {
         setLeaderboardStatusMessage("Leaderboard date calculation error.");
         setCurrentViewableLeaderboardDate(null);
         setIsLeaderboardReleasedForViewing(false);
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
      answer: "You earn LukuPoints by: Signing up (5 pts), adding your TikTok (1 pt) or Instagram (1 pt) links (once each), completing your profile ('Profile Pro' badge + 5 pts), your first leaderboard submission ('First Submission' badge + 3 pts), daily leaderboard submissions for your LukuStreak (1 pt/day), hitting LukuStreak milestones (e.g., 3-day streak +2 bonus pts; 7-day streak +5 bonus pts), successfully referring 3 new stylists ('Referral Rockstar' badge + 10 bonus pts - each referral also gets you 2 pts), and for ranking in the Top 3 on the daily leaderboard (Rank 1: 5 pts, Rank 2: 3 pts, Rank 3: 2 pts - awarded on your next submission when perks are checked)."
    },
    {
      question: "What are Badges?",
      answer: (
        <div className="space-y-3">
          <p>Badges are special achievements for various milestones! You can earn:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li className="flex items-center gap-1.5"><ProfileBadgeIcon className="h-4 w-4 text-accent" /><strong>Profile Pro:</strong> Complete your profile with a custom photo and both social links.</li>
            <li className="flex items-center gap-1.5"><Award className="inline h-4 w-4 text-accent" /><strong>First Submission:</strong> Submit your first outfit to the leaderboard.</li>
            <li className="flex items-center gap-1.5"><GiftIcon className="inline h-4 w-4 text-accent" /><strong>Referral Rockstar:</strong> Successfully refer 3 new stylists.</li>
            <li className="flex items-center gap-1.5"><Flame className="inline h-4 w-4 text-red-500" /><strong>Streak Starter (3 Days):</strong> Submit outfits for 3 consecutive days.</li>
            <li className="flex items-center gap-1.5"><Flame className="inline h-4 w-4 text-orange-500" /><strong>Streak Keeper (7 Days):</strong> Submit outfits for 7 consecutive days.</li>
            <li className="flex items-center gap-1.5"><Trophy className="inline h-4 w-4 text-yellow-500" /><strong>Top 3 Finisher:</strong> Achieve a Top 3 rank on the daily leaderboard.</li>
          </ul>
          <p className="mt-2">Additionally, you'll earn tiered Luku Badges displayed next to your name as you accumulate LukuPoints, showcasing your status (starting from 20 points):</p>
          <ul className="list-none space-y-1.5 pl-2">
            <li className="flex items-center gap-2"><StarIconProp className="h-4 w-4 text-yellow-600 fill-yellow-600" /> <strong>Luku Bronze:</strong> 20-49 LukuPoints</li>
            <li className="flex items-center gap-2"><StarIconProp className="h-4 w-4 text-slate-400 fill-slate-400" /> <strong>Luku Silver:</strong> 50-99 LukuPoints</li>
            <li className="flex items-center gap-2"><StarIconProp className="h-4 w-4 text-yellow-400 fill-yellow-400" /> <strong>Luku Gold:</strong> 100-249 LukuPoints</li>
            <li className="flex items-center gap-2"><Award className="h-4 w-4 text-sky-500 fill-sky-500" /> <strong>Luku Legend:</strong> 250+ LukuPoints</li>
          </ul>
        </div>
      )
    },
    {
      question: "How does LukuStreak work?",
      answer: "Submit an outfit to the leaderboard for consecutive days to build your LukuStreak! You earn 1 LukuPoint for each day's submission in your streak, plus bonus points and badges at milestones like 3 and 7 days. If you miss a day, your streak resets to 0, but if you submit again, it will start from 1."
    },
    {
      question: "When can I submit to the leaderboard?",
      answer: "The submission window is open daily from 6 AM to 2:55 PM. You can submit one outfit per day during this window."
    },
    {
      question: "When are leaderboard results posted?",
      answer: "Leaderboard results for a given day are released at 3 PM on that day. These results remain viewable until 2:55 PM the following day."
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
        <Image
            src="https://img.freepik.com/free-psd/fashion-store-banner-template-with-photo_23-2148645320.jpg"
            alt="Fashionable outfit collage"
            width={800}
            height={400}
            className="rounded-lg shadow-xl mb-8 object-cover w-full max-w-4xl aspect-[2/1]"
            data-ai-hint="fashion collage lifestyle"
            priority
        />
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">Welcome!</h1>
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
                Submissions: Daily <strong>6 AM - 2:55 PM</strong>.
                Leaderboard: Results released <strong>3 PM daily</strong> (viewable until <strong>2:55 PM next day</strong>).
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
                <Link href="/leaderboard" passHref className="h-full">
                  <div className="p-4 rounded-lg border bg-card/50 hover:bg-secondary/70 transition-colors cursor-pointer h-full flex flex-col justify-center">
                    <h4 className="text-lg font-semibold flex items-center">
                      <Users className={`mr-2 h-5 w-5 ${isLeaderboardReleasedForViewing ? 'text-accent' : 'text-primary/70'}`}/>
                      Leaderboard:
                    </h4>
                    <p className="text-sm sm:text-base font-medium">{leaderboardStatusMessage}</p>
                  </div>
                </Link>
              </div>
              {isClient && isLeaderboardReleasedForViewing && !user && currentViewableLeaderboardDate && (
                <Alert variant="default" className="mt-4 bg-secondary/70">
                  <Info className="h-5 w-5" />
                  <AlertTitle>Leaderboard is Active!</AlertTitle>
                  <AlertDescription className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <span>Log in to view the top styles for {format(currentViewableLeaderboardDate, "MMM d")}.</span>
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
             <StarIconProp className="w-8 h-8 text-accent mb-3" />
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
                    {typeof faq.answer === 'string' ? <p>{faq.answer}</p> : faq.answer}
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
