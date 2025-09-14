
'use server';

import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type UserRecord as AdminUserRecord } from 'firebase-admin/auth';
import { adminDb, adminInitialized, getAdminStorageBucket } from '@/config/firebaseAdmin';
import type { UserProfile } from '@/contexts/AuthContext';
import { revalidatePath } from 'next/cache';
import { differenceInCalendarDays, subDays, format as formatDateFns } from 'date-fns';
import { getLeaderboardData } from '@/actions/outfitActions'; // To check previous day's leaderboard

// Badge and Point Constants
const PROFILE_PRO_BADGE = "PROFILE_PRO";
const FIRST_SUBMISSION_BADGE = "FIRST_SUBMISSION";
const STREAK_STARTER_3_BADGE = "STREAK_STARTER_3";
const STREAK_KEEPER_7_BADGE = "STREAK_KEEPER_7";
const TOP_3_FINISHER_BADGE = "TOP_3_FINISHER";
const PERFECT_SCORE_BADGE = "PERFECT_SCORE";
const CENTURY_CLUB_BADGE = "CENTURY_CLUB";
const LEGEND_STATUS_BADGE = "LEGEND_STATUS";
const PREMIUM_STYLIST_BADGE = "PREMIUM_STYLIST";
// NEW BADGES
const STYLE_ROOKIE_BADGE = "STYLE_ROOKIE";
const WEEKEND_WARRIOR_BADGE = "WEEKEND_WARRIOR";

const POINTS_PROFILE_PRO = 5;
const POINTS_FIRST_SUBMISSION = 3;
const POINTS_STREAK_STARTER_3 = 2;
const POINTS_STREAK_KEEPER_7 = 5;
const POINTS_DAILY_STREAK_SUBMISSION = 1;
// NEW POINTS
const POINTS_STYLE_ROOKIE = 1; // Bonus for reaching 15 points
const POINTS_WEEKEND_SUBMISSION = 1; // Extra point for weekend submissions
const POINTS_STREAK_SHIELD_COST = 10; // Cost to protect a streak
const POINTS_TOP_3_RANK_1 = 5;
const POINTS_TOP_3_RANK_2 = 3;
const POINTS_TOP_3_RANK_3 = 2;
const POINTS_PERFECT_SCORE = 5;


interface UpdateProfileArgs {
  userId: string;
  username?: string;
  photoDataUrl?: string;
  currentPhotoUrl?: string | null;
  tiktokUrl?: string;
  instagramUrl?: string;
}

