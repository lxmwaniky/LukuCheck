
'use client';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { getLeaderboardData, getWeeklyLeaderboardData, getCurrentWeekStart } from '@/actions/outfitActions';
import type { LeaderboardEntry as ServerLeaderboardEntry } from '@/actions/outfitActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, CalendarDays, Info, Loader2, Star, Palette, Shirt, MessageSquareQuote, Clock, Users, ChevronLeft, ChevronRight, Instagram, Link as LinkIcon, Sparkles, Flame, XCircle, RefreshCw } from 'lucide-react';
import { format, subDays, set, isBefore, isAfter, addDays } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { LukuBadge } from '@/components/LukuBadge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TIMING_CONFIG } from '@/config/timing';

type LeaderboardEntry = ServerLeaderboardEntry;

const ITEMS_PER_PAGE = 10;
const LEADERBOARD_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

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

function LeaderboardPage() {
  const { user } = useAuth();
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | undefined>('Initializing...');
  const [isLoading, setIsLoading] = useState(true);
  const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);
  const [currentLeaderboardDate, setCurrentLeaderboardDate] = useState<string>('');
  const [timeLeftToRelease, setTimeLeftToRelease] = useState<number>(0);

  // Weekly leaderboard state
  const [weeklyEntries, setWeeklyEntries] = useState<any[]>([]);
  const [weeklyStatusMessage, setWeeklyStatusMessage] = useState<string | undefined>('');
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  const [currentPage, setCurrentPage] = useState(1);

  const determineLeaderboardStateAndFetch = useCallback(async (isManualRefresh = false) => {
    if (!isManualRefresh) setIsLoading(true); else setIsManuallyRefreshing(true);

    const now = new Date();
    let dateStringToFetch: string;
    let displayDate: Date;

    // If it's before 6:25 PM, we view yesterday's (or earlier) results.
    // After 6:25 PM, we anticipate today's results (which release at 6:30 PM).
    const endOfViewingPrevDayLeaderboard = set(now, { 
      hours: TIMING_CONFIG.LEADERBOARD_VIEWING_CUTOFF_HOUR, 
      minutes: TIMING_CONFIG.LEADERBOARD_VIEWING_CUTOFF_MINUTE, 
      seconds: 0, 
      milliseconds: 0 
    });

    if (isBefore(now, endOfViewingPrevDayLeaderboard)) {
      displayDate = subDays(now, 1);
    } else {
      displayDate = new Date(now);
    }
    dateStringToFetch = toYYYYMMDD(displayDate);
    setCurrentLeaderboardDate(dateStringToFetch);

    const releaseDateTimeForFetchedDate = set(displayDate, { 
      hours: TIMING_CONFIG.LEADERBOARD_RELEASE_HOUR, 
      minutes: TIMING_CONFIG.LEADERBOARD_RELEASE_MINUTE, 
      seconds: 0, 
      milliseconds: 0 
    });

    if (isAfter(now, releaseDateTimeForFetchedDate)) {
      try {
        const data = await getLeaderboardData({ leaderboardDate: dateStringToFetch });
        setAllEntries(data.entries);
        setCurrentPage(1);
        if (data.error) {
          setStatusMessage(data.error);
        } else if (data.entries.length === 0) {
          setStatusMessage(`No submissions found for ${formatDate(dateStringToFetch)}.`);
        } else {
          setStatusMessage(`Displaying top ${data.entries.length} entries for ${formatDate(dateStringToFetch)}.`);
        }
      } catch (error) {
        setStatusMessage('Could not load leaderboard data. Please try again later.');
      }
       setTimeLeftToRelease(0);
    } else {
      setTimeLeftToRelease(releaseDateTimeForFetchedDate.getTime() - now.getTime());
      setStatusMessage(`Leaderboard for ${formatDate(dateStringToFetch)} will be available at 6:30 PM.`);
      setAllEntries([]);
    }
    if (!isManualRefresh) setIsLoading(false); else setIsManuallyRefreshing(false);
  }, []);

  const fetchWeeklyLeaderboard = useCallback(async (weekStart?: string) => {
    setIsWeeklyLoading(true);
    try {
      const weekToFetch = weekStart || await getCurrentWeekStart();
      setCurrentWeekStart(weekToFetch);
      
      const data = await getWeeklyLeaderboardData({ weekStart: weekToFetch });
      setWeeklyEntries(data.entries);
      
      if (data.error) {
        setWeeklyStatusMessage(data.error);
      } else if (data.entries.length === 0) {
        setWeeklyStatusMessage(`No submissions found for the week starting ${weekToFetch}.`);
      } else {
        setWeeklyStatusMessage(data.message || `Displaying ${data.entries.length} participants for the week.`);
      }
    } catch (error) {
      setWeeklyStatusMessage('Could not load weekly leaderboard data. Please try again later.');
      setWeeklyEntries([]);
    }
    setIsWeeklyLoading(false);
  }, []);


  useEffect(() => {
    determineLeaderboardStateAndFetch();
     const intervalId = setInterval(() => {
        determineLeaderboardStateAndFetch();
    }, LEADERBOARD_REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [determineLeaderboardStateAndFetch]);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;
    if (timeLeftToRelease > 0 && statusMessage?.includes('will be available')) {
        timerInterval = setInterval(() => {
            setTimeLeftToRelease(prevTime => {
                if (prevTime <= 1000) {
                    if(timerInterval) clearInterval(timerInterval);
                    determineLeaderboardStateAndFetch(); // Re-fetch when timer hits zero
                    return 0;
                }
                return prevTime - 1000;
            });
        }, 1000);
    }
    return () => {
        if (timerInterval) clearInterval(timerInterval);
    };
  }, [timeLeftToRelease, statusMessage, determineLeaderboardStateAndFetch]);

  // Fetch weekly data when weekly tab is activated
  useEffect(() => {
    if (activeTab === 'weekly' && weeklyEntries.length === 0) {
      fetchWeeklyLeaderboard();
    }
  }, [activeTab, fetchWeeklyLeaderboard, weeklyEntries.length]);


  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString + 'T00:00:00Z'); // Ensure UTC interpretation for consistency
    return format(date, "MMMM d, yyyy");
  };

  const getWeekDateRange = (weekStart: string) => {
    const startDate = new Date(weekStart + 'T00:00:00Z');
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    return {
      start: format(startDate, "MMM d"),
      end: format(endDate, "MMM d, yyyy")
    };
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const currentDate = new Date(currentWeekStart + 'T00:00:00Z');
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    const newWeekStart = newDate.toISOString().split('T')[0];
    fetchWeeklyLeaderboard(newWeekStart);
  };

  const isLeaderboardReleased = !statusMessage?.includes('will be available at 6:30 PM');

  const totalPages = Math.ceil(allEntries.length / ITEMS_PER_PAGE);
  const displayedEntries = allEntries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleManualRefresh = () => {
    determineLeaderboardStateAndFetch(true);
  }

  const getRank = (index: number) => {
    return (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'daily' | 'weekly')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 sm:mb-8">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Daily Leaderboard
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Weekly Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <Card className="shadow-xl rounded-xl">
            <CardHeader className="text-center px-4 py-6 sm:px-6 sm:py-8 bg-primary/5 rounded-t-xl">
                <div className="flex items-center justify-center mb-3 sm:mb-4">
                    <Users className="h-12 w-12 sm:h-16 sm:w-16 text-accent animate-bounce" />
                </div>
              <CardTitle className="text-3xl sm:text-4xl font-bold">Daily Style Leaderboard</CardTitle>
              {currentLeaderboardDate && (
                <CardDescription className="text-base sm:text-lg text-muted-foreground flex items-center justify-center mt-1">
                  <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Showing results for: {formatDate(currentLeaderboardDate)}
                </CardDescription>
              )}
               <CardDescription className="text-xs mt-1">
                  (Submissions: 6 AM - 6 PM daily. Results: 6:30 PM daily - 6 PM next day)
              </CardDescription>
              <Button onClick={handleManualRefresh} variant="outline" size="sm" className="mt-4 mx-auto shadow-sm hover:shadow-md transition-shadow" disabled={isManuallyRefreshing || isLoading}>
                {isManuallyRefreshing || isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <RefreshCw className="h-4 w-4 mr-2"/>}
                Refresh Leaderboard
              </Button>
            </CardHeader>
        <CardContent className="px-2 py-4 sm:px-6 sm:py-6">
          {isLoading && !isManuallyRefreshing ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-4" />
              <p className="text-base sm:text-lg text-muted-foreground">Fetching the latest rankings...</p>
            </div>
          ) : !isLeaderboardReleased && timeLeftToRelease > 0 ? (
             <Alert variant="default" className="mb-6 bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300 mx-2 sm:mx-0 rounded-lg">
              <Clock className="h-5 w-5" />
              <AlertTitle className="font-semibold">Leaderboard Not Yet Released</AlertTitle>
              <AlertDescription>
                Leaderboard for {formatDate(currentLeaderboardDate)} will be available at 6:30 PM.
                Releases in: <span className="font-semibold">{formatTimeLeft(timeLeftToRelease)}</span>.
              </AlertDescription>
            </Alert>
          ) : statusMessage && displayedEntries.length === 0 && !statusMessage.toLowerCase().includes("error") && isLeaderboardReleased ? (
             <Alert variant="default" className="mb-6 bg-secondary/50 border-secondary mx-2 sm:mx-0 rounded-lg">
              <Info className="h-5 w-5" />
              <AlertTitle className="font-semibold">Leaderboard Status</AlertTitle>
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          ) : statusMessage && statusMessage.toLowerCase().includes("error") ? (
             <Alert variant="destructive" className="mb-6 mx-2 sm:mx-0 rounded-lg">
              <Info className="h-5 w-5" />
              <AlertTitle className="font-semibold">Error Loading Leaderboard</AlertTitle>
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          ): displayedEntries.length === 0 && isLeaderboardReleased ? (
            <Alert variant="default" className="mb-6 bg-secondary/50 border-secondary mx-2 sm:mx-0 rounded-lg">
              <Info className="h-5 w-5" />
              <AlertTitle className="font-semibold">No Submissions Found</AlertTitle>
              <AlertDescription>
                No outfits have been submitted for {formatDate(currentLeaderboardDate)} yet, or results are still processing.
              </AlertDescription>
            </Alert>
          ) : (
            <>
            {statusMessage && !statusMessage.toLowerCase().includes("error") && (
                <Alert variant="default" className="mb-6 bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 mx-2 sm:mx-0 rounded-lg">
                    <Info className="h-5 w-5" />
                    <AlertTitle className="font-semibold">Leaderboard Info</AlertTitle>
                    <AlertDescription>{statusMessage}</AlertDescription>
                </Alert>
            )}
            <div className="overflow-x-auto rounded-lg border shadow-sm">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[50px] sm:w-[70px] text-center px-2 sm:px-4 font-semibold">Rank</TableHead>
                    <TableHead className="px-2 sm:px-4 font-semibold">User</TableHead>
                    <TableHead className="w-[70px] text-center px-2 sm:px-4 font-semibold">Streak</TableHead>
                    <TableHead className="text-center px-2 sm:px-4 font-semibold">Outfit</TableHead>
                    <TableHead className="text-right px-2 sm:px-4 font-semibold">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedEntries.map((entry, index) => {
                    const rank = getRank(index);
                    const isCurrentUser = user?.uid === entry.userId;
                    return (
                    <TableRow
                        key={entry.id}
                        className={cn(
                            rank <= 3 ? 'bg-accent/5 dark:bg-accent/10' : '',
                            isCurrentUser ? 'bg-primary/10 dark:bg-primary/20 ring-2 ring-primary ring-offset-1' : '',
                            "hover:bg-muted/60 transition-colors"
                        )}
                    >
                      <TableCell className="font-bold text-lg sm:text-xl text-center px-2 sm:px-4">
                        {rank === 1 && <Trophy className="h-5 w-5 sm:h-6 sm:w-6 inline-block text-yellow-400 fill-yellow-400" />}
                        {rank === 2 && <Trophy className="h-5 w-5 sm:h-6 sm:w-6 inline-block text-slate-400 fill-slate-400" />}
                        {rank === 3 && <Trophy className="h-5 w-5 sm:h-6 sm:w-6 inline-block text-yellow-600 fill-yellow-600" />}
                        {rank > 3 && `#${rank}`}
                        {rank <= 3 && <span className="sr-only">#{rank}</span>}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-primary/50 shadow-sm">
                            <AvatarImage src={entry.userPhotoURL || undefined} alt={entry.username || 'User'} />
                            <AvatarFallback>{(entry.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <span className="font-medium truncate max-w-[100px] sm:max-w-[150px] text-sm sm:text-base">{entry.username || 'Anonymous User'}</span>
                                <LukuBadge lukuPoints={entry.lukuPoints} />
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                {entry.tiktokUrl && (
                                    <Link href={entry.tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label={`${entry.username}'s TikTok Profile`} onClick={(e) => e.stopPropagation()}>
                                        <LinkIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
                                    </Link>
                                )}
                                {entry.instagramUrl && (
                                    <Link href={entry.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label={`${entry.username}'s Instagram Profile`} onClick={(e) => e.stopPropagation()}>
                                        <Instagram className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
                                    </Link>
                                )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium px-2 sm:px-4">
                        {entry.currentStreak && entry.currentStreak > 0 ? (
                          <div className="flex items-center justify-center text-destructive">
                            <Flame className="h-4 w-4 mr-1" />
                            {entry.currentStreak}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center px-2 sm:px-4">
                        <DialogTrigger asChild>
                          <button onClick={() => setSelectedEntry(entry)} className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md group">
                            <Image
                              src={entry.outfitImageURL}
                              alt={`Outfit by ${entry.username}`}
                              width={48}
                              height={48}
                              className="rounded-md object-cover mx-auto aspect-square border shadow-sm group-hover:opacity-80 group-hover:scale-105 transition-all sm:w-12 sm:h-12"
                              data-ai-hint="fashion clothing miniature"
                            />
                          </button>
                        </DialogTrigger>
                      </TableCell>
                      <TableCell className="text-right px-2 sm:px-4">
                        <div className="flex items-center justify-end">
                           <span className="font-bold text-lg sm:text-xl text-primary">{entry.rating.toFixed(1)}</span>
                           <Star className="h-4 w-4 sm:h-5 sm:w-5 text-accent fill-accent ml-1"/>
                        </div>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card className="shadow-xl rounded-xl">
            <CardHeader className="text-center px-4 py-6 sm:px-6 sm:py-8 bg-secondary/5 rounded-t-xl">
                <div className="flex items-center justify-center mb-3 sm:mb-4">
                    <Trophy className="h-12 w-12 sm:h-16 sm:w-16 text-accent animate-bounce" />
                </div>
              <CardTitle className="text-3xl sm:text-4xl font-bold">Weekly Style Leaderboard</CardTitle>
              {currentWeekStart && (
                <div className="flex items-center justify-center space-x-4 mt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigateWeek('prev')}
                    disabled={isWeeklyLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardDescription className="text-base sm:text-lg text-muted-foreground flex items-center">
                    <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    {(() => {
                      const range = getWeekDateRange(currentWeekStart);
                      return `${range.start} - ${range.end}`;
                    })()}
                  </CardDescription>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigateWeek('next')}
                    disabled={isWeeklyLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
               <CardDescription className="text-xs mt-1">
                  Weekly aggregated performance (Monday - Sunday)
              </CardDescription>
              <Button onClick={() => fetchWeeklyLeaderboard()} variant="outline" size="sm" className="mt-4 mx-auto shadow-sm hover:shadow-md transition-shadow" disabled={isWeeklyLoading}>
                {isWeeklyLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <RefreshCw className="h-4 w-4 mr-2"/>}
                Refresh Weekly
              </Button>
            </CardHeader>
            <CardContent className="px-2 py-4 sm:px-6 sm:py-6">
              {isWeeklyLoading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-4" />
                  <p className="text-base sm:text-lg text-muted-foreground">Fetching weekly rankings...</p>
                </div>
              ) : weeklyStatusMessage && weeklyEntries.length === 0 && !weeklyStatusMessage.toLowerCase().includes("error") ? (
                 <Alert variant="default" className="mb-6 bg-secondary/50 border-secondary mx-2 sm:mx-0 rounded-lg">
                  <Info className="h-5 w-5" />
                  <AlertTitle className="font-semibold">Weekly Leaderboard Status</AlertTitle>
                  <AlertDescription>{weeklyStatusMessage}</AlertDescription>
                </Alert>
              ) : weeklyStatusMessage && weeklyStatusMessage.toLowerCase().includes("error") ? (
                 <Alert variant="destructive" className="mb-6 mx-2 sm:mx-0 rounded-lg">
                  <Info className="h-5 w-5" />
                  <AlertTitle className="font-semibold">Error Loading Weekly Data</AlertTitle>
                  <AlertDescription>{weeklyStatusMessage}</AlertDescription>
                </Alert>
              ) : weeklyEntries.length > 0 ? (
                <>
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-[50px] sm:w-[70px] text-center px-2 sm:px-4 font-semibold">Rank</TableHead>
                          <TableHead className="px-2 sm:px-4 font-semibold">User</TableHead>
                          <TableHead className="w-[70px] text-center px-2 sm:px-4 font-semibold">Submissions</TableHead>
                          <TableHead className="text-center px-2 sm:px-4 font-semibold">Avg Rating</TableHead>
                          <TableHead className="text-center px-2 sm:px-4 font-semibold">Best Rating</TableHead>
                          <TableHead className="text-right px-2 sm:px-4 font-semibold">Weekly Points</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {weeklyEntries.map((entry, index) => (
                          <TableRow key={entry.userId} className={cn(
                            "hover:bg-muted/30 transition-colors",
                            index === 0 && "bg-amber-50/50 hover:bg-amber-50/70 border-amber-200/50",
                            index === 1 && "bg-slate-50/50 hover:bg-slate-50/70 border-slate-200/50",
                            index === 2 && "bg-orange-50/50 hover:bg-orange-50/70 border-orange-200/50"
                          )}>
                            <TableCell className="text-center px-2 sm:px-4 py-2 sm:py-3">
                              <div className="flex items-center justify-center">
                                {index === 0 && <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mr-1" />}
                                {index === 1 && <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 mr-1" />}
                                {index === 2 && <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 mr-1" />}
                                <span className="font-semibold text-sm sm:text-base">#{index + 1}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-primary/20">
                                  <AvatarImage src={entry.photoURL || undefined} alt={entry.username} />
                                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs sm:text-sm">
                                    {entry.username.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm sm:text-base truncate max-w-[100px] sm:max-w-none">
                                    {entry.username}
                                  </span>
                                  <div className="flex items-center space-x-1">
                                    <LukuBadge lukuPoints={entry.lukuPoints} className="text-xs" />
                                    {entry.currentStreak > 0 && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <div className="flex items-center text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                                              <Flame className="h-3 w-3 mr-1" />
                                              <span className="text-xs font-semibold">{entry.currentStreak}</span>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Current streak: {entry.currentStreak} days</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center px-2 sm:px-4 py-2 sm:py-3">
                              <span className="text-sm sm:text-base font-semibold">{entry.submissions}</span>
                            </TableCell>
                            <TableCell className="text-center px-2 sm:px-4 py-2 sm:py-3">
                              <div className="flex items-center justify-center">
                                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500 mr-1" />
                                <span className="text-sm sm:text-base font-semibold">{entry.avgRating.toFixed(1)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center px-2 sm:px-4 py-2 sm:py-3">
                              <div className="flex items-center justify-center">
                                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500 mr-1" />
                                <span className="text-sm sm:text-base font-semibold">{entry.bestRating.toFixed(1)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right px-2 sm:px-4 py-2 sm:py-3">
                              <div className="flex items-center justify-end">
                                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 mr-1" />
                                <span className="text-sm sm:text-base font-bold text-blue-600">{entry.totalPoints}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Weekly Data Available</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Weekly leaderboards show aggregated performance over the week. Check back after some daily submissions!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Alert variant="default" className="mt-8 sm:mt-10 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-primary/20 shadow-lg rounded-xl">
        <Sparkles className="h-5 w-5 text-accent" />
        <AlertTitle className="text-lg sm:text-xl font-semibold text-primary">✨ Exciting Features Coming Soon!</AlertTitle>
        <AlertDescription className="text-muted-foreground mt-1 text-sm sm:text-base">
          We're working on new ways to enhance your LukuCheck experience, including private leaderboards to challenge your friends!
        </AlertDescription>
      </Alert>

      {selectedEntry && (
        <DialogContent className="sm:max-w-lg p-0 rounded-xl overflow-hidden shadow-2xl">
          <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b bg-muted/30">
            <div className="flex items-center space-x-3 mb-2">
                <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-primary shadow-sm">
                    <AvatarImage src={selectedEntry.userPhotoURL || undefined} alt={selectedEntry.username || 'User'} />
                    <AvatarFallback>{(selectedEntry.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
                        {selectedEntry.username || 'Anonymous User'}
                        <LukuBadge lukuPoints={selectedEntry.lukuPoints} />
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        Feedback for {formatDate(currentLeaderboardDate)}
                    </DialogDescription>
                </div>
                 <DialogClose asChild>
                    <Button variant="ghost" size="icon" className="ml-auto rounded-full h-8 w-8">
                        <XCircle className="h-5 w-5" />
                        <span className="sr-only">Close</span>
                    </Button>
                </DialogClose>
            </div>
             <div className="flex items-center gap-1.5 pt-1">
                {selectedEntry.tiktokUrl && (
                    <Link href={selectedEntry.tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label={`${selectedEntry.username}'s TikTok Profile`}>
                        <Button variant="ghost" size="sm" className="text-xs px-2 py-1 h-auto text-muted-foreground hover:text-primary">
                            <LinkIcon className="h-3.5 w-3.5 mr-1" /> TikTok
                        </Button>
                    </Link>
                )}
                {selectedEntry.instagramUrl && (
                    <Link href={selectedEntry.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label={`${selectedEntry.username}'s Instagram Profile`}>
                         <Button variant="ghost" size="sm" className="text-xs px-2 py-1 h-auto text-muted-foreground hover:text-primary">
                            <Instagram className="h-3.5 w-3.5 mr-1" /> Instagram
                        </Button>
                    </Link>
                )}
            </div>
          </DialogHeader>
          <div className="px-4 sm:px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="border rounded-lg overflow-hidden shadow-md bg-muted/20">
              <Image
                src={selectedEntry.outfitImageURL}
                alt={`Outfit by ${selectedEntry.username}`}
                width={600}
                height={600}
                className="object-contain w-full h-auto max-h-[300px] sm:max-h-[400px]"
                data-ai-hint="fashion model clothing"
              />
            </div>
            <div className="text-center py-2">
              <p className="text-4xl sm:text-5xl font-bold text-primary">{selectedEntry.rating.toFixed(1)}<span className="text-xl sm:text-2xl text-muted-foreground">/10</span></p>
              <div className="flex justify-center mt-1">
                {[...Array(10)].map((_, i) => (
                  <Star key={i} className={`h-5 w-5 sm:h-6 sm:w-6 ${i < Math.round(selectedEntry.rating) ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`} />
                ))}
              </div>
            </div>

            <Separator className="my-3 sm:my-4" />

            <div className="space-y-1">
              <h3 className="text-md sm:text-lg font-semibold flex items-center"><MessageSquareQuote className="mr-2 h-5 w-5 text-primary"/>Stylist's Verdict:</h3>
              <p className="text-sm sm:text-base text-foreground/90 italic bg-muted/30 p-2.5 rounded-md border">{selectedEntry.complimentOrCritique || "No verdict provided."}</p>
            </div>

            {selectedEntry.colorSuggestions && selectedEntry.colorSuggestions.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-md sm:text-lg font-semibold flex items-center"><Palette className="mr-2 h-5 w-5 text-primary"/>Color Suggestions:</h3>
                <ul className="list-disc list-inside space-y-0.5 text-sm sm:text-base text-foreground/90 pl-3">
                  {selectedEntry.colorSuggestions.map((color, index) => <li key={index}>{color}</li>)}
                </ul>
              </div>
            )}

            {selectedEntry.lookSuggestions && (
              <div className="space-y-1">
                <h3 className="text-md sm:text-lg font-semibold flex items-center"><Shirt className="mr-2 h-5 w-5 text-primary"/>Look Suggestions:</h3>
                <p className="text-sm sm:text-base text-foreground/90">{selectedEntry.lookSuggestions}</p>
              </div>
            )}
          </div>
           <div className="px-4 sm:px-6 py-3 border-t bg-muted/30">
                <DialogClose asChild>
                    <Button variant="outline" className="w-full">Close</Button>
                </DialogClose>
            </div>
        </DialogContent>
      )}
    </div>
  );
}

function LeaderboardPageWrapper() {
    return (
        <Dialog>
            <LeaderboardPage />
        </Dialog>
    )
}

export default LeaderboardPageWrapper;
