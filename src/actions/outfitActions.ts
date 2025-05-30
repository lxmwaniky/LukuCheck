
'use server';
import { db } from '@/config/firebase'; // Client SDK
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc as getFirestoreDoc } from 'firebase/firestore';

export interface ProcessedOutfit extends StyleSuggestionsOutput {
 outfitImageURL: string;
 submittedToLeaderboard?: boolean;
}

import { getStyleSuggestions, type StyleSuggestionsOutput } from '@/ai/flows/style-suggestions';

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
  complimentOrCritique?: string;
  colorSuggestions?: string[];
  lookSuggestions?: string;
  tiktokUrl?: string | null;
  instagramUrl?: string | null;
}


export async function getLeaderboardData({ leaderboardDate }: { leaderboardDate: string }): Promise<{ date: string; entries: LeaderboardEntry[]; message?: string, error?: string }> {
  try {
    if (!leaderboardDate || !/^\d{4}-\d{2}-\d{2}$/.test(leaderboardDate)) {
        return { date: new Date().toISOString().split('T')[0], entries: [], error: "Invalid or missing date for leaderboard." };
    }

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
      let userData: any = { username: outfitData.username, photoURL: outfitData.userPhotoURL, tiktokUrl: null, instagramUrl: null }; // Default to outfit data
      
      if (outfitData.userId) {
        const userDocRef = doc(db, 'users', outfitData.userId);
        const userDocSnap = await getFirestoreDoc(userDocRef);
        if (userDocSnap.exists()) {
          const firestoreUserData = userDocSnap.data();
          userData.username = firestoreUserData.username || outfitData.username;
          userData.photoURL = firestoreUserData.customPhotoURL || firestoreUserData.photoURL || outfitData.userPhotoURL;
          userData.tiktokUrl = firestoreUserData.tiktokUrl || null;
          userData.instagramUrl = firestoreUserData.instagramUrl || null;
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
    return { date: leaderboardDate || new Date().toISOString().split('T')[0], entries: [], error: errorMessage };
  }
}
