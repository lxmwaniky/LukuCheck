
'use server';

import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { adminDb, adminInitialized, getAdminStorageBucket } from '@/config/firebaseAdmin';
import type { UserProfile } from '@/contexts/AuthContext';
import { revalidatePath } from 'next/cache';
import type { UserRecord as AdminUserRecord } from 'firebase-admin/auth';
import { differenceInCalendarDays } from 'date-fns';

// Badge and Point Constants
const PROFILE_PRO_BADGE = "PROFILE_PRO";
const FIRST_SUBMISSION_BADGE = "FIRST_SUBMISSION";
const REFERRAL_ROCKSTAR_BADGE = "REFERRAL_ROCKSTAR";
const STREAK_STARTER_3_BADGE = "STREAK_STARTER_3";
const STREAK_KEEPER_7_BADGE = "STREAK_KEEPER_7";

const POINTS_PROFILE_PRO = 5;
const POINTS_FIRST_SUBMISSION = 3;
const POINTS_REFERRAL_ROCKSTAR = 10; // Bonus points for achieving the badge
const POINTS_STREAK_STARTER_3 = 2;
const POINTS_STREAK_KEEPER_7 = 5;
const POINTS_DAILY_STREAK_SUBMISSION = 1;
const REFERRALS_FOR_ROCKSTAR_BADGE = 3;
const POINTS_PER_REFERRAL = 2;


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
  // console.log(`[UserActions DEBUG] Creating Firestore profile for new user. UID: ${userId}, Email: ${email}, Username: ${username}, Referrer: ${referrerUid}`);
  if (!adminInitialized || !adminDb) {
    console.error("[UserActions ERROR] Admin SDK not initialized. Cannot create Firestore user profile.");
    return { success: false, error: "Server error: Admin SDK not configured. Profile creation failed." };
  }
  const userRef = adminDb.collection('users').doc(userId);
  try {
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
      lukuPoints: 5, // Initial points on signup
      referredBy: referrerUid || null,
      referralPointsAwarded: false, // For the new user, this means points haven't been awarded to their referrer yet
      tiktokPointsAwarded: false,
      instagramPointsAwarded: false,
      badges: [],
      currentStreak: 0,
      lastSubmissionDate: null,
    });

    const adminAuth = getAdminAuth();
    await adminAuth.updateUser(userId, { displayName: username });

    // console.log(`[UserActions DEBUG] Firestore profile created successfully for UID: ${userId}`);
    return { success: true };
  } catch (error: any) {
    console.error(`[UserActions ERROR] Failed to create Firestore user profile for UID ${userId}:`, error);
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
  // console.log(`[UserActions DEBUG] Attempting to update profile for userId: ${userId}`);
  if (!adminInitialized || !adminDb) {
    console.error("[UserActions ERROR] Admin SDK not initialized. Cannot update profile.");
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

    if (typeof username === 'string' && username !== currentUserData.username) {
      updateDataFirestore.username = username;
      authUpdatePayload.displayName = username;
    }

    if (typeof tiktokUrl === 'string') {
      const newTiktok = tiktokUrl.trim() === '' ? null : tiktokUrl.trim();
      updateDataFirestore.tiktokUrl = newTiktok;
      if (newTiktok && (!currentUserData.tiktokUrl || currentUserData.tiktokUrl.trim() === '') && !currentUserData.tiktokPointsAwarded) {
        pointsToAwardThisUpdate += 1;
        updateDataFirestore.tiktokPointsAwarded = true;
        // console.log(`[UserActions DEBUG] User ${userId} earned 1 point for adding TikTok link.`);
      }
    }

    if (typeof instagramUrl === 'string') {
      const newInstagram = instagramUrl.trim() === '' ? null : instagramUrl.trim();
      updateDataFirestore.instagramUrl = newInstagram;
      if (newInstagram && (!currentUserData.instagramUrl || currentUserData.instagramUrl.trim() === '') && !currentUserData.instagramPointsAwarded) {
        pointsToAwardThisUpdate += 1;
        updateDataFirestore.instagramPointsAwarded = true;
        // console.log(`[UserActions DEBUG] User ${userId} earned 1 point for adding Instagram link.`);
      }
    }

    const hasCustomPhotoField = photoDataUrl || currentUserData.customPhotoURL;
    const hasTiktokField = (updateDataFirestore.tiktokUrl !== undefined ? updateDataFirestore.tiktokUrl !== null : currentUserData.tiktokUrl !== null && currentUserData.tiktokUrl.trim() !== '');
    const hasInstagramField = (updateDataFirestore.instagramUrl !== undefined ? updateDataFirestore.instagramUrl !== null : currentUserData.instagramUrl !== null && currentUserData.instagramUrl.trim() !== '');

    if (hasCustomPhotoField && hasTiktokField && hasInstagramField && !currentBadges.includes(PROFILE_PRO_BADGE)) {
        newBadgesToAdd.push(PROFILE_PRO_BADGE);
        pointsToAwardThisUpdate += POINTS_PROFILE_PRO;
        // console.log(`[UserActions DEBUG] User ${userId} earned PROFILE_PRO_BADGE and ${POINTS_PROFILE_PRO} points.`);
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
            // console.log(`[UserActions DEBUG] Deleted old profile photo: ${filePath}`);
          }
        } catch (e: any) {
          console.warn(`[UserActions WARN] Failed to delete old profile photo from Storage (non-critical): ${currentUserData.customPhotoURL}`, e.message);
        }
      }

      const photoFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
      const photoStorageRefPath = `profilePictures/${userId}/${photoFileName}`;
      const file = adminBucket.file(photoStorageRefPath);
      const imageBuffer = Buffer.from(photoDataUrl.split(',')[1], 'base64');
      await file.save(imageBuffer, { metadata: { contentType: 'image/jpeg' } });
      await file.makePublic();
      newPublicPhotoURL = file.publicUrl();
      // console.log(`[UserActions DEBUG] Uploaded new profile photo: ${newPublicPhotoURL}`);

      updateDataFirestore.photoURL = newPublicPhotoURL;
      updateDataFirestore.customPhotoURL = newPublicPhotoURL;
      authUpdatePayload.photoURL = newPublicPhotoURL;
    }

    if (pointsToAwardThisUpdate > 0) {
        updateDataFirestore.lukuPoints = FieldValue.increment(pointsToAwardThisUpdate);
    }
    if (newBadgesToAdd.length > 0) {
        updateDataFirestore.badges = FieldValue.arrayUnion(...newBadgesToAdd);
    }

    if (Object.keys(authUpdatePayload).length > 0) {
      await adminAuth.updateUser(userId, authUpdatePayload);
      // console.log(`[UserActions DEBUG] Updated Firebase Auth profile for ${userId}.`);
    }

    if (Object.keys(updateDataFirestore).length > 0) {
        await userRefAdmin.update(updateDataFirestore);
        // console.log(`[UserActions DEBUG] Updated Firestore profile for ${userId} with data:`, updateDataFirestore);
    } else if (Object.keys(authUpdatePayload).length === 0) {
        // console.log(`[UserActions DEBUG] No changes detected to update profile for ${userId}.`);
        return { success: true, message: 'No changes detected to update profile.', newPhotoURL: newPublicPhotoURL };
    }

    revalidatePath('/profile');
    revalidatePath('/');
    return { success: true, message: 'Profile updated successfully.', newPhotoURL: newPublicPhotoURL };

  } catch (error: any) {
    console.error("[UserActions ERROR] Profile update failed (Admin SDK or Photo):", error);
    let errorMessage = `Profile update failed: ${error.message || "Unknown error"}`;
    if (error.code === 'auth/user-not-found') errorMessage = "User not found in Firebase Authentication.";
    if (error.code === 'storage/unauthorized' || (error.errors && error.errors.some((e:any) => e.reason === 'forbidden'))) {
        errorMessage = "Permission denied to upload photo. Check Firebase Storage rules or Admin SDK permissions for the bucket.";
      }
    return { success: false, error: errorMessage };
  }
}


