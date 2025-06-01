
'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getLeaderboardData } from '@/actions/outfitActions';
import type { LeaderboardEntry as ServerLeaderboardEntry } from '@/actions/outfitActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Trophy, CalendarDays, Info, Loader2, Star, Palette, Shirt, MessageSquareQuote, Clock, Users, ChevronLeft, ChevronRight, Instagram, Link as LinkIcon, Sparkles, Flame } from 'lucide-react';
import { format, subDays, set, isBefore, isAfter, addDays } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { LukuBadge } from '@/components/LukuBadge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


type LeaderboardEntry = ServerLeaderboardEntry; 

const ITEMS_PER_PAGE = 10;

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
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);
  const [currentLeaderboardDate, setCurrentLeaderboardDate] = useState<string>(''); 
  const [timeLeftToRelease, setTimeLeftToRelease] = useState<number>(0); 

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const determineLeaderboardStateAndFetch = async () => {
      setIsLoading(true);
      const now = new Date();
      let dateStringToFetch: string;
      let displayDate: Date;

      const endOfViewingPrevDayLeaderboard = set(now, { hours: 14, minutes: 55, seconds: 0, milliseconds: 0 }); // 2:55 PM today

      if (isBefore(now, endOfViewingPrevDayLeaderboard)) {
        displayDate = subDays(now, 1);
      } else {
        displayDate = new Date(now);
      }
      dateStringToFetch = toYYYYMMDD(displayDate);
      setCurrentLeaderboardDate(dateStringToFetch);

      const releaseDateTimeForFetchedDate = set(displayDate, { hours: 15, minutes: 0, seconds: 0, milliseconds: 0 }); 

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
          console.error('Failed to fetch leaderboard data:', error);
          setStatusMessage('Could not load leaderboard data. Please try again later.');
        }
         setTimeLeftToRelease(0);
      } else {
        setTimeLeftToRelease(releaseDateTimeForFetchedDate.getTime() - now.getTime());
        setStatusMessage(`Leaderboard for ${formatDate(dateStringToFetch)} will be available at 3 PM.`);
        setAllEntries([]);
      }
      setIsLoading(false);
    };

    determineLeaderboardStateAndFetch();
    const interval = setInterval(determineLeaderboardStateAndFetch, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;
    if (timeLeftToRelease > 0 && statusMessage?.includes('will be available')) {
        timerInterval = setInterval(() => {
            setTimeLeftToRelease(prevTime => {
                if (prevTime <= 1000) {
                    if(timerInterval) clearInterval(timerInterval);
                    setIsLoading(true);
                    setTimeout(() => setIsLoading(false), 50);
                    return 0;
                }
                return prevTime - 1000;
            });
        }, 1000);
    }
    return () => {
        if (timerInterval) clearInterval(timerInterval);
    };
  }, [timeLeftToRelease, statusMessage]);


  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString + 'T00:00:00Z'); 
    return format(date, "MMMM d, yyyy");
  };

  const isLeaderboardReleased = !statusMessage?.includes('will be available at 3 PM');

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

  const getRank = (index: number) => {
    return (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-xl mb-6">
        <CardHeader className="text-center px-4 py-6 sm:px-6 sm:py-8">
          <Users className="h-12 w-12 sm:h-16 sm:w-16 text-accent mx-auto mb-3 sm:mb-4" />
          <CardTitle className="text-3xl sm:text-4xl font-bold">Daily Style Leaderboard</CardTitle>
          {currentLeaderboardDate && (
            <CardDescription className="text-base sm:text-lg text-muted-foreground flex items-center justify-center mt-1">
              <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Showing results for: {formatDate(currentLeaderboardDate)}
            </CardDescription>
          )}
           <CardDescription className="text-xs mt-1">
                (Submissions: 6 AM - 2:55 PM daily. Results: 3 PM daily - 2:55 PM next day)
            </CardDescription>
        </CardHeader>
        <CardContent className="px-2 py-4 sm:px-6 sm:py-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-4" />
              <p className="text-base sm:text-lg text-muted-foreground">Fetching the latest rankings...</p>
            </div>
          ) : !isLeaderboardReleased && timeLeftToRelease > 0 ? (
             <Alert variant="default" className="mb-6 bg-secondary mx-2 sm:mx-0">
              <Clock className="h-5 w-5" />
              <AlertTitle>Leaderboard Not Yet Released</AlertTitle>
              <AlertDescription>
                Leaderboard for {formatDate(currentLeaderboardDate)} will be available at 3 PM.
                Releases in: <span className="font-semibold">{formatTimeLeft(timeLeftToRelease)}</span>.
              </AlertDescription>
            </Alert>
          ) : statusMessage && displayedEntries.length === 0 && !statusMessage.toLowerCase().includes("error") && isLeaderboardReleased ? (
             <Alert variant="default" className="mb-6 bg-secondary mx-2 sm:mx-0">
              <Info className="h-5 w-5" />
              <AlertTitle>Leaderboard Status</AlertTitle>
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          ) : statusMessage && statusMessage.toLowerCase().includes("error") ? (
             <Alert variant="destructive" className="mb-6 mx-2 sm:mx-0">
              <Info className="h-5 w-5" />
              <AlertTitle>Error Loading Leaderboard</AlertTitle>
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          ): displayedEntries.length === 0 && isLeaderboardReleased ? (
            <Alert variant="default" className="mb-6 mx-2 sm:mx-0">
              <Info className="h-5 w-5" />
              <AlertTitle>No Submissions Found</AlertTitle>
              <AlertDescription>
                No outfits have been submitted for {formatDate(currentLeaderboardDate)} yet, or results are still processing.
              </AlertDescription>
            </Alert>
          ) : (
            <>
            {statusMessage && !statusMessage.toLowerCase().includes("error") && (
                <Alert variant="default" className="mb-6 bg-secondary/50 border-secondary mx-2 sm:mx-0">
                    <Info className="h-5 w-5" />
                    <AlertTitle>Leaderboard Info</AlertTitle>
                    <AlertDescription>{statusMessage}</AlertDescription>
                </Alert>
            )}
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] sm:w-[60px] text-center px-2 sm:px-4">Rank</TableHead>
                    <TableHead className="px-2 sm:px-4">User</TableHead>
                    <TableHead className="w-[70px] text-center px-2 sm:px-4">Streak</TableHead>
                    <TableHead className="text-center px-2 sm:px-4">Outfit</TableHead>
                    <TableHead className="text-right px-2 sm:px-4">Score</TableHead>
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
                            rank <= 3 ? 'bg-accent/10' : '',
                            isCurrentUser ? 'bg-primary/20 ring-2 ring-primary ring-offset-1' : ''
                        )}
                    >
                      <TableCell className="font-bold text-lg sm:text-xl text-center px-2 sm:px-4">
                        {rank === 1 && <Trophy className="h-5 w-5 sm:h-6 sm:w-6 inline-block text-yellow-400" />}
                        {rank === 2 && <Trophy className="h-5 w-5 sm:h-6 sm:w-6 inline-block text-slate-400" />}
                        {rank === 3 && <Trophy className="h-5 w-5 sm:h-6 sm:w-6 inline-block text-yellow-600" />}
                        {rank > 3 && `#${rank}`}
                        {rank <= 3 && <span className="sr-only">#{rank}</span>}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-primary/50">
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
                          <div className="flex items-center justify-center">
                            <Flame className="h-4 w-4 text-destructive mr-1" />
                            {entry.currentStreak}
                          </div>
                        ) : (
                          '0'
                        )}
                      </TableCell>
                      <TableCell className="text-center px-2 sm:px-4">
                        <DialogTrigger asChild>
                          <button onClick={() => setSelectedEntry(entry)} className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md">
                            <Image
                              src={entry.outfitImageURL}
                              alt={`Outfit by ${entry.username}`}
                              width={48}
                              height={48}
                              className="rounded-md object-cover mx-auto aspect-square border shadow-sm hover:opacity-80 transition-opacity sm:w-12 sm:h-12"
                              data-ai-hint="fashion clothing"
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

      <Alert variant="default" className="mt-8 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-primary/20 shadow-lg">
        <Sparkles className="h-5 w-5 text-accent" />
        <AlertTitle className="text-xl font-semibold text-primary">✨ Premium Feature Coming Soon: Private Leaderboards!</AlertTitle>
        <AlertDescription className="text-muted-foreground mt-1">
          Get ready to create your own private style challenges! Compete with up to 50 friends and showcase your unique fashion sense.
          <div className="mt-3">
            <Button variant="secondary" disabled>Learn More (Coming Soon)</Button>
          </div>
        </AlertDescription>
      </Alert>


      {selectedEntry && (
        <DialogContent className="sm:max-w-lg p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center space-x-3 mb-2">
                <Avatar className="h-12 w-12 border-2 border-primary">
                    <AvatarImage src={selectedEntry.userPhotoURL || undefined} alt={selectedEntry.username || 'User'} />
                    <AvatarFallback>{(selectedEntry.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
                        {selectedEntry.username || 'Anonymous User'}
                        <LukuBadge lukuPoints={selectedEntry.lukuPoints} />
                    </DialogTitle>
                    <DialogDescription>
                        Feedback for {formatDate(currentLeaderboardDate)}
                    </DialogDescription>
                </div>
            </div>
             <div className="flex items-center gap-2 pt-1">
                {selectedEntry.tiktokUrl && (
                    <Link href={selectedEntry.tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label={`${selectedEntry.username}'s TikTok Profile`}>
                        <Button variant="ghost" size="sm" className="text-xs px-2 py-1 h-auto">
                            <LinkIcon className="h-3.5 w-3.5 mr-1.5" /> TikTok
                        </Button>
                    </Link>
                )}
                {selectedEntry.instagramUrl && (
                    <Link href={selectedEntry.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label={`${selectedEntry.username}'s Instagram Profile`}>
                         <Button variant="ghost" size="sm" className="text-xs px-2 py-1 h-auto">
                            <Instagram className="h-3.5 w-3.5 mr-1.5" /> Instagram
                        </Button>
                    </Link>
                )}
            </div>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="border rounded-lg overflow-hidden shadow-md">
              <Image
                src={selectedEntry.outfitImageURL}
                alt={`Outfit by ${selectedEntry.username}`}
                width={600}
                height={600}
                className="object-contain w-full h-auto max-h-[300px] sm:max-h-[400px]"
                data-ai-hint="fashion clothing detailed"
              />
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold text-primary">{selectedEntry.rating.toFixed(1)}<span className="text-2xl text-muted-foreground">/10</span></p>
              <div className="flex justify-center mt-1">
                {[...Array(10)].map((_, i) => (
                  <Star key={i} className={`h-6 w-6 ${i < Math.round(selectedEntry.rating) ? 'text-accent fill-accent' : 'text-muted-foreground/50'}`} />
                ))}
              </div>
            </div>

            <Separator className="my-4" />

            <div>
              <h3 className="text-lg font-semibold mb-1 flex items-center"><MessageSquareQuote className="mr-2 h-5 w-5 text-primary"/>Stylist's Verdict:</h3>
              <p className="text-sm text-foreground/90 italic">{selectedEntry.complimentOrCritique || "No verdict provided."}</p>
            </div>

            {selectedEntry.colorSuggestions && selectedEntry.colorSuggestions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-1 flex items-center"><Palette className="mr-2 h-5 w-5 text-primary"/>Color Suggestions:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-foreground/90 pl-2">
                  {selectedEntry.colorSuggestions.map((color, index) => <li key={index}>{color}</li>)}
                </ul>
              </div>
            )}

            {selectedEntry.lookSuggestions && (
              <div>
                <h3 className="text-lg font-semibold mb-1 flex items-center"><Shirt className="mr-2 h-5 w-5 text-primary"/>Look Suggestions:</h3>
                <p className="text-sm text-foreground/90">{selectedEntry.lookSuggestions}</p>
              </div>
            )}
          </div>
        </DialogContent>
      )}
    </div>
  );
}

function LeaderboardPageWrapper() {
    return (
        <Dialog>
            <LeaderboardPageActual />
        </Dialog>
    )
}

// Renaming original export to avoid conflict, and because Dialog needs to wrap it
const LeaderboardPageActual = LeaderboardPage;
export default LeaderboardPageWrapper;

