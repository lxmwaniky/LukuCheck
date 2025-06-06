
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
const REFERRAL_ROCKSTAR_BADGE = "REFERRAL_ROCKSTAR";
const STREAK_STARTER_3_BADGE = "STREAK_STARTER_3";
const STREAK_KEEPER_7_BADGE = "STREAK_KEEPER_7";
const TOP_3_FINISHER_BADGE = "TOP_3_FINISHER";
const PERFECT_SCORE_BADGE = "PERFECT_SCORE";
const CENTURY_CLUB_BADGE = "CENTURY_CLUB";
const LEGEND_STATUS_BADGE = "LEGEND_STATUS";
const PREMIUM_STYLIST_BADGE = "PREMIUM_STYLIST";


const POINTS_PROFILE_PRO = 5;
const POINTS_FIRST_SUBMISSION = 3;
const POINTS_REFERRAL_ROCKSTAR = 10; // Bonus points for achieving the badge
const POINTS_STREAK_STARTER_3 = 2;
const POINTS_STREAK_KEEPER_7 = 5;
const POINTS_DAILY_STREAK_SUBMISSION = 1;
const REFERRALS_FOR_ROCKSTAR_BADGE = 3;
const POINTS_PER_REFERRAL = 2;
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
  username: string,
  referrerUid?: string | null
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
      referredBy: referrerUid || null,
      referralPointsAwarded: false,
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

    if (typeof username === 'string' && username !== currentUserData.username) {
      updateDataFirestore.username = username;
      authUpdatePayload.displayName = username;
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
    const tiktokFieldForBadgeCheck = (updateDataFirestore.tiktokUrl !== undefined ? updateDataFirestore.tiktokUrl !== null : currentUserData.tiktokUrl !== null && currentUserData.tiktokUrl.trim() !== '');
    const instagramFieldForBadgeCheck = (updateDataFirestore.instagramUrl !== undefined ? updateDataFirestore.instagramUrl !== null : currentUserData.instagramUrl !== null && currentUserData.instagramUrl.trim() !== '');

    if (photoFieldForBadgeCheck && tiktokFieldForBadgeCheck && instagramFieldForBadgeCheck && !currentBadges.includes(PROFILE_PRO_BADGE)) {
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
  if (username.length < 3) {
    return {available: false, message: "Username must be at least 3 characters."};
  }
  const usersRef = adminDb.collection('users');
  const querySnapshot = await usersRef.where('username', '==', username).limit(1).get();
  if (!querySnapshot.empty) {
    return {available: false, message: "This username is already in use. Please choose another."};
  }

  return {available: true, message: "Username format is acceptable."};
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


export async function processReferral(newlyRegisteredUserId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!adminInitialized || !adminDb) {
    return { success: false, error: "Server error: Admin SDK not configured." };
  }

  try {
    const newUserDocRef = adminDb.collection('users').doc(newlyRegisteredUserId);
    const newUserDocSnap = await newUserDocRef.get();

    if (!newUserDocSnap.exists) {
      return { success: false, error: "New user document not found." };
    }

    const newUserData = newUserDocSnap.data() as UserProfile;
    const referrerUid = newUserData.referredBy;
    const alreadyAwardedToReferrerForThisUser = newUserData.referralPointsAwarded;

    if (!referrerUid) {
      return { success: true, message: "User was not referred." };
    }

    if (alreadyAwardedToReferrerForThisUser) {
      return { success: true, message: "Referral points already awarded for this user." };
    }


    const referrerDocRef = adminDb.collection('users').doc(referrerUid);
    let pointsToAwardReferrerThisTime = POINTS_PER_REFERRAL;
    const newBadgesForReferrer: string[] = [];
    let referrerUpdateSuccessful = false;
    let currentReferrerLukuPoints = 0;
    let currentReferrerBadges: string[] = [];

    await adminDb.runTransaction(async (transaction) => {
      const referrerDocSnap = await transaction.get(referrerDocRef);
      if (!referrerDocSnap.exists) {
        transaction.update(newUserDocRef, { referralPointsAwarded: true });
        return;
      }

      const referrerData = referrerDocSnap.data() as UserProfile;
      currentReferrerBadges = referrerData.badges || [];
      currentReferrerLukuPoints = referrerData.lukuPoints || 0;


      const referralsQuery = adminDb.collection('users')
                                   .where('referredBy', '==', referrerUid)
                                   .where('referralPointsAwarded', '==', true); // Count only successfully processed referrals
      const existingReferralsSnapshot = await transaction.get(referralsQuery);
      const countOfPreviousSuccessfulReferrals = existingReferralsSnapshot.size;

      const newTotalSuccessfulReferrals = countOfPreviousSuccessfulReferrals + 1;

      if (newTotalSuccessfulReferrals >= REFERRALS_FOR_ROCKSTAR_BADGE && !currentReferrerBadges.includes(REFERRAL_ROCKSTAR_BADGE)) {
        newBadgesForReferrer.push(REFERRAL_ROCKSTAR_BADGE);
        pointsToAwardReferrerThisTime += POINTS_REFERRAL_ROCKSTAR;
      }

      const updatedReferrerLukuPoints = currentReferrerLukuPoints + pointsToAwardReferrerThisTime;

      if (updatedReferrerLukuPoints >= 250 && !currentReferrerBadges.includes(LEGEND_STATUS_BADGE) && !newBadgesForReferrer.includes(LEGEND_STATUS_BADGE)) {
          newBadgesForReferrer.push(LEGEND_STATUS_BADGE);
      } else if (updatedReferrerLukuPoints >= 100 && !currentReferrerBadges.includes(CENTURY_CLUB_BADGE) && !newBadgesForReferrer.includes(CENTURY_CLUB_BADGE)) {
          newBadgesForReferrer.push(CENTURY_CLUB_BADGE);
      }


      const referrerUpdatePayload: {[key: string]: any} = {
        lukuPoints: FieldValue.increment(pointsToAwardReferrerThisTime)
      };
      if (newBadgesForReferrer.length > 0) {
        referrerUpdatePayload.badges = FieldValue.arrayUnion(...newBadgesForReferrer);
      }

      transaction.update(referrerDocRef, referrerUpdatePayload);
      transaction.update(newUserDocRef, { referralPointsAwarded: true });
      referrerUpdateSuccessful = true;
    });

    if(referrerUpdateSuccessful) {
        revalidatePath(`/profile`);
        revalidatePath(`/leaderboard`);
    }
    return { success: true, message: "Referral points processing attempted." };

  } catch (error: any) {
    try {
        await adminDb.collection('users').doc(newlyRegisteredUserId).update({ referralPointsAwarded: true });
    } catch (updateError) {
    }
    return { success: false, error: `Failed to process referral: ${error.message || "Unknown error"}` };
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


            // Streak Logic
            const todayStr = new Date().toISOString().split('T')[0]; // Server's UTC date
            let currentStreak = userData.currentStreak || 0;

            if (userData.lastSubmissionDate !== todayStr) {
                if (userData.lastSubmissionDate) {
                    const lastSubmission = new Date(userData.lastSubmissionDate);
                    const today = new Date(todayStr);
                    const diffDays = differenceInCalendarDays(today, lastSubmission);

                    if (diffDays === 1) {
                        currentStreak++;
                    } else if (diffDays > 1) {
                        currentStreak = 1;
                    } else if (diffDays < 0 ) { // Should not happen if clocks are synced, but handle defensively
                        currentStreak = 1;
                      }
                } else {
                    currentStreak = 1;
                }

                pointsToAward += POINTS_DAILY_STREAK_SUBMISSION;
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