export async function deleteUserData(userId: string): Promise<{ success: boolean; error?: string }> {
  // console.log(`[UserActions DEBUG] Attempting to delete all data for userId: ${userId} using Admin SDK`);
  if (!adminInitialized || !adminDb) {
    console.error("[UserActions ERROR] Admin SDK not initialized. Cannot delete user data.");
    return { success: false, error: "Server error: Admin SDK not configured. Account deletion failed." };
  }
  const adminAuthInstance = getAdminAuth();

  try {
    const batch = adminDb.batch();
    const userDocRef = adminDb.collection('users').doc(userId);

    const aiUsageCollectionRef = userDocRef.collection('aiUsage');
    const aiUsageSnapshot = await aiUsageCollectionRef.get();
    aiUsageSnapshot.docs.forEach(docSnap => batch.delete(docSnap.ref));
    // console.log(`[UserActions DEBUG] Queued deletion of ${aiUsageSnapshot.size} AI usage documents for user ${userId}.`);

    batch.delete(userDocRef);
    // console.log(`[UserActions DEBUG] Queued deletion of user document ${userId}.`);

    const outfitsQuery = adminDb.collection('outfits').where('userId', '==', userId);
    const outfitsSnapshot = await outfitsQuery.get();
    outfitsSnapshot.docs.forEach(docSnapshot => batch.delete(docSnapshot.ref));
    // console.log(`[UserActions DEBUG] Queued deletion of ${outfitsSnapshot.size} outfit documents for user ${userId}.`);

    await batch.commit();
    // console.log(`[UserActions DEBUG] Firestore data deletion committed for user ${userId}.`);

    const adminBucket = await getAdminStorageBucket();
    if (adminBucket) {
      const profilePicturesPrefix = `profilePictures/${userId}/`;
      const [profileFiles] = await adminBucket.getFiles({ prefix: profilePicturesPrefix });
      await Promise.all(profileFiles.map(file => file.delete()));
      // console.log(`[UserActions DEBUG] Deleted ${profileFiles.length} profile pictures from Storage for user ${userId}.`);

      const outfitsPrefix = `outfits/${userId}/`;
      const [outfitFiles] = await adminBucket.getFiles({ prefix: outfitsPrefix });
      await Promise.all(outfitFiles.map(file => file.delete()));
      // console.log(`[UserActions DEBUG] Deleted ${outfitFiles.length} outfit images from Storage for user ${userId}.`);
    } else {
      console.warn("[UserActions WARN] Admin Storage bucket not available. Skipping Storage file deletion.");
    }

    await adminAuthInstance.deleteUser(userId);
    // console.log(`[UserActions DEBUG] Firebase Auth user ${userId} deleted successfully.`);

    revalidatePath('/profile');
    revalidatePath('/leaderboard');
    revalidatePath('/');
    return { success: true };

  } catch (error: any) {
    console.error(`[UserActions ERROR] User data deletion failed for ${userId} (Admin SDK):`, error);
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
  // console.log(`[UserActions DEBUG] Fetching profile stats for userId: ${userId} using Admin SDK`);
  if (!adminInitialized || !adminDb) {
    console.error("[UserActions ERROR] Admin SDK not initialized. Cannot fetch profile stats.");
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
    console.error(`[UserActions ERROR] Failed to fetch profile stats for UID ${userId} using Admin SDK:`, error);
    return { success: false, error: `Failed to fetch profile stats: ${error.message || "Unknown error"}` };
  }
}


export async function processReferral(newlyRegisteredUserId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  console.log(`[UserActions DEBUG] processReferral called for newlyRegisteredUserId: ${newlyRegisteredUserId}`);
  if (!adminInitialized || !adminDb) {
    console.error("[UserActions ERROR] Admin SDK not initialized. Cannot process referral.");
    return { success: false, error: "Server error: Admin SDK not configured." };
  }

  try {
    const newUserDocRef = adminDb.collection('users').doc(newlyRegisteredUserId);
    const newUserDocSnap = await newUserDocRef.get();

    if (!newUserDocSnap.exists) {
      console.warn(`[UserActions WARN] New user document ${newlyRegisteredUserId} not found during referral processing.`);
      return { success: false, error: "New user document not found." };
    }

    const newUserData = newUserDocSnap.data() as UserProfile;
    const referrerUid = newUserData.referredBy;
    const alreadyAwardedToReferrerForThisUser = newUserData.referralPointsAwarded; // This flag indicates if the *referrer* got points for *this new user*

    if (!referrerUid) {
      console.log(`[UserActions DEBUG] User ${newlyRegisteredUserId} was not referred or referrerUid is null.`);
      return { success: true, message: "User was not referred." };
    }

    if (alreadyAwardedToReferrerForThisUser) {
      console.log(`[UserActions DEBUG] Referral points already processed for new user ${newlyRegisteredUserId} (meaning referrer was awarded).`);
      return { success: true, message: "Referral points already awarded for this user." };
    }

    console.log(`[UserActions DEBUG] Processing referral for ${newlyRegisteredUserId} by referrer ${referrerUid}.`);

    const referrerDocRef = adminDb.collection('users').doc(referrerUid);
    let pointsToAwardReferrerThisTime = POINTS_PER_REFERRAL; // Base points for this referral
    const newBadgesForReferrer: string[] = [];
    let referrerUpdateSuccessful = false;

    await adminDb.runTransaction(async (transaction) => {
      const referrerDocSnap = await transaction.get(referrerDocRef);
      if (!referrerDocSnap.exists) {
        console.warn(`[UserActions WARN] Referrer UID ${referrerUid} not found. Marking referral for ${newlyRegisteredUserId} as processed to prevent loops.`);
        transaction.update(newUserDocRef, { referralPointsAwarded: true });
        return;
      }

      const referrerData = referrerDocSnap.data() as UserProfile;
      const currentReferrerBadges = referrerData.badges || [];

      // Count how many users this referrer has ALREADY successfully referred
      // A successful referral means the new user has 'referralPointsAwarded: true' on THEIR doc.
      const referralsQuery = adminDb.collection('users')
                                   .where('referredBy', '==', referrerUid)
                                   .where('referralPointsAwarded', '==', true);
      const existingReferralsSnapshot = await transaction.get(referralsQuery);
      const countOfPreviousSuccessfulReferrals = existingReferralsSnapshot.size;

      const newTotalSuccessfulReferrals = countOfPreviousSuccessfulReferrals + 1; // Including the current one
      console.log(`[UserActions DEBUG] Referrer ${referrerUid} current successful referrals: ${countOfPreviousSuccessfulReferrals}. New total will be: ${newTotalSuccessfulReferrals}.`);

      // Check for Referral Rockstar Badge
      if (newTotalSuccessfulReferrals >= REFERRALS_FOR_ROCKSTAR_BADGE && !currentReferrerBadges.includes(REFERRAL_ROCKSTAR_BADGE)) {
        newBadgesForReferrer.push(REFERRAL_ROCKSTAR_BADGE);
        pointsToAwardReferrerThisTime += POINTS_REFERRAL_ROCKSTAR; // Add bonus for achieving the badge
        console.log(`[UserActions DEBUG] Referrer ${referrerUid} earned REFERRAL_ROCKSTAR_BADGE and ${POINTS_REFERRAL_ROCKSTAR} bonus points. Total for this referral: ${pointsToAwardReferrerThisTime}`);
      }

      const referrerUpdatePayload: {[key: string]: any} = {
        lukuPoints: FieldValue.increment(pointsToAwardReferrerThisTime)
      };
      if (newBadgesForReferrer.length > 0) {
        referrerUpdatePayload.badges = FieldValue.arrayUnion(...newBadgesForReferrer);
      }

      transaction.update(referrerDocRef, referrerUpdatePayload);
      transaction.update(newUserDocRef, { referralPointsAwarded: true }); // Mark this new user's referral as processed
      referrerUpdateSuccessful = true;
    });

    if(referrerUpdateSuccessful) {
        console.log(`[UserActions DEBUG] Transaction successful. Referrer ${referrerUid} awarded ${pointsToAwardReferrerThisTime} LukuPoints for referring ${newlyRegisteredUserId}. New Badges for referrer: ${newBadgesForReferrer.join(', ')}.`);
        revalidatePath(`/profile`);
        revalidatePath(`/leaderboard`); // Referrer's badge might appear on leaderboard
    } else {
        console.warn(`[UserActions WARN] Referrer update transaction did not complete successfully for referrer ${referrerUid}.`);
    }
    return { success: true, message: "Referral points processing attempted." };

  } catch (error: any) {
    console.error(`[UserActions ERROR] Failed to process referral for ${newlyRegisteredUserId}:`, error);
    // Attempt to mark the new user's referral as processed even on error to prevent infinite loops if possible
    try {
        await adminDb.collection('users').doc(newlyRegisteredUserId).update({ referralPointsAwarded: true });
        console.log(`[UserActions INFO] Marked referralPointsAwarded for ${newlyRegisteredUserId} as true after an error to prevent reprocessing.`);
    } catch (updateError) {
        console.error(`[UserActions CRITICAL] Failed to mark referralPointsAwarded for ${newlyRegisteredUserId} after an error:`, updateError);
    }
    return { success: false, error: `Failed to process referral: ${error.message || "Unknown error"}` };
  }
}

export async function handleLeaderboardSubmissionPerks(userId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!adminInitialized || !adminDb) {
        console.error("[UserActions ERROR] Admin SDK not initialized. Cannot process submission perks.");
        return { success: false, error: "Server error: Admin SDK not configured." };
    }
    if (!userId) {
        return { success: false, error: "User ID is required." };
    }

    // console.log(`[UserActions DEBUG] handleLeaderboardSubmissionPerks called for userId: ${userId}`);
    const userRef = adminDb.collection('users').doc(userId);

    try {
        let perksUpdated = false;
        await adminDb.runTransaction(async (transaction) => {
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists) {
                throw new Error("User profile not found.");
            }

            const userData = userSnap.data() as UserProfile;
            const currentBadges = userData.badges || [];
            let pointsToAward = 0;
            const newBadges: string[] = [];
            const updateData: { [key: string]: any } = {};

            // First Submission Badge
            if (!currentBadges.includes(FIRST_SUBMISSION_BADGE)) {
                newBadges.push(FIRST_SUBMISSION_BADGE);
                pointsToAward += POINTS_FIRST_SUBMISSION;
                // console.log(`[UserActions DEBUG] Awarding ${userId} FIRST_SUBMISSION_BADGE and ${POINTS_FIRST_SUBMISSION} points.`);
            }

            // Streak Logic
            const todayStr = new Date().toISOString().split('T')[0]; // Server's UTC date
            let currentStreak = userData.currentStreak || 0;
            let newLastSubmissionDate = userData.lastSubmissionDate;

            if (userData.lastSubmissionDate !== todayStr) { // Only process streak if not already processed today
                if (userData.lastSubmissionDate) {
                    const lastSubmission = new Date(userData.lastSubmissionDate);
                    const today = new Date(todayStr);
                    const diffDays = differenceInCalendarDays(today, lastSubmission);

                    if (diffDays === 1) { // Consecutive day
                        currentStreak++;
                    } else if (diffDays > 1) { // Streak broken
                        currentStreak = 1;
                    } // If diffDays === 0, it means lastSubmissionDate was today, handled by outer check.
                      // If diffDays < 0, something is wrong (future date), treat as new streak.
                      else if (diffDays < 0 ) {
                        currentStreak = 1;
                      }
                } else { // No previous submission date, so this is the first day of a streak
                    currentStreak = 1;
                }
                
                pointsToAward += POINTS_DAILY_STREAK_SUBMISSION; // Award daily submission point
                newLastSubmissionDate = todayStr; // Update last submission date
                // console.log(`[UserActions DEBUG] User ${userId} new streak: ${currentStreak}. Last submission: ${newLastSubmissionDate}. Awarding ${POINTS_DAILY_STREAK_SUBMISSION} daily point.`);

                updateData.currentStreak = currentStreak;
                updateData.lastSubmissionDate = newLastSubmissionDate;

                 // Streak Badges
                if (currentStreak >= 3 && !currentBadges.includes(STREAK_STARTER_3_BADGE) && !newBadges.includes(STREAK_STARTER_3_BADGE)) {
                    newBadges.push(STREAK_STARTER_3_BADGE);
                    pointsToAward += POINTS_STREAK_STARTER_3;
                    // console.log(`[UserActions DEBUG] Awarding ${userId} STREAK_STARTER_3_BADGE and ${POINTS_STREAK_STARTER_3} points.`);
                }
                if (currentStreak >= 7 && !currentBadges.includes(STREAK_KEEPER_7_BADGE) && !newBadges.includes(STREAK_KEEPER_7_BADGE)) {
                    newBadges.push(STREAK_KEEPER_7_BADGE);
                    pointsToAward += POINTS_STREAK_KEEPER_7;
                    // console.log(`[UserActions DEBUG] Awarding ${userId} STREAK_KEEPER_7_BADGE and ${POINTS_STREAK_KEEPER_7} points.`);
                }
            } else {
                // console.log(`[UserActions DEBUG] Perks for today (${todayStr}) already processed for user ${userId}.`);
            }


            if (newBadges.length > 0) {
                updateData.badges = FieldValue.arrayUnion(...newBadges);
            }
            if (pointsToAward > 0) {
                updateData.lukuPoints = FieldValue.increment(pointsToAward);
            }

            if (Object.keys(updateData).length > 0) {
                transaction.update(userRef, updateData);
                perksUpdated = true;
                // console.log(`[UserActions DEBUG] Updated submission perks for ${userId}:`, updateData);
            } else {
                // console.log(`[UserActions DEBUG] No perk updates needed for ${userId} on this submission.`);
            }
        });
        
        if (perksUpdated) {
            revalidatePath('/profile');
            revalidatePath('/leaderboard'); // User's badge/points might change on leaderboard
        }
        return { success: true, message: "Leaderboard submission perks processed." };

    } catch (error: any) {
        console.error(`[UserActions ERROR] Failed to process submission perks for ${userId}:`, error);
        return { success: false, error: `Failed to process submission perks: ${error.message || "Unknown error"}` };
    }
}
