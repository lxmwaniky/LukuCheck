
'use server';
import { db, storage } from '@/config/firebase'; // Client SDK
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc as getFirestoreDoc, addDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export interface ProcessedOutfit extends StyleSuggestionsOutput {
 outfitImageURL: string;
 submittedToLeaderboard?: boolean;
}

import { getStyleSuggestions, type StyleSuggestionsOutput } from '@/ai/flows/style-suggestions';

// Timeline configuration - Leaderboard releases at 6 PM local time
const LEADERBOARD_RELEASE_HOUR = 18; // 6 PM

/**
 * Check if today's leaderboard should be visible based on the release schedule
 */
function shouldShowTodaysLeaderboard(): { shouldShow: boolean; timeUntilRelease: number } {
  const now = new Date();
  const currentHour = now.getHours();
  
  // If it's after 6 PM, show today's leaderboard
  if (currentHour >= LEADERBOARD_RELEASE_HOUR) {
    return { shouldShow: true, timeUntilRelease: 0 };
  }
  
  // If it's before 6 PM, calculate time until release
  const releaseTime = new Date();
  releaseTime.setHours(LEADERBOARD_RELEASE_HOUR, 0, 0, 0);
  
  const timeUntilRelease = releaseTime.getTime() - now.getTime();
  
  return { shouldShow: false, timeUntilRelease };
}

