'use client';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { getLeaderboardData, getWeeklyLeaderboardData, getCurrentWeekStart } from '@/actions/outfitActions';
import type { LeaderboardEntry } from '@/actions/outfitActions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CalendarDays, Trophy, Loader2, ChevronLeft, ChevronRight, Info, Instagram } from "lucide-react";
import { format, addDays } from 'date-fns';

const LEADERBOARD_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const COUNTDOWN_REFRESH_INTERVAL = 30 * 1000; // 30 seconds when waiting for release

// Type for weekly leaderboard entries
type WeeklyEntry = {
  userId: string;
  username: string | null;
  userPhotoURL: string | null;
  totalSubmissions: number;
  avgRating: number;
  bestRating: number;
  totalPoints: number;
  lukuPoints: number;
  currentStreak: number;
};

const formatTimeLeft = (ms: number): string => {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

function LeaderboardPage() {
  // State
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | undefined>('Initializing...');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | WeeklyEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
  const [isWaitingForRelease, setIsWaitingForRelease] = useState(false);
  const [timeUntilRelease, setTimeUntilRelease] = useState<number>(0);
  
  // Weekly leaderboard state
  const [weeklyEntries, setWeeklyEntries] = useState<WeeklyEntry[]>([]);
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<string>('');
  const [weeklyStatusMessage, setWeeklyStatusMessage] = useState<string | undefined>();

  // Fetch daily leaderboard
  const fetchDailyLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await getLeaderboardData({ leaderboardDate: today });
      
      if (result.error) {
        setStatusMessage(result.error);
        setAllEntries([]);
        setIsWaitingForRelease(false);
        setTimeUntilRelease(0);
      } else {
        setAllEntries(result.entries || []);
        setStatusMessage(result.message);
        setIsWaitingForRelease(result.isWaitingForRelease || false);
        setTimeUntilRelease(result.timeUntilRelease || 0);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setStatusMessage('Failed to load leaderboard data');
      setAllEntries([]);
      setIsWaitingForRelease(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch weekly leaderboard
  const fetchWeeklyLeaderboard = useCallback(async (weekStart?: string) => {
    setIsWeeklyLoading(true);
    try {
      const targetWeekStart = weekStart || await getCurrentWeekStart();
      setCurrentWeekStart(targetWeekStart);
      
      const result = await getWeeklyLeaderboardData({ weekStart: targetWeekStart });
      
      if (result.error) {
        setWeeklyStatusMessage(result.error);
        setWeeklyEntries([]);
      } else {
        setWeeklyEntries(result.entries || []);
        setWeeklyStatusMessage(result.message);
      }
    } catch (error) {
      console.error('Error fetching weekly leaderboard:', error);
      setWeeklyStatusMessage('Failed to load weekly data');
      setWeeklyEntries([]);
    } finally {
      setIsWeeklyLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDailyLeaderboard();
    
    // Use different refresh intervals based on whether we're waiting for release
    const refreshInterval = isWaitingForRelease ? COUNTDOWN_REFRESH_INTERVAL : LEADERBOARD_REFRESH_INTERVAL;
    
    const intervalId = setInterval(() => {
      fetchDailyLeaderboard();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [fetchDailyLeaderboard, isWaitingForRelease]);

  // Load weekly data when tab is activated
  useEffect(() => {
    if (activeTab === 'weekly' && weeklyEntries.length === 0) {
      fetchWeeklyLeaderboard();
    }
  }, [activeTab, fetchWeeklyLeaderboard, weeklyEntries.length]);

  // Countdown timer for release waiting
  useEffect(() => {
    if (!isWaitingForRelease || timeUntilRelease <= 0) return;

    const countdownInterval = setInterval(() => {
      setTimeUntilRelease(prev => {
        if (prev <= 1000) {
          // Time's up, refresh the leaderboard
          fetchDailyLeaderboard();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [isWaitingForRelease, timeUntilRelease, fetchDailyLeaderboard]);

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

  // Check if future week
  const isFutureWeek = () => {
    const today = new Date();
    const weekEndDate = new Date(currentWeekStart + 'T00:00:00Z');
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    return weekEndDate > today;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Leaderboard</h1>
          <p className="text-gray-400">Compete with the style community</p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'daily' | 'weekly')} className="w-full">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-2 bg-gray-800 border border-gray-700 rounded-xl p-1">
              <TabsTrigger 
                value="daily" 
                className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400"
              >
                <CalendarDays className="h-4 w-4" />
                Daily
              </TabsTrigger>
              <TabsTrigger 
                value="weekly" 
                className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400"
              >
                <Trophy className="h-4 w-4" />
                Weekly
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="daily" className="space-y-6">
            {/* Status Message */}
            {statusMessage && (
              <Alert className={`border-gray-700 text-white ${
                isWaitingForRelease ? 'bg-blue-900 border-blue-700' : 'bg-gray-800'
              }`}>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {isWaitingForRelease && timeUntilRelease > 0 ? (
                    <div className="flex items-center justify-between">
                      <span>{statusMessage}</span>
                      <div className="ml-4 font-mono text-sm">
                        {formatTimeLeft(timeUntilRelease)}
                      </div>
                    </div>
                  ) : (
                    statusMessage
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Daily Leaderboard */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-3 text-gray-400">Loading leaderboard...</span>
              </div>
            ) : isWaitingForRelease ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Leaderboard Coming Soon!</h3>
                <p className="text-gray-400 mb-4">The daily competition is in progress...</p>
                <div className="bg-gray-800 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-gray-300 text-sm">{statusMessage}</p>
                </div>
                <p className="text-gray-500 text-sm mt-4">
                  Keep submitting your outfits! Results will be revealed at the scheduled time.
                </p>
              </div>
            ) : allEntries.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No submissions yet</h3>
                <p className="text-gray-500">Be the first to submit an outfit today!</p>
              </div>
            ) : (
              <>
              {/* Top 3 Olympic Podium - Only show if we have 3 or more entries */}
              {allEntries.length >= 3 && (
                <div className="flex justify-center items-end gap-6 mb-12">
                  {/* Second Place - Left */}
                  {allEntries[1] && (
                    <div className="text-center">
                      <div className="relative mb-4">
                        <div className="w-20 h-20 rounded-full border-4 border-gray-500 overflow-hidden cursor-pointer hover:border-gray-400 transition-colors"
                             onClick={() => setSelectedEntry(allEntries[1])}>
                          <Avatar className="w-full h-full">
                            <AvatarImage src={allEntries[1].userPhotoURL || '/default-avatar.png'} />
                            <AvatarFallback className="bg-gray-700 text-white text-xl font-bold">
                              {allEntries[1].username?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center border-2 border-gray-900">
                          <span className="text-white font-bold text-sm">2</span>
                        </div>
                      </div>
                      <h3 className="font-medium text-white text-lg mb-2 truncate max-w-24">
                        {allEntries[1].username}
                      </h3>
                      <p className="text-gray-300 text-lg font-medium">{(allEntries[1].rating * 10).toFixed(0)}</p>
                    </div>
                  )}

                  {/* First Place - Center (Highest) */}
                  {allEntries[0] && (
                    <div className="text-center -mt-6">
                      <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full border-4 border-yellow-500 overflow-hidden cursor-pointer hover:border-yellow-400 transition-colors relative"
                             onClick={() => setSelectedEntry(allEntries[0])}>
                          <Avatar className="w-full h-full">
                            <AvatarImage src={allEntries[0].userPhotoURL || '/default-avatar.png'} />
                            <AvatarFallback className="bg-gray-700 text-white text-2xl font-bold">
                              {allEntries[0].username?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        {/* Crown */}
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <svg width="32" height="24" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 13L7 3L10 8L12 2L14 8L17 3L19 13H5Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1"/>
                            <circle cx="7" cy="3" r="2" fill="#F59E0B" stroke="#D97706" strokeWidth="1"/>
                            <circle cx="12" cy="2" r="2" fill="#F59E0B" stroke="#D97706" strokeWidth="1"/>
                            <circle cx="17" cy="3" r="2" fill="#F59E0B" stroke="#D97706" strokeWidth="1"/>
                          </svg>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-gray-900">
                          <span className="text-gray-900 font-bold text-sm">1</span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-white text-xl mb-2 truncate max-w-28">
                        {allEntries[0].username}
                      </h3>
                      <p className="text-yellow-400 text-xl font-bold">{(allEntries[0].rating * 10).toFixed(0)}</p>
                    </div>
                  )}

                  {/* Third Place - Right */}
                  {allEntries[2] && (
                    <div className="text-center">
                      <div className="relative mb-4">
                        <div className="w-20 h-20 rounded-full border-4 border-amber-600 overflow-hidden cursor-pointer hover:border-amber-500 transition-colors"
                             onClick={() => setSelectedEntry(allEntries[2])}>
                          <Avatar className="w-full h-full">
                            <AvatarImage src={allEntries[2].userPhotoURL || '/default-avatar.png'} />
                            <AvatarFallback className="bg-gray-700 text-white text-lg font-bold">
                              {allEntries[2].username?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center border-2 border-gray-900">
                          <span className="text-white font-bold text-sm">3</span>
                        </div>
                      </div>
                      <h3 className="font-medium text-white text-lg mb-2 truncate max-w-20">
                        {allEntries[2].username}
                      </h3>
                      <p className="text-amber-300 text-lg font-medium">{(allEntries[2].rating * 10).toFixed(0)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Simple List for entries 1-2 when we have fewer than 3 total */}
              {allEntries.length < 3 && (
                <div className="space-y-2">
                  {allEntries.map((entry, index) => (
                    <div 
                      key={entry.id} 
                      className={`bg-gray-800 rounded-xl p-4 border border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer ${
                        index === 0 ? 'border-yellow-500 bg-yellow-900/20' : 
                        index === 1 ? 'border-gray-400 bg-gray-700/20' : ''
                      }`}
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <div className="flex items-center justify-between">
                        {/* Rank and User Info */}
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-gray-900' : 
                            index === 1 ? 'bg-gray-500 text-white' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={entry.userPhotoURL || '/default-avatar.png'} />
                              <AvatarFallback className="bg-gray-700 text-white font-bold">
                                {entry.username?.[0]?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className={`font-medium ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                                {entry.username}
                              </span>
                              {index === 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Trophy className="h-4 w-4 text-yellow-400" />
                                  <span className="text-sm text-yellow-400">Leader</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Score */}
                        <div className={`font-bold text-lg ${index === 0 ? 'text-yellow-400' : 'text-gray-300'}`}>
                          {(entry.rating * 10).toFixed(0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rest of Rankings (4th place and beyond) */}
              {allEntries.length > 3 && (
                <div className="space-y-2">
                  {allEntries.slice(3).map((entry, index) => (
                    <div 
                      key={entry.id} 
                      className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <div className="flex items-center justify-between">
                        {/* Rank and User Info */}
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 text-sm font-medium">
                            {String(index + 4).padStart(2, '0')}
                          </div>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={entry.userPhotoURL || '/default-avatar.png'} />
                              <AvatarFallback className="bg-gray-700 text-white font-bold">
                                {entry.username?.[0]?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-white font-medium">{entry.username}</span>
                          </div>
                        </div>
                        
                        {/* Score */}
                        <div className="text-gray-300 font-medium">
                          {(entry.rating * 10).toFixed(0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </>
            )}
          </TabsContent>

          <TabsContent value="weekly" className="space-y-6">
            {/* Weekly Navigation */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigateWeek('prev')}
                disabled={isWeeklyLoading}
                className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <div className="text-white font-medium">
                  {currentWeekStart && (() => {
                    const range = getWeekDateRange(currentWeekStart);
                    return `${range.start} - ${range.end}`;
                  })()}
                </div>
                <div className="text-gray-400 text-sm">Weekly Champions</div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigateWeek('next')}
                disabled={isWeeklyLoading || isFutureWeek()}
                className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Weekly Leaderboard */}
            {isWeeklyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-3 text-gray-400">Loading weekly data...</span>
              </div>
            ) : weeklyEntries.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No data for this week</h3>
                <p className="text-gray-500">No submissions were made during this period.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {weeklyEntries.map((entry, index) => (
                  <div 
                    key={entry.userId} 
                    className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div className="flex items-center justify-between">
                      {/* Rank and User Info */}
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          index === 0 ? 'bg-yellow-500 text-gray-900' : 
                          index === 1 ? 'bg-gray-600 text-white' : 
                          index === 2 ? 'bg-gray-600 text-white' : 
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={entry.userPhotoURL || '/default-avatar.png'} />
                            <AvatarFallback className="bg-gray-700 text-white font-bold">
                              {entry.username?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white font-medium">{entry.username}</span>
                        </div>
                      </div>
                      
                      {/* Weekly Stats */}
                      <div className="text-right">
                        <div className="text-white font-medium">{Math.round(entry.totalPoints)}</div>
                        <div className="text-gray-400 text-sm">{entry.totalSubmissions} submissions</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* User Profile Modal */}
        <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
          <DialogContent className="max-w-md bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedEntry && (
                  <>
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={selectedEntry.userPhotoURL || '/default-avatar.png'} />
                      <AvatarFallback className="bg-gray-700 text-white font-bold text-lg">
                        {selectedEntry.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-white font-bold text-lg">{selectedEntry.username}</div>
                      {'rating' in selectedEntry ? (
                        <div className="text-yellow-400 text-sm">Rating: {(selectedEntry.rating * 10).toFixed(1)}/10</div>
                      ) : (
                        <div className="text-yellow-400 text-sm">Weekly Points: {selectedEntry.totalPoints}</div>
                      )}
                    </div>
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            
            {selectedEntry && (
              <div className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {'rating' in selectedEntry ? (
                    // Daily entry stats
                    <>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <div className="text-2xl font-bold text-white">
                          {(selectedEntry.rating * 10).toFixed(1)}
                        </div>
                        <div className="text-gray-400 text-sm">Style Score</div>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <div className="text-2xl font-bold text-white">
                          {selectedEntry.lukuPoints}
                        </div>
                        <div className="text-gray-400 text-sm">LukuPoints</div>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <div className="text-2xl font-bold text-white">
                          {selectedEntry.currentStreak}
                        </div>
                        <div className="text-gray-400 text-sm">Current Streak</div>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <div className="text-2xl font-bold text-white">1</div>
                        <div className="text-gray-400 text-sm">Submissions</div>
                      </div>
                    </>
                  ) : (
                    // Weekly entry stats
                    <>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <div className="text-2xl font-bold text-white">
                          {selectedEntry.totalSubmissions}
                        </div>
                        <div className="text-gray-400 text-sm">Submissions</div>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <div className="text-2xl font-bold text-white">
                          {selectedEntry.avgRating.toFixed(1)}
                        </div>
                        <div className="text-gray-400 text-sm">Avg Rating</div>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <div className="text-2xl font-bold text-white">
                          {selectedEntry.bestRating.toFixed(1)}
                        </div>
                        <div className="text-gray-400 text-sm">Best Score</div>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <div className="text-2xl font-bold text-white">
                          {selectedEntry.lukuPoints}
                        </div>
                        <div className="text-gray-400 text-sm">LukuPoints</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Outfit Preview - only for daily entries */}
                {'outfitImageURL' in selectedEntry && selectedEntry.outfitImageURL && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3">Featured Outfit</h4>
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-600">
                      <Image
                        src={selectedEntry.outfitImageURL}
                        alt="User's outfit"
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Social Links - only for daily entries */}
                {'instagramUrl' in selectedEntry && selectedEntry.instagramUrl && (
                  <div className="bg-gray-700 rounded-lg p-3">
                    <a 
                      href={selectedEntry.instagramUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-pink-400 transition-colors"
                    >
                      <Instagram className="h-4 w-4 text-pink-500" />
                      <span className="text-white">View on Instagram</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function LeaderboardPageWrapper() {
  return <LeaderboardPage />;
}

export default LeaderboardPageWrapper;