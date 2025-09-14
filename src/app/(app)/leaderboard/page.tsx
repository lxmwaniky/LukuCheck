'use client';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { getLeaderboardData } from '@/actions/outfitActions';
import type { LeaderboardEntry } from '@/actions/outfitActions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, Loader2, Info, Instagram, Flame, Coins, Heart } from "lucide-react";

const LEADERBOARD_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes (reduced from 5 minutes)
const COUNTDOWN_REFRESH_INTERVAL = 60 * 1000; // 1 minute when waiting for release (reduced from 30 seconds)

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
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);
  const [isWaitingForRelease, setIsWaitingForRelease] = useState(false);
  const [timeUntilRelease, setTimeUntilRelease] = useState<number>(0);

  // Fetch daily leaderboard
  const fetchDailyLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get today's date in the local timezone to avoid UTC conversion issues
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Daily Leaderboard</h1>
          <p className="text-gray-400">Today's style champions</p>
        </div>

        <div className="space-y-6">
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
            ) : allEntries.length === 0 ? (
              isWaitingForRelease ? (
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
              ) : (
                <div className="text-center py-12">
                  <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No submissions yet</h3>
                  <p className="text-gray-500">Be the first to submit an outfit today!</p>
                </div>
              )
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
                      <div className="flex items-center justify-center gap-3 mb-2">
                        {allEntries[1].currentStreak > 0 && (
                          <div className="flex items-center gap-1">
                            <Flame className="h-3 w-3 text-orange-500" />
                            <span className="text-orange-500 text-sm font-medium">{allEntries[1].currentStreak}</span>
                          </div>
                        )}
                        {allEntries[1].lukuPoints > 0 && (
                          <div className="flex items-center gap-1">
                            <Coins className="h-3 w-3 text-green-500" />
                            <span className="text-green-500 text-sm font-medium">{allEntries[1].lukuPoints}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-300 text-lg font-medium">{(allEntries[1].rating).toFixed(1)}</p>
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
                      <div className="flex items-center justify-center gap-3 mb-2">
                        {allEntries[0].currentStreak > 0 && (
                          <div className="flex items-center gap-1">
                            <Flame className="h-3 w-3 text-orange-500" />
                            <span className="text-orange-500 text-sm font-medium">{allEntries[0].currentStreak}</span>
                          </div>
                        )}
                        {allEntries[0].lukuPoints > 0 && (
                          <div className="flex items-center gap-1">
                            <Coins className="h-3 w-3 text-green-500" />
                            <span className="text-green-500 text-sm font-medium">{allEntries[0].lukuPoints}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-yellow-400 text-xl font-bold">{(allEntries[0].rating).toFixed(1)}</p>
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
                      <div className="flex items-center justify-center gap-3 mb-2">
                        {allEntries[2].currentStreak > 0 && (
                          <div className="flex items-center gap-1">
                            <Flame className="h-3 w-3 text-orange-500" />
                            <span className="text-orange-500 text-sm font-medium">{allEntries[2].currentStreak}</span>
                          </div>
                        )}
                        {allEntries[2].lukuPoints > 0 && (
                          <div className="flex items-center gap-1">
                            <Coins className="h-3 w-3 text-green-500" />
                            <span className="text-green-500 text-sm font-medium">{allEntries[2].lukuPoints}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-amber-300 text-lg font-medium">{(allEntries[2].rating).toFixed(1)}</p>
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
                        index === 1 ? 'border-gray-400 bg-gray-700/20' : 
                        index === 2 ? 'border-amber-600 bg-amber-900/20' : ''
                      }`}
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Rank and User Info */}
                        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-gray-900' : 
                            index === 1 ? 'bg-gray-500 text-white' :
                            index === 2 ? 'bg-amber-600 text-white' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <Avatar className="w-8 h-8 sm:w-12 sm:h-12 flex-shrink-0">
                              <AvatarImage src={entry.userPhotoURL || '/default-avatar.png'} />
                              <AvatarFallback className="bg-gray-700 text-white font-bold text-xs sm:text-base">
                                {entry.username?.[0]?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                <span className={`font-medium text-sm sm:text-base truncate ${
                                  index === 0 ? 'text-yellow-400' : 
                                  index === 1 ? 'text-gray-300' :
                                  index === 2 ? 'text-amber-600' :
                                  'text-white'
                                }`}>
                                  {entry.username}
                                </span>
                                <div className="flex items-center gap-2 mt-1 sm:mt-0">
                                  {entry.currentStreak > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Flame className="h-3 w-3 text-orange-500" />
                                      <span className="text-orange-500 text-xs font-medium">{entry.currentStreak}</span>
                                    </div>
                                  )}
                                  {entry.lukuPoints > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Coins className="h-3 w-3 text-green-500" />
                                      <span className="text-green-500 text-xs font-medium">{entry.lukuPoints}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Score */}
                        <div className={`font-bold text-base sm:text-lg flex-shrink-0 ${index === 0 ? 'text-yellow-400' : 'text-gray-300'}`}>
                          {(entry.rating).toFixed(1)}
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
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{entry.username}</span>
                              <div className="flex items-center gap-2">
                                {entry.currentStreak > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Flame className="h-3 w-3 text-orange-500" />
                                    <span className="text-orange-500 text-xs font-medium">{entry.currentStreak}</span>
                                  </div>
                                )}
                                {entry.lukuPoints > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Coins className="h-3 w-3 text-green-500" />
                                    <span className="text-green-500 text-xs font-medium">{entry.lukuPoints}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Score */}
                        <div className="text-gray-300 font-medium">
                          {(entry.rating).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </>
            )}
        </div>

        {/* User Profile Modal */}
        <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
          <DialogContent className="max-w-lg bg-gray-800 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
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
                        <div className="text-yellow-400 text-sm">Rating: {(selectedEntry.rating).toFixed(1)}</div>
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
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <div className="text-gray-400 text-sm">Style Score</div>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {(selectedEntry.rating).toFixed(1)}
                        </div>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Coins className="h-4 w-4 text-green-500" />
                          <div className="text-gray-400 text-sm">LukuPoints</div>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {selectedEntry.lukuPoints}
                        </div>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Flame className="h-4 w-4 text-orange-500" />
                          <div className="text-gray-400 text-sm">Current Streak</div>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {selectedEntry.currentStreak}
                        </div>
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
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      Outfit of the Day
                    </h4>
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-600 mb-3">
                      <Image
                        src={selectedEntry.outfitImageURL}
                        alt="User's outfit"
                        width={400}
                        height={400}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* AI Feedback - only for daily entries */}
                {'complimentOrCritique' in selectedEntry && selectedEntry.complimentOrCritique && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                      <Heart className="h-4 w-4 text-pink-400" />
                      AI Style Compliment
                    </h4>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {selectedEntry.complimentOrCritique.length > 150 
                        ? selectedEntry.complimentOrCritique.substring(0, 150) + "..." 
                        : selectedEntry.complimentOrCritique
                      }
                    </p>
                  </div>
                )}

                {/* Social Links */}
                {('instagramUrl' in selectedEntry || 'tiktokUrl' in selectedEntry) && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3">Connect with {selectedEntry.username}</h4>
                    <div className="space-y-2">
                      {'instagramUrl' in selectedEntry && selectedEntry.instagramUrl && (
                        <a 
                          href={selectedEntry.instagramUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-600 transition-colors group"
                        >
                          <Instagram className="h-5 w-5 text-pink-500" />
                          <div>
                            <div className="text-white group-hover:text-pink-400 transition-colors">Instagram</div>
                            <div className="text-gray-400 text-xs">Follow their style journey</div>
                          </div>
                        </a>
                      )}
                      {'tiktokUrl' in selectedEntry && selectedEntry.tiktokUrl && (
                        <a 
                          href={selectedEntry.tiktokUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-600 transition-colors group"
                        >
                          <div className="h-5 w-5 bg-gradient-to-r from-red-500 to-black rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">tt</span>
                          </div>
                          <div>
                            <div className="text-white group-hover:text-red-400 transition-colors">TikTok</div>
                            <div className="text-gray-400 text-xs">Check out their content</div>
                          </div>
                        </a>
                      )}
                    </div>
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