export async function processOutfitWithAI(
  { photoDataUri }: { photoDataUri: string }
): Promise<{success: boolean; data?: StyleSuggestionsOutput; error?: string; limitReached?: boolean}> {

  try {
    const aiResult = await getStyleSuggestions({ photoDataUri });

    if (!aiResult || typeof aiResult.rating === 'undefined') {
      return { success: false, error: 'AI processing failed to return valid data.' };
    }
    
    return { 
      success: true, 
      data: aiResult
    };

  } catch (error: any) {
    console.error('Error processing outfit with AI:', error);
    let errorMessage = 'Failed to process outfit with AI.';
    if (error.message) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string | null;
  userPhotoURL: string | null;
  outfitImageURL: string;
  rating: number;
  submittedAt: Date;
  // Fields for detailed view
  complimentOrCritique?: string;
  colorSuggestions?: string[];
  lookSuggestions?: string;
  tiktokUrl?: string | null;
  instagramUrl?: string | null;
  lukuPoints: number;
  currentStreak: number;
}

export async function getLeaderboardData({ leaderboardDate }: { leaderboardDate: string }): Promise<{ date: string; entries: LeaderboardEntry[]; message?: string, error?: string, isWaitingForRelease?: boolean, timeUntilRelease?: number }> {
  if (!db) {
    throw new Error('Database is not initialized');
  }

  try {
    if (!leaderboardDate || !/^\d{4}-\d{2}-\d{2}$/.test(leaderboardDate)) {
        return { date: new Date().toISOString().split('T')[0], entries: [], error: "Invalid or missing date for leaderboard." };
    }

    const now = new Date();
    const requestedDate = new Date(leaderboardDate + 'T00:00:00Z');
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we're requesting today's leaderboard
    if (leaderboardDate === today) {
      const releaseTime = shouldShowTodaysLeaderboard();
      
      if (!releaseTime.shouldShow) {
        // Show previous day's leaderboard instead
        const previousDate = new Date(now);
        previousDate.setDate(previousDate.getDate() - 1);
        const previousDateStr = previousDate.toISOString().split('T')[0];
        
        console.log(`Today's leaderboard not released yet. Showing ${previousDateStr} instead.`);
        
        const previousResult = await getLeaderboardDataForDate(previousDateStr);
        return {
          ...previousResult,
          isWaitingForRelease: true,
          timeUntilRelease: releaseTime.timeUntilRelease,
          message: `Showing yesterday's results. Today's leaderboard releases in ${Math.ceil(releaseTime.timeUntilRelease / (1000 * 60 * 60))} hours.`
        };
      }
    }

    // Show the requested date's leaderboard (either today after release time, or any past date)
    return await getLeaderboardDataForDate(leaderboardDate);

  } catch (error: any) {
    console.error('Error fetching leaderboard data:', error);
    let errorMessage = 'Failed to fetch leaderboard data.';
    if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied to fetch leaderboard data. Check Firestore rules.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { date: leaderboardDate || new Date().toISOString().split('T')[0], entries: [], error: errorMessage };
  }
}

// Helper function to actually fetch leaderboard data for a specific date
async function getLeaderboardDataForDate(leaderboardDate: string): Promise<{ date: string; entries: LeaderboardEntry[]; message?: string, error?: string }> {
  if (!db) {
    throw new Error('Database is not initialized');
  }
  
  try {
    const outfitsCollectionRef = collection(db, 'outfits');

    const outfitsQuery = query(
      outfitsCollectionRef,
      where('leaderboardDate', '==', leaderboardDate),
      orderBy('rating', 'desc'),
      orderBy('submittedAt', 'asc')
    );

    const querySnapshot = await getDocs(outfitsQuery);
    
    const userProfilePromises = querySnapshot.docs.map(async (outfitDoc) => {
      const outfitData = outfitDoc.data();
      let userData: { 
        username: string | null; 
        photoURL: string | null; 
        tiktokUrl: string | null; 
        instagramUrl: string | null;
        lukuPoints: number;
        currentStreak: number;
      } = { 
        username: outfitData.username, 
        photoURL: outfitData.userPhotoURL, 
        tiktokUrl: null, 
        instagramUrl: null,
        lukuPoints: 0,
        currentStreak: 0,
      }; 
      
      if (outfitData.userId && db) {
        const userDocRef = doc(db, 'users', outfitData.userId);
        const userDocSnap = await getFirestoreDoc(userDocRef);
        if (userDocSnap.exists()) {
          const firestoreUserData = userDocSnap.data() as any;
          userData.username = firestoreUserData.username || outfitData.username;
          userData.photoURL = firestoreUserData.customPhotoURL || firestoreUserData.photoURL || outfitData.userPhotoURL;
          userData.tiktokUrl = firestoreUserData.tiktokUrl || null;
          userData.instagramUrl = firestoreUserData.instagramUrl || null;
          userData.lukuPoints = typeof firestoreUserData.lukuPoints === 'number' ? firestoreUserData.lukuPoints : 0;
          userData.currentStreak = firestoreUserData.currentStreak || 0;
        }
      }
      return { outfitDoc, userData };
    });

    const resolvedEntriesData = await Promise.all(userProfilePromises);

    const entries: LeaderboardEntry[] = resolvedEntriesData.map(({ outfitDoc, userData }) => {
      const outfitData = outfitDoc.data();
      return {
        id: outfitDoc.id,
        userId: outfitData.userId,
        username: userData.username,
        userPhotoURL: userData.photoURL,
        outfitImageURL: outfitData.outfitImageURL,
        rating: outfitData.rating,
        submittedAt: (outfitData.submittedAt as Timestamp).toDate(),
        complimentOrCritique: outfitData.complimentOrCritique,
        colorSuggestions: outfitData.colorSuggestions,
        lookSuggestions: outfitData.lookSuggestions,
        tiktokUrl: userData.tiktokUrl,
        instagramUrl: userData.instagramUrl,
        lukuPoints: typeof userData.lukuPoints === 'number' ? userData.lukuPoints : 0,
        currentStreak: userData.currentStreak,
      };
    });

    let message;
    if (entries.length === 0) {
       message = `No submissions found for ${leaderboardDate}.`;
    } else {
       message = `Displaying ${entries.length} entries for ${leaderboardDate}.`;
    }

    return { date: leaderboardDate, entries, message };

  } catch (error: any) {
    console.error('Error fetching leaderboard data:', error);
    let errorMessage = 'Failed to fetch leaderboard data.';
    if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied to fetch leaderboard data. Check Firestore rules.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { date: leaderboardDate, entries: [], error: errorMessage };
  }
}

/**
 * Weekly leaderboard aggregating all submissions for a given week
 */
export async function getWeeklyLeaderboardData({ weekStart }: { weekStart: string }): Promise<{ 
  weekStart: string; 
  weekEnd: string;
  entries: Array<{
    userId: string;
    username: string | null;
    userPhotoURL: string | null;
    totalSubmissions: number;
    avgRating: number;
    bestRating: number;
    totalPoints: number;
    lukuPoints: number;
    currentStreak: number;
  }>; 
  message?: string; 
  error?: string; 
}> {
  if (!db) {
    throw new Error('Database is not initialized');
  }

  try {
    // Calculate week end date (6 days after start)
    const weekStartDate = new Date(weekStart + 'T00:00:00Z');
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEnd = weekEndDate.toISOString().split('T')[0];

    // Only include days that should be visible in leaderboard
    // For weekly leaderboard, we only count days where leaderboard has been released
    const today = new Date().toISOString().split('T')[0];
    const shouldShowToday = shouldShowTodaysLeaderboard().shouldShow;
    
    // Determine the effective end date for the query
    let queryEndDate = weekEnd;
    if (weekEnd >= today && !shouldShowToday) {
      // If the week includes today and today's leaderboard isn't released yet,
      // only query up to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      queryEndDate = yesterday.toISOString().split('T')[0];
    }

    // Get all submissions for the week (only for released days)
    const outfitsCollectionRef = collection(db, 'outfits');
    const outfitsQuery = query(
      outfitsCollectionRef,
      where('leaderboardDate', '>=', weekStart),
      where('leaderboardDate', '<=', queryEndDate),
      orderBy('leaderboardDate', 'asc')
    );

    const querySnapshot = await getDocs(outfitsQuery);
    
    // Group submissions by user
    const userStats = new Map<string, {
      userId: string;
      username: string | null;
      userPhotoURL: string | null;
      submissions: Array<{ rating: number; date: string }>;
      lukuPoints: number;
      currentStreak: number;
    }>();

    // Process each submission
    for (const outfitDoc of querySnapshot.docs) {
      const outfit = outfitDoc.data();
      const userId = outfit.userId;
      
      if (!userStats.has(userId)) {
        // Get user profile data
        let userData = {
          username: outfit.username,
          photoURL: outfit.userPhotoURL,
          lukuPoints: 0,
          currentStreak: 0
        };

        if (userId && db) {
          const userDocRef = doc(db, 'users', userId);
          const userDocSnap = await getFirestoreDoc(userDocRef);
          if (userDocSnap.exists()) {
            const firestoreUserData = userDocSnap.data() as any;
            userData.username = firestoreUserData.username || outfit.username;
            userData.photoURL = firestoreUserData.customPhotoURL || firestoreUserData.photoURL || outfit.userPhotoURL;
            userData.lukuPoints = typeof firestoreUserData.lukuPoints === 'number' ? firestoreUserData.lukuPoints : 0;
            userData.currentStreak = firestoreUserData.currentStreak || 0;
          }
        }

        userStats.set(userId, {
          userId,
          username: userData.username,
          userPhotoURL: userData.photoURL,
          submissions: [],
          lukuPoints: userData.lukuPoints,
          currentStreak: userData.currentStreak
        });
      }

      userStats.get(userId)!.submissions.push({
        rating: outfit.rating,
        date: outfit.leaderboardDate
      });
    }

    // Calculate weekly rankings
    const entries = Array.from(userStats.values()).map(user => {
      const submissions = user.submissions;
      const totalSubmissions = submissions.length;
      const avgRating = totalSubmissions > 0 ? 
        submissions.reduce((sum, sub) => sum + sub.rating, 0) / totalSubmissions : 0;
      const bestRating = totalSubmissions > 0 ? 
        Math.max(...submissions.map(sub => sub.rating)) : 0;
      
      // Calculate weekly points based on performance
      const totalPoints = Math.round((avgRating * totalSubmissions * 10) + (bestRating * 5));

      return {
        userId: user.userId,
        username: user.username,
        userPhotoURL: user.userPhotoURL,
        totalSubmissions,
        avgRating: Math.round(avgRating * 10) / 10,
        bestRating,
        totalPoints,
        lukuPoints: user.lukuPoints,
        currentStreak: user.currentStreak
      };
    })
    // Sort by total points (primary), then by best rating (secondary)
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return b.bestRating - a.bestRating;
    });

    const message = entries.length === 0 
      ? `No submissions found for week ${weekStart} to ${weekEnd}.`
      : queryEndDate < weekEnd 
        ? `Weekly standings through ${queryEndDate} with ${entries.length} participants. Updates daily at ${LEADERBOARD_RELEASE_HOUR}:00.`
        : `Weekly leaderboard for ${weekStart} to ${weekEnd} with ${entries.length} participants.`;

    return {
      weekStart,
      weekEnd,
      entries,
      message
    };

  } catch (error: any) {
    console.error('Error fetching weekly leaderboard data:', error);
    const errorMessage = error.message || 'Failed to fetch weekly leaderboard data.';
    
    const weekStartDate = new Date(weekStart + 'T00:00:00Z');
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEnd = weekEndDate.toISOString().split('T')[0];
    
    return {
      weekStart,
      weekEnd,
      entries: [],
      error: errorMessage
    };
  }
}

/**
 * Get the start date of the current week (Monday)
 */
export async function getCurrentWeekStart(): Promise<string> {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days; otherwise, go back to Monday

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  return monday.toISOString().split('T')[0];
}