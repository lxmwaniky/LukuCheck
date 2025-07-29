
'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Shirt, LogIn, Info, CalendarCheck2, PlayCircle, Users as UsersIconProp, Loader2, HelpCircle, Sparkles, Star as StarIconProp, Trophy, Gift as GiftIcon, Flame, BadgeCheck, Users, ShieldCheck as LegendIcon, Award, UploadCloud, Send, BarChart3, Coins, User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, subDays, addDays, set, isBefore, isAfter, differenceInMilliseconds, isValid } from 'date-fns';
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

      const submissionOpenTimeToday = set(now, { hours: 6, minutes: 0, seconds: 0, milliseconds: 0 });
      const submissionCloseTimeToday = set(now, { hours: 20, minutes: 0, seconds: 0, milliseconds: 0 }); // 8 PM

      const currentIsSubmissionWindowOpen = isAfter(now, submissionOpenTimeToday) && isBefore(now, submissionCloseTimeToday);
      setIsSubmissionWindowOpen(currentIsSubmissionWindowOpen);

      if (isBefore(now, submissionOpenTimeToday)) {
        const timeLeft = differenceInMilliseconds(submissionOpenTimeToday, now);
        setSubmissionStatusMessage(`Submissions Open In: ${formatTimeLeft(timeLeft)}`);
      } else if (currentIsSubmissionWindowOpen) {
        const timeLeft = differenceInMilliseconds(submissionCloseTimeToday, now);
        setSubmissionStatusMessage(`Submissions LIVE! Closes In: ${formatTimeLeft(timeLeft)}`);
      } else {
        const submissionOpenTimeTomorrow = set(addDays(now, 1), { hours: 6, minutes: 0, seconds: 0, milliseconds: 0 });
        const timeLeft = differenceInMilliseconds(submissionOpenTimeTomorrow, now);
        setSubmissionStatusMessage(`Opens tomorrow in ${formatTimeLeft(timeLeft)}`);
      }

      let leaderboardDateToView: Date;
      // Leaderboard for day X is released at 8:30 PM on day X.
      // It's viewable until 8:00 PM on day X+1.
      // If it's before 8:25 PM on day X, we should be trying to view day X-1's results (if released).
      // If it's after 8:25 PM on day X, we should be trying to view day X's results.
      const leaderboardReleaseAndViewingCutoff = set(now, { hours: 20, minutes: 25, seconds: 0, milliseconds: 0 }); // 8:25 PM

      if (isBefore(now, leaderboardReleaseAndViewingCutoff)) {
        leaderboardDateToView = subDays(now, 1); // Attempt to view previous day's results
      } else {
        leaderboardDateToView = new Date(now); // Attempt to view current day's results
      }

      if (isValid(leaderboardDateToView)) {
        setCurrentViewableLeaderboardDate(leaderboardDateToView);
        const releaseTimeForDateToView = set(leaderboardDateToView, { hours: 20, minutes: 30, seconds: 0, milliseconds: 0 }); // 8:30 PM release
        const viewingEndTimeForDateToView = set(addDays(leaderboardDateToView, 1), { hours: 20, minutes: 0, seconds: 0, milliseconds: 0 }); // Viewable until 8 PM next day

        const isReleased = isAfter(now, releaseTimeForDateToView);
        const isStillViewable = isBefore(now, viewingEndTimeForDateToView);

        setIsLeaderboardReleasedForViewing(isReleased && isStillViewable);

        if (!isReleased) {
          const timeLeftToRelease = differenceInMilliseconds(releaseTimeForDateToView, now);
          setLeaderboardStatusMessage(`${format(leaderboardDateToView, "MMM d")} Results Release In: ${formatTimeLeft(timeLeftToRelease)}`);
        } else if (isReleased && isStillViewable) {
          const timeLeftToCloseViewing = differenceInMilliseconds(viewingEndTimeForDateToView, now);
          setLeaderboardStatusMessage(`${format(leaderboardDateToView, "MMM d")} Results LIVE! Viewable For: ${formatTimeLeft(timeLeftToCloseViewing)}`);
        } else { // Results for 'leaderboardDateToView' are no longer viewable or not yet released in a way that fits the current time window.
                 // This implies we should look at the *next* day's upcoming results.
            const nextDayCandidate = addDays(leaderboardDateToView, 1); // This will be the next logical day to show results for
            const nextReleaseTime = set(nextDayCandidate, { hours: 20, minutes: 30, seconds: 0, milliseconds: 0});

            if (isValid(nextDayCandidate)){
                const timeLeft = differenceInMilliseconds(nextReleaseTime, now);
                setLeaderboardStatusMessage(`${format(nextDayCandidate, "MMM d")} Results Release In: ${formatTimeLeft(timeLeft)}`);
                setCurrentViewableLeaderboardDate(nextDayCandidate); // Update the date we are targeting
                setIsLeaderboardReleasedForViewing(false); // It's for the future
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
      question: "What are the daily challenge times?",
      answer: (
        <div>
          <p>The daily style challenge runs on the following schedule:</p>
          <ul className="list-disc list-inside pl-2 space-y-1 mt-1 text-sm">
            <li><strong>AI Rating Credits Reset:</strong> 6:00 AM daily.</li>
            <li><strong>Outfit Submission Window:</strong> 6:00 AM - 8:00 PM daily.</li>
            <li><strong>Leaderboard Results Release:</strong> 8:30 PM daily.</li>
            <li><strong>Leaderboard Viewable Until:</strong> 8:00 PM the following day.</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-1">(All times are based on your local server environment time.)</p>
        </div>
      )
    },
    {
      question: "How often can I submit an outfit for AI rating?",
      answer: (
        <div>
          <p>All users can get AI feedback on up to <strong>2 outfits per day</strong>.</p>
          <p className="text-xs text-muted-foreground mt-1">Daily AI usage limits reset at 6:00 AM local time.</p>
        </div>
      )
    },
    {
      question: "What makes LukuCheck awesome?",
      answer: (
        <div className="space-y-2">
          <p>LukuCheck is your ultimate style battlefield and playground:</p>
          <ul className="list-disc list-inside pl-2 space-y-1 text-sm">
            <li><strong className="text-accent">Brutally Honest AI Ratings:</strong> Get instant scores & electrifying suggestions for your outfits.</li>
            <li><strong className="text-accent">Daily Style Showdown:</strong> Conquer the leaderboard and bask in fashion glory.</li>
            <li><strong className="text-accent">Epic LukuPoints & Badges:</strong> Rack up rewards for your style prowess and achievements.</li>
            <li><strong className="text-accent">Ignite Your LukuStreak:</strong> Keep the submission fire burning for bonus points & bragging rights!</li>
          </ul>
           <p className="text-sm">We're constantly brewing new ways to make your style journey legendary!</p>
        </div>
      )
    },
    {
      question: "How do I become a LukuLegend (earn LukuPoints)?",
      answer: (
        <div className="space-y-1">
          <p>Stack LukuPoints and ascend to legend status:</p>
          <ul className="list-disc list-inside pl-2 space-y-0.5 text-sm">
            <li>Instant <strong>5 points</strong> for signing up!</li>
            <li>Link TikTok: <strong>1 point</strong>. Link Instagram: <strong>1 point</strong>.</li>
            <li>"Profile Pro" Badge (photo & social links): <strong>5 points</strong> bonus!</li>
            <li>"First Submission" Badge: <strong>3 points</strong> for your leaderboard debut.</li>
            <li>Daily LukuStreak submission: <strong>1 point/day</strong>.</li>
            <li>"Perfect Score" Badge (10/10 AI rating): <strong>5 points</strong> (once).</li>
            <li>3-Day LukuStreak ("Streak Starter"): <strong>2 bonus points</strong>.</li>
            <li>7-Day LukuStreak ("Streak Keeper"): <strong>5 bonus points</strong>.</li>
            <li>Refer a stylist: <strong>2 points</strong> each.</li>
            <li>"Referral Rockstar" (3 referrals): <strong>10 bonus points</strong>!</li>
            <li>Dominate the Top 3 (awarded next day):
                <ul className="list-circle list-inside pl-4">
                    <li>Rank 1: <strong>5 points</strong></li>
                    <li>Rank 2: <strong>3 points</strong></li>
                    <li>Rank 3: <strong>2 points</strong></li>
                </ul>
            </li>
          </ul>
        </div>
      )
    },
    {
      question: "What are Badges? Show me the bling!",
      answer: (
        <div className="space-y-3">
          <p>Badges are your symbols of style supremacy and dedication!</p>
          <p className="font-semibold">Achievement Badges (visible on your profile):</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-sm">
            <li className="flex items-center gap-1.5"><UserIcon className="h-4 w-4 text-accent" /><strong>Profile Pro:</strong> Master your profile with custom photo & social links.</li>
            <li className="flex items-center gap-1.5"><Award className="inline h-4 w-4 text-accent" /><strong>First Submission:</strong> Your epic first step onto the leaderboard.</li>
            <li className="flex items-center gap-1.5"><GiftIcon className="inline h-4 w-4 text-accent" /><strong>Referral Rockstar:</strong> The ultimate connector—3 successful referrals!</li>
            <li className="flex items-center gap-1.5"><Flame className="inline h-4 w-4 text-red-500" /><strong>Streak Starter:</strong> 3 days of unstoppable style submissions.</li>
            <li className="flex items-center gap-1.5"><Flame className="inline h-4 w-4 text-orange-500" /><strong>Streak Keeper:</strong> 7 days of fashion fire!</li>
            <li className="flex items-center gap-1.5"><Trophy className="inline h-4 w-4 text-yellow-500" /><strong>Top 3 Finisher:</strong> You conquered the daily elite!</li>
            <li className="flex items-center gap-1.5"><StarIconProp className="inline h-4 w-4 text-accent" /><strong>Perfect Score:</strong> The AI bowed down—a flawless 10/10!</li>
            <li className="flex items-center gap-1.5"><Users className="inline h-4 w-4 text-accent" /><strong>Century Club:</strong> 100 LukuPoints of pure style.</li>
            <li className="flex items-center gap-1.5"><LegendIcon className="inline h-4 w-4 text-accent" /><strong>Legend Status:</strong> 250+ LukuPoints—you're a style icon!</li>
          </ul>
          <p className="mt-2 font-semibold">Luku Tier Badges (your rank flair, shown by your name):</p>
          <ul className="list-none space-y-1.5 pl-2 text-sm">
            <li className="flex items-center gap-2"><StarIconProp className="h-4 w-4 text-yellow-600 fill-yellow-600" /> <strong>Luku Bronze:</strong> 20-49 LukuPoints - Style Spark</li>
            <li className="flex items-center gap-2"><StarIconProp className="h-4 w-4 text-slate-400 fill-slate-400" /> <strong>Luku Silver:</strong> 50-99 LukuPoints - Fashion Forward</li>
            <li className="flex items-center gap-2"><StarIconProp className="h-4 w-4 text-yellow-400 fill-yellow-400" /> <strong>Luku Gold:</strong> 100-249 LukuPoints - Trendsetter Titan</li>
            <li className="flex items-center gap-2"><Award className="h-4 w-4 text-sky-500 fill-sky-500" /> <strong>Luku Legend:</strong> 250+ LukuPoints - Style Deity</li>
          </ul>
        </div>
      )
    },
    {
      question: "How does LukuStreak work?",
      answer: "Submit an outfit to the leaderboard for consecutive days to build your LukuStreak! You earn 1 LukuPoint for each day's submission in your streak, plus bonus points and badges at milestones like 3 and 7 days. Miss a day? Your streak resets, but you can always ignite a new one!"
    },
    {
      question: "How is my outfit rated?",
      answer: "Our cutting-edge AI scrutinizes your outfit like a top fashion critic, analyzing color harmony, style coherence, trend relevance, and overall impact to deliver a precise rating and actionable suggestions."
    }
  ];

  const gameplaySteps = [
    {
      icon: UploadCloud,
      title: "Upload Your Masterpiece",
      description: "Got a killer look? Snap it, upload it, and let the AI work its magic."
    },
    {
      icon: Sparkles,
      title: "AI Verdict: Hot or Not?",
      description: "Our AI gives your outfit a score (0-10) and spills the tea with color, look suggestions, plus a brutally honest critique. Get 2 free AI ratings daily!"
    },
    {
      icon: Send,
      title: "Enter the Arena",
      description: "Confident? Submit your AI-rated look to the daily leaderboard. Window: 6 AM - 8 PM daily."
    },
    {
      icon: BarChart3,
      title: "Claim Your Rank",
      description: "Results drop at 8:30 PM daily! See where you stand and scope out the competition."
    },
    {
      icon: Coins,
      title: "Rewards & Recognition",
      description: "Amass LukuPoints for submissions, streaks, referrals, & top ranks. Unlock exclusive badges and become a LukuLegend!"
    }
  ];

  return (
    <>
      <SiteHeader />
      <main className="flex-1 container flex flex-col items-center text-center py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary/80 py-2">
                Is Your Outfit a 10/10? Prove It!
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Get Instant AI Fashion Feedback, Conquer the Daily Style Challenge, and Rise as a LukuCheck Legend! ✨ Free ratings, fierce competition.
            </p>

            {!user ? (
            <Link href="/login" passHref legacyBehavior>
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-base sm:text-lg px-10 py-3.5 rounded-lg shadow-lg transition-transform hover:scale-105 transform active:scale-95">
                 Join the Style Off! <Sparkles className="ml-2 h-5 w-5" />
                </Button>
            </Link>
            ) : (
            <Link href="/upload" passHref legacyBehavior>
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-base sm:text-lg px-10 py-3.5 rounded-lg shadow-lg transition-transform hover:scale-105 transform active:scale-95">
                 Rate My Look Now! <Sparkles className="ml-2 h-5 w-5" />
                </Button>
            </Link>
            )}
        </div>

        {isClient && (
          <Card className="mt-10 mb-12 sm:mb-16 max-w-3xl w-full shadow-xl rounded-xl border-primary/20">
            <CardHeader className="bg-primary/5 rounded-t-xl">
              <CardTitle className="text-2xl sm:text-3xl flex items-center justify-center text-primary">
                <CalendarCheck2 className="mr-3 h-7 w-7 sm:h-8 sm:w-8"/>Daily Challenge Cycle
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-center pt-1">
                Submissions: Daily <strong>6 AM - 8 PM</strong>.
                Leaderboard Results: <strong>8:30 PM daily</strong> (viewable until <strong>8 PM next day</strong>).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border-2 border-dashed border-primary/30 bg-card hover:shadow-md transition-shadow">
                  <h4 className="text-lg font-semibold flex items-center mb-1">
                    <PlayCircle className={`mr-2 h-5 w-5 ${isSubmissionWindowOpen ? 'text-green-500 animate-pulse' : 'text-destructive'}`}/>
                    Outfit Submissions:
                  </h4>
                  <p className="text-sm sm:text-base font-medium">
                    {submissionStatusMessage}
                  </p>
                </div>
                <Link href="/leaderboard" passHref className="h-full block group">
                  <div className="p-4 rounded-lg border-2 border-dashed border-accent/30 bg-card hover:shadow-md transition-shadow h-full flex flex-col justify-center group-hover:border-accent">
                    <h4 className="text-lg font-semibold flex items-center mb-1">
                      <UsersIconProp className={`mr-2 h-5 w-5 ${isLeaderboardReleasedForViewing ? 'text-accent' : 'text-muted-foreground'}`}/>
                      Leaderboard:
                    </h4>
                    <p className="text-sm sm:text-base font-medium">{leaderboardStatusMessage}</p>
                  </div>
                </Link>
              </div>
              {isClient && isLeaderboardReleasedForViewing && !user && currentViewableLeaderboardDate && (
                <Alert variant="default" className="mt-4 bg-secondary/50 border-secondary">
                  <Info className="h-5 w-5 text-secondary-foreground" />
                  <AlertTitle className="font-semibold">Leaderboard is Active!</AlertTitle>
                  <AlertDescription className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
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

        <section className="my-12 sm:my-16 w-full max-w-5xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8 sm:mb-10 flex items-center justify-center">
                <Shirt className="mr-3 h-8 w-8 sm:h-9 sm:w-9 text-primary"/>
                How LukuCheck Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {gameplaySteps.map((step, index) => (
                    <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl flex flex-col text-left bg-card hover:bg-primary/5">
                        <CardHeader className="items-start">
                            <div className="p-3 rounded-full bg-accent/10 mb-3 inline-block ring-2 ring-accent/30">
                                <step.icon className="w-8 h-8 text-accent" />
                            </div>
                            <CardTitle className="text-xl sm:text-2xl">{step.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-muted-foreground text-sm sm:text-base">{step.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>

        <section className="my-12 sm:my-16 w-full max-w-3xl">
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 sm:p-8 border border-primary/20">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                        Meet the Creator
                    </h2>
                    <p className="text-base sm:text-lg text-muted-foreground">
                        LukuCheck was created by{' '}
                        <Link href="/about-alex-nyambura" className="font-semibold text-primary hover:underline underline-offset-4">
                            Alex Nyambura
                        </Link>
                        , a passionate software developer who combines cutting-edge AI technology with fashion community building.
                    </p>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Alex's vision: Democratize fashion feedback through technology and create a supportive community where everyone can improve their style.
                    </p>
                    <Link href="/about-alex-nyambura" passHref legacyBehavior>
                        <Button variant="outline" size="sm" className="mt-4">
                            Learn More About Alex
                        </Button>
                    </Link>
                </div>
            </div>
        </section>

        <section className="my-12 sm:my-16 w-full max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8 sm:mb-10 flex items-center justify-center">
                <HelpCircle className="mr-3 h-8 w-8 sm:h-9 sm:w-9 text-primary"/>
                Your Questions Answered
            </h2>
            <Accordion type="single" collapsible className="w-full bg-card p-4 sm:p-6 rounded-xl shadow-lg border border-primary/10">
                {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index} className="border-b border-primary/10 last:border-b-0">
                    <AccordionTrigger
                        className="text-lg sm:text-xl hover:no-underline text-left justify-between py-4 sm:py-5 font-medium text-foreground hover:text-primary"
                    >
                        {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-base text-muted-foreground text-left pb-4 sm:pb-5 pl-1 pr-1">
                    {typeof faq.answer === 'string' ? <p>{faq.answer}</p> : faq.answer}
                    </AccordionContent>
                </AccordionItem>
                ))}
            </Accordion>
        </section>

      </main>
      <SiteFooter />
    </>
  );
}
