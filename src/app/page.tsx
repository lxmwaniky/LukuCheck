
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
      const submissionCloseTimeToday = set(now, { hours: 14, minutes: 55, seconds: 0, milliseconds: 0 });

      const currentIsSubmissionWindowOpen = isAfter(now, submissionOpenTimeToday) && isBefore(now, submissionCloseTimeToday);
      setIsSubmissionWindowOpen(currentIsSubmissionWindowOpen);

      if (isBefore(now, submissionOpenTimeToday)) {
        const timeLeft = differenceInMilliseconds(submissionOpenTimeToday, now);
        setSubmissionStatusMessage(`Opens in: ${formatTimeLeft(timeLeft)}`);
      } else if (currentIsSubmissionWindowOpen) {
        const timeLeft = differenceInMilliseconds(submissionCloseTimeToday, now);
        setSubmissionStatusMessage(`Submissions Open! Closes in: ${formatTimeLeft(timeLeft)}`);
      } else {
        const submissionOpenTimeTomorrow = set(addDays(now, 1), { hours: 6, minutes: 0, seconds: 0, milliseconds: 0 });
        const timeLeft = differenceInMilliseconds(submissionOpenTimeTomorrow, now);
        setSubmissionStatusMessage(`Opens tomorrow in ${formatTimeLeft(timeLeft)}`);
      }

      let leaderboardDateToView: Date;
      const leaderboardViewingDeadlineToday = set(now, { hours: 14, minutes: 55, seconds: 0, milliseconds: 0 });

      if (isBefore(now, leaderboardViewingDeadlineToday)) {
        leaderboardDateToView = subDays(now, 1);
      } else {
        leaderboardDateToView = new Date(now);
      }

      if (isValid(leaderboardDateToView)) {
        setCurrentViewableLeaderboardDate(leaderboardDateToView);
        const releaseTimeForDateToView = set(leaderboardDateToView, { hours: 15, minutes: 0, seconds: 0, milliseconds: 0 });
        const viewingEndTimeForDateToView = set(addDays(leaderboardDateToView, 1), { hours: 14, minutes: 55, seconds: 0, milliseconds: 0 });

        const isReleased = isAfter(now, releaseTimeForDateToView);
        const isStillViewable = isBefore(now, viewingEndTimeForDateToView);

        setIsLeaderboardReleasedForViewing(isReleased && isStillViewable);

        if (!isReleased) {
          const timeLeftToRelease = differenceInMilliseconds(releaseTimeForDateToView, now);
          setLeaderboardStatusMessage(`${format(leaderboardDateToView, "MMM d")} results release in: ${formatTimeLeft(timeLeftToRelease)}`);
        } else if (isReleased && isStillViewable) {
          const timeLeftToCloseViewing = differenceInMilliseconds(viewingEndTimeForDateToView, now);
          setLeaderboardStatusMessage(`${format(leaderboardDateToView, "MMM d")} results LIVE! Viewable for: ${formatTimeLeft(timeLeftToCloseViewing)}`);
        } else {
            const nextDayCandidate = isAfter(now, viewingEndTimeForDateToView) ? addDays(leaderboardDateToView, 1) : leaderboardDateToView;
            const nextReleaseTime = set(nextDayCandidate, { hours: 15, minutes: 0, seconds: 0, milliseconds: 0});

            if (isValid(nextDayCandidate)){
                const timeLeft = differenceInMilliseconds(nextReleaseTime, now);
                setLeaderboardStatusMessage(`${format(nextDayCandidate, "MMM d")} results release in: ${formatTimeLeft(timeLeft)}`);
                setCurrentViewableLeaderboardDate(nextDayCandidate);
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
      answer: (
        <div>
          <p>All users can get AI feedback on up to <strong>2 outfits per day</strong>.</p>
          <p className="text-xs text-muted-foreground mt-1">Daily AI usage limits reset at 6 AM local time.</p>
        </div>
      )
    },
    {
      question: "What are the benefits of LukuCheck?",
      answer: (
        <div className="space-y-2">
          <p>LukuCheck offers a fun way to get AI-powered style feedback and engage with a community:</p>
          <ul className="list-disc list-inside pl-2 space-y-1 text-sm">
            <li><strong className="text-accent">AI Outfit Ratings:</strong> Get scores and suggestions for your outfits.</li>
            <li><strong className="text-accent">Daily Leaderboard:</strong> Compete with others and see top styles.</li>
            <li><strong className="text-accent">LukuPoints & Badges:</strong> Earn rewards for participation and achievements.</li>
            <li><strong className="text-accent">LukuStreak:</strong> Build your submission streak for extra points.</li>
          </ul>
           <p className="text-sm">We are always looking to improve and add more features in the future!</p>
        </div>
      )
    },
    {
      question: "How do I earn LukuPoints?",
      answer: (
        <div className="space-y-1">
          <p>You earn LukuPoints for various activities:</p>
          <ul className="list-disc list-inside pl-2 space-y-0.5 text-sm">
            <li>Signing up: <strong>5 points</strong></li>
            <li>Adding your TikTok link (once): <strong>1 point</strong></li>
            <li>Adding your Instagram link (once): <strong>1 point</strong></li>
            <li>Completing your profile (photo & social links for "Profile Pro" badge): <strong>5 points</strong></li>
            <li>First leaderboard submission ("First Submission" badge): <strong>3 points</strong></li>
            <li>Daily leaderboard submission for your LukuStreak: <strong>1 point/day</strong></li>
            <li>Achieving a 10/10 AI rating ("Perfect Score" badge, once): <strong>5 points</strong></li>
            <li>3-Day LukuStreak ("Streak Starter" badge): <strong>2 bonus points</strong></li>
            <li>7-Day LukuStreak ("Streak Keeper" badge): <strong>5 bonus points</strong></li>
            <li>Referring a new stylist (per verified referral): <strong>2 points</strong></li>
            <li>Referring 3 new stylists ("Referral Rockstar" badge): <strong>10 bonus points</strong></li>
            <li>Ranking Top 3 on daily leaderboard (awarded next day):
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
      question: "What are Badges?",
      answer: (
        <div className="space-y-3">
          <p>Badges are special achievements for various milestones and statuses!</p>
          <p className="font-semibold">Achievement Badges:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-sm">
            <li className="flex items-center gap-1.5"><UserIcon className="h-4 w-4 text-accent" /><strong>Profile Pro:</strong> Complete your profile with a custom photo and both social links.</li>
            <li className="flex items-center gap-1.5"><Award className="inline h-4 w-4 text-accent" /><strong>First Submission:</strong> Submit your first outfit to the leaderboard.</li>
            <li className="flex items-center gap-1.5"><GiftIcon className="inline h-4 w-4 text-accent" /><strong>Referral Rockstar:</strong> Successfully refer 3 new stylists.</li>
            <li className="flex items-center gap-1.5"><Flame className="inline h-4 w-4 text-red-500" /><strong>Streak Starter (3 Days):</strong> Submit outfits for 3 consecutive days.</li>
            <li className="flex items-center gap-1.5"><Flame className="inline h-4 w-4 text-orange-500" /><strong>Streak Keeper (7 Days):</strong> Submit outfits for 7 consecutive days.</li>
            <li className="flex items-center gap-1.5"><Trophy className="inline h-4 w-4 text-yellow-500" /><strong>Top 3 Finisher:</strong> Achieve a Top 3 rank on the daily leaderboard.</li>
            <li className="flex items-center gap-1.5"><StarIconProp className="inline h-4 w-4 text-accent" /><strong>Perfect Score:</strong> Achieve a 10/10 AI rating on an outfit.</li>
            <li className="flex items-center gap-1.5"><Users className="inline h-4 w-4 text-accent" /><strong>Century Club:</strong> Earn 100 LukuPoints!</li>
            <li className="flex items-center gap-1.5"><LegendIcon className="inline h-4 w-4 text-accent" /><strong>Legend Status:</strong> Reach 250 LukuPoints - truly legendary!</li>
          </ul>
          <p className="mt-2 font-semibold">Luku Tier Badges (shown next to your name):</p>
          <ul className="list-none space-y-1.5 pl-2 text-sm">
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

  const gameplaySteps = [
    {
      icon: UploadCloud,
      title: "Upload Your Look",
      description: "Snap a photo of your outfit and easily upload it to get started."
    },
    {
      icon: Sparkles,
      title: "AI Style Analysis",
      description: "Our AI scores your outfit (0-10) and provides color, look suggestions, plus a direct critique. All users get 2 AI ratings per day!"
    },
    {
      icon: Send,
      title: "Join the Challenge",
      description: "Submit your rated outfit to the daily leaderboard. Submissions are open 6 AM - 2:55 PM daily."
    },
    {
      icon: BarChart3,
      title: "Track Your Progress",
      description: "See your rank on the leaderboard (results 3 PM - 2:55 PM next day) and view other styles."
    },
    {
      icon: Coins,
      title: "Earn & Achieve",
      description: "Gain LukuPoints for participation, streaks, referrals, & top ranks. Unlock cool badges!"
    }
  ];

  return (
    <>
      <SiteHeader />
      <main className="flex-1 container flex flex-col items-center text-center py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-10">
            {/* Hero Image Removed */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight">
                Welcome!
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Get your outfits rated by AI, receive style suggestions, earn LukuPoints & Badges, and compete on the daily leaderboard.
            </p>

            {!user ? (
            <Link href="/login" passHref legacyBehavior>
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-base sm:text-lg px-8 py-3 rounded-lg shadow-md transition-transform hover:scale-105">
                Get Started
                </Button>
            </Link>
            ) : (
            <Link href="/upload" passHref legacyBehavior>
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-base sm:text-lg px-8 py-3 rounded-lg shadow-md transition-transform hover:scale-105">
                Rate Your Style
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
                Submissions: Daily <strong>6 AM - 2:55 PM</strong>.
                Leaderboard Results: <strong>3 PM daily</strong> (viewable until <strong>2:55 PM next day</strong>).
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
                    <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl flex flex-col text-left">
                        <CardHeader className="items-start">
                            <div className="p-3 rounded-full bg-accent/10 mb-3 inline-block">
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-8 sm:mb-10 flex items-center justify-center">
                <HelpCircle className="mr-3 h-8 w-8 sm:h-9 sm:w-9 text-primary"/>
                Frequently Asked Questions
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