export async function createUserProfileInFirestore(
  userId: string,
  email: string,
  username: string
): Promise<{ success: boolean; error?: string }> {
  if (!adminInitialized || !adminDb) {
    return { success: false, error: "Server error: Admin SDK not configured. Profile creation failed." };
  }

  const userRef = adminDb.collection('users').doc(userId);
  try {
    const initialLukuPoints = 5;
    const initialBadges: string[] = [];

    if (initialLukuPoints >= 250 && !initialBadges.includes(LEGEND_STATUS_BADGE)) {
        initialBadges.push(LEGEND_STATUS_BADGE);
    } else if (initialLukuPoints >= 100 && !initialBadges.includes(CENTURY_CLUB_BADGE)) {
        initialBadges.push(CENTURY_CLUB_BADGE);
    }

    console.log('Creating user profile:', { 
      userId, 
      email, 
      username,
      initialLukuPoints 
    });

    await userRef.set({
      uid: userId,
      email: email,
      username: username,
      photoURL: null,
      customPhotoURL: null,
      emailVerified: false,
      createdAt: FieldValue.serverTimestamp(),
      lastLogin: FieldValue.serverTimestamp(),
      tiktokUrl: null,
      instagramUrl: null,
      lukuPoints: initialLukuPoints,
      tiktokPointsAwarded: false,
      instagramPointsAwarded: false,
      badges: initialBadges,
      currentStreak: 0,
      lastSubmissionDate: null,
      lastTop3BonusDate: null,
      role: 'user', // Default role
      isPremium: false, // Default premium status
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeSubscriptionStatus: null,
      aiUsageLimit: null, // Initialize with no custom limit
    });

    const adminAuth = getAdminAuth();
    await adminAuth.updateUser(userId, { displayName: username });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Failed to create Firestore user profile: ${error.message || "Unknown error"}` };
  }
}


export async function updateUserProfileInFirestore({
  userId,
  username,
  photoDataUrl,
  currentPhotoUrl,
  tiktokUrl,
  instagramUrl,
}: UpdateProfileArgs): Promise<{ success: boolean; message?: string; error?: string; newPhotoURL?: string }> {
  if (!adminInitialized || !adminDb) {
    return { success: false, error: "Server error: Admin SDK not configured. Profile update failed." };
  }

  // Validate username on server side
  if (typeof username === 'string') {
    const trimmedUsername = username.trim();
    
    if (trimmedUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters long.' };
    }
    
    if (trimmedUsername.length > 20) {
      return { success: false, error: 'Username cannot exceed 20 characters.' };
    }
    
    // Check for valid characters (letters, numbers, underscores, hyphens, spaces)
    const validCharacterRegex = /^[a-zA-Z0-9_\- ]+$/;
    if (!validCharacterRegex.test(trimmedUsername)) {
      return { success: false, error: 'Username can only contain letters, numbers, spaces, underscores, and hyphens.' };
    }
    
    // Check for excessive whitespace
    if (trimmedUsername.includes('  ')) {
      return { success: false, error: 'Username cannot contain consecutive spaces.' };
    }
    
    // Check if starts or ends with special characters
    if (/^[-_\s]/.test(trimmedUsername) || /[-_\s]$/.test(trimmedUsername)) {
      return { success: false, error: 'Username cannot start or end with spaces, underscores, or hyphens.' };
    }
  }

  const adminAuth = getAdminAuth();
  const userRefAdmin = adminDb.collection('users').doc(userId);
  const updateDataFirestore: { [key: string]: any } = {};
  const authUpdatePayload: { displayName?: string; photoURL?: string } = {};
  let newPublicPhotoURL: string | undefined = undefined;
  let pointsToAwardThisUpdate = 0;
  const newBadgesToAdd: string[] = [];

  try {
    const userDocSnap = await userRefAdmin.get();
    if (!userDocSnap.exists) {
      return { success: false, error: "User profile not found in Firestore." };
    }
    const currentUserData = userDocSnap.data() as UserProfile;
    const currentBadges = currentUserData.badges || [];
    let currentLukuPoints = currentUserData.lukuPoints || 0;

    if (typeof username === 'string' && username.trim() !== currentUserData.username) {
      const trimmedUsername = username.trim();
      updateDataFirestore.username = trimmedUsername;
      authUpdatePayload.displayName = trimmedUsername;
    }

    if (typeof tiktokUrl === 'string') {
      const newTiktok = tiktokUrl.trim() === '' ? null : tiktokUrl.trim();
      updateDataFirestore.tiktokUrl = newTiktok;
      if (newTiktok && !currentUserData.tiktokUrl && !currentUserData.tiktokPointsAwarded) {
        pointsToAwardThisUpdate += 1;
        updateDataFirestore.tiktokPointsAwarded = true;
      }
    }

    if (typeof instagramUrl === 'string') {
      const newInstagram = instagramUrl.trim() === '' ? null : instagramUrl.trim();
      updateDataFirestore.instagramUrl = newInstagram;
      if (newInstagram && !currentUserData.instagramUrl && !currentUserData.instagramPointsAwarded) {
        pointsToAwardThisUpdate += 1;
        updateDataFirestore.instagramPointsAwarded = true;
      }
    }

    const photoFieldForBadgeCheck = photoDataUrl || currentUserData.customPhotoURL;
    const tiktokFieldForBadgeCheck = (updateDataFirestore.tiktokUrl !== undefined ? updateDataFirestore.tiktokUrl !== null : currentUserData.tiktokUrl !== null && currentUserData.tiktokUrl !== undefined && currentUserData.tiktokUrl.trim() !== '');
    const instagramFieldForBadgeCheck = (updateDataFirestore.instagramUrl !== undefined ? updateDataFirestore.instagramUrl !== null : currentUserData.instagramUrl !== null && currentUserData.instagramUrl !== undefined && currentUserData.instagramUrl.trim() !== '');

    // Award Profile Pro badge if user has custom photo OR at least one social link
    const hasCustomPhoto = photoFieldForBadgeCheck;
    const hasSocialLinks = tiktokFieldForBadgeCheck || instagramFieldForBadgeCheck;
    
    if ((hasCustomPhoto || hasSocialLinks) && !currentBadges.includes(PROFILE_PRO_BADGE)) {
        newBadgesToAdd.push(PROFILE_PRO_BADGE);
        pointsToAwardThisUpdate += POINTS_PROFILE_PRO;
    }


    if (photoDataUrl) {
      const adminBucket = await getAdminStorageBucket();
      if (!adminBucket) {
        return { success: false, error: "Server error: Storage service not available." };
      }

      if (currentUserData.customPhotoURL && currentUserData.customPhotoURL.includes(adminBucket.name)) {
        try {
          const urlParts = new URL(currentUserData.customPhotoURL);
          let filePath = decodeURIComponent(urlParts.pathname.substring(1));
          if (filePath.startsWith(`${adminBucket.name}/`)) {
            filePath = filePath.substring(`${adminBucket.name}/`.length);
          }
          if (filePath) {
            await adminBucket.file(filePath).delete({ ignoreNotFound: true });
          }
        } catch (e: any) {
        }
      }

      const photoFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
      const photoStorageRefPath = `profilePictures/${userId}/${photoFileName}`;
      const file = adminBucket.file(photoStorageRefPath);
      const imageBuffer = Buffer.from(photoDataUrl.split(',')[1], 'base64');
      await file.save(imageBuffer, { metadata: { contentType: 'image/jpeg' } });
      await file.makePublic();
      newPublicPhotoURL = file.publicUrl();

      updateDataFirestore.photoURL = newPublicPhotoURL;
      updateDataFirestore.customPhotoURL = newPublicPhotoURL;
      authUpdatePayload.photoURL = newPublicPhotoURL;
    }

    if (pointsToAwardThisUpdate > 0) {
        updateDataFirestore.lukuPoints = FieldValue.increment(pointsToAwardThisUpdate);
        currentLukuPoints += pointsToAwardThisUpdate;
    }

    if (currentLukuPoints >= 250 && !currentBadges.includes(LEGEND_STATUS_BADGE) && !newBadgesToAdd.includes(LEGEND_STATUS_BADGE)) {
        newBadgesToAdd.push(LEGEND_STATUS_BADGE);
    } else if (currentLukuPoints >= 100 && !currentBadges.includes(CENTURY_CLUB_BADGE) && !newBadgesToAdd.includes(CENTURY_CLUB_BADGE)) {
        newBadgesToAdd.push(CENTURY_CLUB_BADGE);
    } else if (currentLukuPoints >= 15 && !currentBadges.includes(STYLE_ROOKIE_BADGE) && !newBadgesToAdd.includes(STYLE_ROOKIE_BADGE)) {
        newBadgesToAdd.push(STYLE_ROOKIE_BADGE);
        // Award bonus point for reaching Style Rookie status
        updateDataFirestore.lukuPoints = FieldValue.increment(POINTS_STYLE_ROOKIE);
        currentLukuPoints += POINTS_STYLE_ROOKIE;
    }

    if (newBadgesToAdd.length > 0) {
        updateDataFirestore.badges = FieldValue.arrayUnion(...newBadgesToAdd);
    }

    if (Object.keys(authUpdatePayload).length > 0) {
      await adminAuth.updateUser(userId, authUpdatePayload);
    }

    if (Object.keys(updateDataFirestore).length > 0) {
        await userRefAdmin.update(updateDataFirestore);
    } else if (Object.keys(authUpdatePayload).length === 0) {
        return { success: true, message: 'No changes detected to update profile.', newPhotoURL: newPublicPhotoURL };
    }

    revalidatePath('/profile');
    revalidatePath('/');
    return { success: true, message: 'Profile updated successfully.', newPhotoURL: newPublicPhotoURL };

  } catch (error: any) {
    let errorMessage = `Profile update failed: ${error.message || "Unknown error"}`;
    if (error.code === 'auth/user-not-found') errorMessage = "User not found in Firebase Authentication.";
    if (error.code === 'storage/unauthorized' || (error.errors && error.errors.some((e:any) => e.reason === 'forbidden'))) {
        errorMessage = "Permission denied to upload photo. Check Firebase Storage rules or Admin SDK permissions for the bucket.";
      }
    return { success: false, error: errorMessage };
  }
}


export async function deleteUserData(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!adminInitialized || !adminDb) {
    return { success: false, error: "Server error: Admin SDK not configured. Account deletion failed." };
  }
  const adminAuthInstance = getAdminAuth();

  try {
    const batch = adminDb.batch();
    const userDocRef = adminDb.collection('users').doc(userId);

    const aiUsageCollectionRef = userDocRef.collection('aiUsage');
    const aiUsageSnapshot = await aiUsageCollectionRef.get();
    aiUsageSnapshot.docs.forEach(docSnap => batch.delete(docSnap.ref));

    batch.delete(userDocRef);

    const outfitsQuery = adminDb.collection('outfits').where('userId', '==', userId);
    const outfitsSnapshot = await outfitsQuery.get();
    outfitsSnapshot.docs.forEach(docSnapshot => batch.delete(docSnapshot.ref));

    await batch.commit();

    const adminBucket = await getAdminStorageBucket();
    if (adminBucket) {
      const profilePicturesPrefix = `profilePictures/${userId}/`;
      const [profileFiles] = await adminBucket.getFiles({ prefix: profilePicturesPrefix });
      await Promise.all(profileFiles.map(file => file.delete()));

      const outfitsPrefix = `outfits/${userId}/`;
      const [outfitFiles] = await adminBucket.getFiles({ prefix: outfitsPrefix });
      await Promise.all(outfitFiles.map(file => file.delete()));
    } else {
    }

    await adminAuthInstance.deleteUser(userId);

    revalidatePath('/profile');
    revalidatePath('/leaderboard');
    revalidatePath('/');
    return { success: true };

  } catch (error: any) {
    let errorMessage = `User data deletion failed: ${error.message || "Unknown error"}`;
     if (error.code === 'auth/user-not-found') {
        errorMessage = "User not found in Firebase Authentication, but data deletion may have partially proceeded.";
    }
    return { success: false, error: errorMessage };
  }
}


export async function checkUsernameAvailability(username: string): Promise<{available: boolean; message?: string}> {
  if (!adminInitialized || !adminDb) {
    return {available: false, message: "Server error: Cannot check username at this time."};
  }
  
  // Instagram-style validation
  if (username.length < 3) {
    return {available: false, message: "Username must be at least 3 characters."};
  }
  if (username.length > 30) {
    return {available: false, message: "Username must be 30 characters or less."};
  }
  
  // Check for valid characters: letters, numbers, periods, and underscores only
  const validUsernameRegex = /^[a-zA-Z0-9._]+$/;
  if (!validUsernameRegex.test(username)) {
    return {available: false, message: "Username can only contain letters, numbers, periods, and underscores."};
  }
  
  // No spaces allowed
  if (username.includes(' ')) {
    return {available: false, message: "Username cannot contain spaces."};
  }
  
  // Cannot start or end with period or underscore
  if (username.startsWith('.') || username.startsWith('_') || username.endsWith('.') || username.endsWith('_')) {
    return {available: false, message: "Username cannot start or end with a period or underscore."};
  }
  
  // Cannot have consecutive periods or underscores
  if (username.includes('..') || username.includes('__') || username.includes('._') || username.includes('_.')) {
    return {available: false, message: "Username cannot have consecutive special characters."};
  }
  
  // Convert to lowercase for uniqueness check (Instagram is case-insensitive)
  const lowercaseUsername = username.toLowerCase();
  
  const usersRef = adminDb.collection('users');
  // Check both original case and lowercase for uniqueness
  const querySnapshot = await usersRef.where('username', 'in', [username, lowercaseUsername]).limit(1).get();
  if (!querySnapshot.empty) {
    return {available: false, message: "This username is already taken. Please choose another."};
  }

  return {available: true, message: "Username is available!"};
}

export interface UserProfileStats {
  totalSubmissions: number;
  averageRating: number | null;
  highestRating: number | null;
}

export async function getUserProfileStats(userId: string): Promise<{ success: boolean; data?: UserProfileStats; error?: string }> {
  if (!adminInitialized || !adminDb) {
    return { success: false, error: "Server error: Admin SDK not configured." };
  }
  if (!userId) {
    return { success: false, error: "User ID is required to fetch profile stats." };
  }

  try {
    const outfitsCollectionRef = adminDb.collection('outfits');
    const q = outfitsCollectionRef.where('userId', '==', userId).orderBy('submittedAt', 'desc');
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return { success: true, data: { totalSubmissions: 0, averageRating: null, highestRating: null } };
    }

    let totalSubmissions = 0;
    let sumOfRatings = 0;
    let highestRating = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (typeof data.rating === 'number') {
        totalSubmissions++;
        sumOfRatings += data.rating;
        if (data.rating > highestRating) {
          highestRating = data.rating;
        }
      }
    });

    const averageRating = totalSubmissions > 0 ? parseFloat((sumOfRatings / totalSubmissions).toFixed(1)) : null;

    return {
      success: true,
      data: {
        totalSubmissions,
        averageRating,
        highestRating: totalSubmissions > 0 ? highestRating : null
      }
    };

  } catch (error: any) {
    return { success: false, error: `Failed to fetch profile stats: ${error.message || "Unknown error"}` };
  }
}


// REFERRAL FUNCTIONS REMOVED - These functions have been deleted as referral system is no longer used

export async function manualProcessProfileBadges(userId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!adminInitialized || !adminDb) {
    return { success: false, error: "Server error: Admin SDK not configured." };
  }

  try {
    const userDocRef = adminDb.collection('users').doc(userId);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
      return { success: false, error: "User document not found." };
    }

    const userData = userDocSnap.data() as UserProfile;
    const currentBadges = userData.badges || [];
    const newBadgesToAdd: string[] = [];
    let pointsToAward = 0;

    // Check Profile Pro badge eligibility
    const hasCustomPhoto = userData.customPhotoURL && userData.customPhotoURL.trim() !== '';
    const hasTikTok = userData.tiktokUrl && userData.tiktokUrl.trim() !== '';
    const hasInstagram = userData.instagramUrl && userData.instagramUrl.trim() !== '';
    const hasSocialLinks = hasTikTok || hasInstagram;

    if ((hasCustomPhoto || hasSocialLinks) && !currentBadges.includes(PROFILE_PRO_BADGE)) {
      newBadgesToAdd.push(PROFILE_PRO_BADGE);
      pointsToAward += POINTS_PROFILE_PRO;
    }

    if (newBadgesToAdd.length === 0) {
      return { success: false, error: "No new badges to award. Profile Pro badge requires custom photo OR social links." };
    }

    // Award the badges and points
    const updates: any = {};
    if (newBadgesToAdd.length > 0) {
      updates.badges = FieldValue.arrayUnion(...newBadgesToAdd);
    }
    if (pointsToAward > 0) {
      updates.lukuPoints = FieldValue.increment(pointsToAward);
    }

    await userDocRef.update(updates);

    return { 
      success: true, 
      message: `Awarded ${newBadgesToAdd.length} badge(s) and ${pointsToAward} points: ${newBadgesToAdd.join(', ')}` 
    };

  } catch (error: any) {
    return { success: false, error: `Failed to process profile badges: ${error.message || "Unknown error"}` };
  }
}

export async function handleLeaderboardSubmissionPerks(userId: string, submittedOutfitRating: number): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!adminInitialized || !adminDb) {
        return { success: false, error: "Server error: Admin SDK not configured." };
    }
    if (!userId) {
        return { success: false, error: "User ID is required." };
    }

    const userRef = adminDb.collection('users').doc(userId);

    try {
        let perksUpdated = false;
        await adminDb.runTransaction(async (transaction) => {
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists) {
                throw new Error("User profile not found.");
            }

            const userData = userSnap.data() as UserProfile & { lastTop3BonusDate?: string | null };
            let currentBadges = userData.badges || [];
            let currentLukuPoints = userData.lukuPoints || 0;
            let pointsToAward = 0;
            const newBadges: string[] = [];
            const updateData: { [key: string]: any } = {};

            // First Submission Badge
            if (!currentBadges.includes(FIRST_SUBMISSION_BADGE)) {
                newBadges.push(FIRST_SUBMISSION_BADGE);
                pointsToAward += POINTS_FIRST_SUBMISSION;
            }

            // Perfect Score Badge
            if (submittedOutfitRating === 10 && !currentBadges.includes(PERFECT_SCORE_BADGE) && !newBadges.includes(PERFECT_SCORE_BADGE)) {
                newBadges.push(PERFECT_SCORE_BADGE);
                pointsToAward += POINTS_PERFECT_SCORE;
            }


            // Streak Logic - Use local timezone for consistency
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            let currentStreak = userData.currentStreak || 0;

            if (userData.lastSubmissionDate !== todayStr) {
                if (userData.lastSubmissionDate) {
                    const lastSubmission = new Date(userData.lastSubmissionDate);
                    const today = new Date(todayStr);
                    const diffDays = differenceInCalendarDays(today, lastSubmission);

                    if (diffDays === 1) {
                        currentStreak++;
                    } else if (diffDays > 1) {
                        // Check if user has streak shield active
                        const hasActiveStreakShield = userData.streak_shield_lastUsed && 
                            userData.streak_shield_lastUsed.toDate && 
                            (new Date().getTime() - userData.streak_shield_lastUsed.toDate().getTime()) < (48 * 60 * 60 * 1000); // 48 hours
                        
                        if (hasActiveStreakShield && diffDays === 2) {
                            // Streak shield protects against 1 missed day
                            currentStreak++;
                            // Deactivate shield after use
                            updateData.streak_shield_lastUsed = null;
                        } else if (diffDays === 2) {
                            // Grace period: 2 submissions in next day can restore streak
                            // For now, just reset streak - recovery logic would be in a separate function
                            currentStreak = 1;
                        } else {
                            currentStreak = 1;
                        }
                    } else if (diffDays < 0 ) { // Should not happen if clocks are synced, but handle defensively
                        currentStreak = 1;
                      }
                } else {
                    currentStreak = 1;
                }

                pointsToAward += POINTS_DAILY_STREAK_SUBMISSION;
                
                // Weekend Warrior Bonus - extra point for weekend submissions
                const today = new Date(todayStr);
                const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
                if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend submission
                    pointsToAward += POINTS_WEEKEND_SUBMISSION;
                    
                    // Award Weekend Warrior badge if not already earned
                    if (!currentBadges.includes(WEEKEND_WARRIOR_BADGE) && !newBadges.includes(WEEKEND_WARRIOR_BADGE)) {
                        newBadges.push(WEEKEND_WARRIOR_BADGE);
                    }
                }
                
                updateData.lastSubmissionDate = todayStr;
                updateData.currentStreak = currentStreak;

                if (currentStreak >= 3 && !currentBadges.includes(STREAK_STARTER_3_BADGE) && !newBadges.includes(STREAK_STARTER_3_BADGE)) {
                    newBadges.push(STREAK_STARTER_3_BADGE);
                    pointsToAward += POINTS_STREAK_STARTER_3;
                }
                if (currentStreak >= 7 && !currentBadges.includes(STREAK_KEEPER_7_BADGE) && !newBadges.includes(STREAK_KEEPER_7_BADGE)) {
                    newBadges.push(STREAK_KEEPER_7_BADGE);
                    pointsToAward += POINTS_STREAK_KEEPER_7;
                }
            }

            // Top 3 Finisher Perks (for *yesterday's* performance)
            const yesterdayStr = formatDateFns(subDays(new Date(), 1), 'yyyy-MM-dd');
            if (userData.lastTop3BonusDate !== yesterdayStr) { // Check if bonus for yesterday was already awarded
                try {
                    const yesterdayLeaderboardData = await getLeaderboardData({ leaderboardDate: yesterdayStr });
                    if (yesterdayLeaderboardData.entries && yesterdayLeaderboardData.entries.length > 0) {
                        const userRankYesterday = yesterdayLeaderboardData.entries.findIndex(entry => entry.userId === userId) + 1;

                        let pointsForRank = 0;
                        if (userRankYesterday === 1) pointsForRank = POINTS_TOP_3_RANK_1;
                        else if (userRankYesterday === 2) pointsForRank = POINTS_TOP_3_RANK_2;
                        else if (userRankYesterday === 3) pointsForRank = POINTS_TOP_3_RANK_3;

                        if (pointsForRank > 0) {
                            pointsToAward += pointsForRank;
                            updateData.lastTop3BonusDate = yesterdayStr; // Mark that bonus for yesterday has been awarded
                            if (!currentBadges.includes(TOP_3_FINISHER_BADGE) && !newBadges.includes(TOP_3_FINISHER_BADGE)) {
                                newBadges.push(TOP_3_FINISHER_BADGE);
                            }
                        }
                    }
                } catch (e: any) {
                }
            }


            if (pointsToAward > 0) {
                updateData.lukuPoints = FieldValue.increment(pointsToAward);
                currentLukuPoints += pointsToAward; // Update local tracker for subsequent badge checks
            }

            // Check for Century Club / Legend Status badges based on the new total points
            if (currentLukuPoints >= 250 && !currentBadges.includes(LEGEND_STATUS_BADGE) && !newBadges.includes(LEGEND_STATUS_BADGE)) {
                newBadges.push(LEGEND_STATUS_BADGE);
            } else if (currentLukuPoints >= 100 && !currentBadges.includes(CENTURY_CLUB_BADGE) && !newBadges.includes(CENTURY_CLUB_BADGE)) {
                newBadges.push(CENTURY_CLUB_BADGE);
            } else if (currentLukuPoints >= 15 && !currentBadges.includes(STYLE_ROOKIE_BADGE) && !newBadges.includes(STYLE_ROOKIE_BADGE)) {
                newBadges.push(STYLE_ROOKIE_BADGE);
                // Award bonus point for reaching Style Rookie status
                pointsToAward += POINTS_STYLE_ROOKIE;
                updateData.lukuPoints = FieldValue.increment(pointsToAward);
                currentLukuPoints += POINTS_STYLE_ROOKIE;
            }

            if (newBadges.length > 0) {
                updateData.badges = FieldValue.arrayUnion(...newBadges);
            }


            if (Object.keys(updateData).length > 0) {
                transaction.update(userRef, updateData);
                perksUpdated = true;
            }
        });

        if (perksUpdated) {
            revalidatePath('/profile');
            revalidatePath('/leaderboard');
        }
        return { success: true, message: "Leaderboard submission perks processed." };

    } catch (error: any) {
        return { success: false, error: `Failed to process submission perks: ${error.message || "Unknown error"}` };
    }
}

/**
 * Point spending system for various features
 */
export async function spendPoints(userId: string, pointCost: number, purchaseType: 'streak_shield' | 'ai_powerup' | 'profile_boost'): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!adminInitialized || !adminDb) {
        return { success: false, error: "Server error: Database not available" };
    }

    try {
        const userRef = adminDb.collection('users').doc(userId);
        
        const result = await adminDb.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            
            if (!userDoc.exists) {
                return { success: false, error: "User profile not found" };
            }

            const userData = userDoc.data()!;
            const currentPoints = userData.lukuPoints || 0;
            
            if (currentPoints < pointCost) {
                return { success: false, error: `Insufficient points. You have ${currentPoints}, need ${pointCost}` };
            }

            // Deduct points
            transaction.update(userRef, {
                lukuPoints: FieldValue.increment(-pointCost),
                lastPointSpend: Timestamp.now(),
                [`${purchaseType}_lastUsed`]: Timestamp.now()
            });

            let message = '';
            switch (purchaseType) {
                case 'streak_shield':
                    message = 'Streak Shield activated! Your next missed day won\'t break your streak.';
                    break;
                case 'ai_powerup':
                    message = 'AI Power-up activated! You can now submit one extra outfit today.';
                    break;
                case 'profile_boost':
                    message = 'Profile boost activated! Your profile will be featured in searches.';
                    break;
            }

            return { success: true, message };
        });

        revalidatePath('/profile');
        return result;

    } catch (error: any) {
        return { success: false, error: `Failed to spend points: ${error.message || "Unknown error"}` };
    }
}

/**
 * Check if user can use a specific purchased feature
 */
export async function canUsePurchasedFeature(userId: string, featureType: 'streak_shield' | 'ai_powerup' | 'profile_boost'): Promise<{ canUse: boolean; reason?: string }> {
    if (!adminInitialized || !adminDb) {
        return { canUse: false, reason: "Server error" };
    }

    try {
        const userRef = adminDb.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            return { canUse: false, reason: "User not found" };
        }

        const userData = userDoc.data()!;
        const lastUsed = userData[`${featureType}_lastUsed`];
        
        if (!lastUsed) {
            return { canUse: false, reason: "Feature not purchased" };
        }

        // Check if feature is still active (24 hours for most features)
        const now = new Date();
        const lastUsedDate = lastUsed.toDate();
        const hoursSinceUsed = (now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60);
        
        if (featureType === 'streak_shield' && hoursSinceUsed < 48) {
            return { canUse: true };
        } else if (featureType === 'ai_powerup' && hoursSinceUsed < 24) {
            return { canUse: true };
        } else if (featureType === 'profile_boost' && hoursSinceUsed < 168) { // 7 days
            return { canUse: true };
        }

        return { canUse: false, reason: "Feature expired" };

    } catch (error: any) {
        return { canUse: false, reason: "Error checking feature" };
    }
}

/**
 * Allow users to purchase and activate a streak shield
 */
export async function purchaseStreakShield(userId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return await spendPoints(userId, POINTS_STREAK_SHIELD_COST, 'streak_shield');
}

/**
 * Check if user has an active streak shield
 */
export async function hasActiveStreakShield(userId: string): Promise<{ hasShield: boolean; hoursLeft?: number }> {
    if (!adminInitialized || !adminDb) {
        return { hasShield: false };
    }

    try {
        const userRef = adminDb.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            return { hasShield: false };
        }

        const userData = userDoc.data()!;
        const shieldUsedAt = userData.streak_shield_lastUsed;
        
        if (!shieldUsedAt) {
            return { hasShield: false };
        }

        const now = new Date();
        const shieldTime = shieldUsedAt.toDate();
        const hoursActive = (now.getTime() - shieldTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursActive < 48) {
            return { 
                hasShield: true, 
                hoursLeft: Math.round(48 - hoursActive) 
            };
        }

        return { hasShield: false };

    } catch (error: any) {
        return { hasShield: false };
    }
}

export interface UserNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: any;
  pointsAwarded?: number;
  badgesEarned?: string[];
}

export async function getUserNotifications(userId: string): Promise<{success: boolean; notifications?: UserNotification[]; error?: string}> {
  if (!adminInitialized || !adminDb) {
    return { success: false, error: "Server error: Admin SDK not configured." };
  }

  try {
    const notificationsRef = adminDb.collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50);
    
    const snapshot = await notificationsRef.get();
    const notifications: UserNotification[] = [];
    
    snapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      } as UserNotification);
    });

    return { success: true, notifications };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<{success: boolean; error?: string}> {
  if (!adminInitialized || !adminDb) {
    return { success: false, error: "Server error: Admin SDK not configured." };
  }

  try {
    await adminDb.collection('notifications').doc(notificationId).update({ isRead: true });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
