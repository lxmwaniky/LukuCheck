
'use server';

import { adminDb, adminAuth, adminInitialized } from '@/config/firebaseAdmin';
import type { UserRecord as AdminUserRecord } from 'firebase-admin/auth';
import type { UserProfile } from '@/contexts/AuthContext';
import { FieldValue } from 'firebase-admin/firestore';
import type FirebaseAdmin from 'firebase-admin';

interface AdminUserView extends Omit<UserProfile, 'createdAt' | 'lastLogin'> {
  createdAt?: string | null;
  lastLogin?: string | null;
  firebaseAuthDisabled?: boolean;
}

// Helper function to verify if the currently acting user is an admin
async function verifyRequestingUserIsAdmin(callerUid: string): Promise<boolean> {
  if (!adminInitialized || !adminDb) {
    console.error("[AdminActions DEBUG] verifyRequestingUserIsAdmin: Admin SDK not initialized. Cannot verify admin status.");
    return false;
  }
  if (!callerUid) {
    console.error("[AdminActions DEBUG] verifyRequestingUserIsAdmin: Caller UID not provided for admin verification.");
    return false;
  }
  try {
    console.log(`[AdminActions DEBUG] verifyRequestingUserIsAdmin: Checking admin status for UID: ${callerUid}`);
    const userDocRef = adminDb.collection('users').doc(callerUid);
    const userDocSnap = await userDocRef.get();
    if (userDocSnap.exists && userDocSnap.data()?.isAdmin === true) {
      console.log(`[AdminActions DEBUG] verifyRequestingUserIsAdmin: User ${callerUid} IS an admin.`);
      return true;
    }
    console.log(`[AdminActions DEBUG] verifyRequestingUserIsAdmin: User ${callerUid} is NOT an admin or profile not found.`);
    return false;
  } catch (error) {
    console.error("[AdminActions DEBUG] verifyRequestingUserIsAdmin: Error verifying admin status:", error);
    return false;
  }
}


export async function getAllUsersForAdmin(callerUid: string): Promise<{ success: boolean; users?: AdminUserView[]; error?: string }> {
  console.log(`[AdminActions DEBUG] getAllUsersForAdmin: Called by UID: ${callerUid}`);
  if (!adminInitialized || !adminAuth || !adminDb) {
    console.error("[AdminActions DEBUG] getAllUsersForAdmin: Admin SDK not configured.");
    return { success: false, error: "Admin SDK not configured." };
  }

  const isAdmin = await verifyRequestingUserIsAdmin(callerUid);
  if (!isAdmin) {
    console.warn(`[AdminActions DEBUG] getAllUsersForAdmin: Unauthorized access attempt by UID: ${callerUid}`);
    return { success: false, error: "Unauthorized: Caller is not an admin." };
  }

  try {
    console.log("[AdminActions DEBUG] getAllUsersForAdmin: Fetching users from Firebase Auth...");
    const listUsersResult = await adminAuth.listUsers(1000); // Max 1000 users per page
    const firebaseAuthUsers = listUsersResult.users;
    console.log(`[AdminActions DEBUG] getAllUsersForAdmin: Fetched ${firebaseAuthUsers.length} users from Firebase Auth.`);

    const userProfilesPromises = firebaseAuthUsers.map(async (authUser) => {
      console.log(`[AdminActions DEBUG] getAllUsersForAdmin: Processing authUser UID: ${authUser.uid}`);
      const userDocRef = adminDb.collection('users').doc(authUser.uid);
      let userDocSnap;
      try {
        userDocSnap = await userDocRef.get();
      } catch (dbError) {
        console.error(`[AdminActions DEBUG] getAllUsersForAdmin: Error fetching Firestore doc for UID ${authUser.uid}:`, dbError);
        // Fallback to Auth data only if Firestore fetch fails
        return {
          uid: authUser.uid,
          email: authUser.email || null,
          username: authUser.displayName || 'N/A (DB Error)',
          photoURL: authUser.photoURL || null,
          emailVerified: authUser.emailVerified,
          lukuPoints: 0,
          badges: [],
          currentStreak: 0,
          isAdmin: false, // Assume not admin if profile can't be read
          firebaseAuthDisabled: authUser.disabled,
          createdAt: null,
          lastLogin: null,
        } as AdminUserView;
      }
      
      if (userDocSnap && userDocSnap.exists) {
        console.log(`[AdminActions DEBUG] getAllUsersForAdmin: Firestore doc found for UID: ${authUser.uid}`);
        const firestoreData = userDocSnap.data() as UserProfile; // UserProfile still has Timestamps
        return {
          ...firestoreData,
          uid: authUser.uid, 
          email: authUser.email || firestoreData.email || null,
          username: firestoreData.username || authUser.displayName || null,
          photoURL: firestoreData.customPhotoURL || authUser.photoURL || firestoreData.photoURL || null,
          customPhotoURL: firestoreData.customPhotoURL,
          emailVerified: authUser.emailVerified,
          firebaseAuthDisabled: authUser.disabled,
          lukuPoints: typeof firestoreData.lukuPoints === 'number' ? firestoreData.lukuPoints : 0,
          referredBy: firestoreData.referredBy || null,
          referralPointsAwarded: firestoreData.referralPointsAwarded || false,
          tiktokPointsAwarded: firestoreData.tiktokPointsAwarded || false,
          instagramPointsAwarded: firestoreData.instagramPointsAwarded || false,
          badges: firestoreData.badges || [],
          currentStreak: firestoreData.currentStreak || 0,
          lastSubmissionDate: firestoreData.lastSubmissionDate || null,
          lastTop3BonusDate: firestoreData.lastTop3BonusDate || null,
          isAdmin: firestoreData.isAdmin || false,
          createdAt: firestoreData.createdAt ? (firestoreData.createdAt as FirebaseAdmin.firestore.Timestamp).toDate().toISOString() : null, 
          lastLogin: firestoreData.lastLogin ? (firestoreData.lastLogin as FirebaseAdmin.firestore.Timestamp).toDate().toISOString() : null,
        } as AdminUserView;
      } else {
        console.log(`[AdminActions DEBUG] getAllUsersForAdmin: Firestore doc NOT found for UID: ${authUser.uid}. Using Auth data only.`);
        return {
          uid: authUser.uid,
          email: authUser.email || null,
          username: authUser.displayName || 'N/A (No DB Profile)',
          photoURL: authUser.photoURL || null,
          emailVerified: authUser.emailVerified,
          lukuPoints: 0,
          badges: [],
          currentStreak: 0,
          isAdmin: false,
          firebaseAuthDisabled: authUser.disabled,
          createdAt: null,
          lastLogin: null,
        } as AdminUserView;
      }
    });

    const users = await Promise.all(userProfilesPromises);
    const validUsers = users.filter(user => user !== null) as AdminUserView[];
    console.log(`[AdminActions DEBUG] getAllUsersForAdmin: Successfully processed ${validUsers.length} user profiles.`);
    
    return { success: true, users: validUsers };
  } catch (error: any) {
    console.error("[AdminActions DEBUG] getAllUsersForAdmin: Error fetching all users:", error);
    return { success: false, error: `Failed to fetch users: ${error.message}` };
  }
}

export async function toggleUserAdminStatus(
  callerUid: string,
  targetUserId: string,
  newAdminStatus: boolean
): Promise<{ success: boolean; error?: string }> {
  console.log(`[AdminActions DEBUG] toggleUserAdminStatus: Called by UID: ${callerUid} for target UID: ${targetUserId} to set admin: ${newAdminStatus}`);
  if (!adminInitialized || !adminDb) {
    console.error("[AdminActions DEBUG] toggleUserAdminStatus: Admin SDK not configured.");
    return { success: false, error: "Admin SDK not configured." };
  }
  const isAdmin = await verifyRequestingUserIsAdmin(callerUid);
  if (!isAdmin) {
    console.warn(`[AdminActions DEBUG] toggleUserAdminStatus: Unauthorized access attempt by UID: ${callerUid}`);
    return { success: false, error: "Unauthorized: Caller is not an admin." };
  }

  if (callerUid === targetUserId && !newAdminStatus) {
    console.warn(`[AdminActions DEBUG] toggleUserAdminStatus: Admin UID: ${callerUid} attempted to revoke their own status.`);
    return { success: false, error: "Admins cannot revoke their own admin status through this panel." };
  }

  try {
    const userDocRef = adminDb.collection('users').doc(targetUserId);
    await userDocRef.update({ isAdmin: newAdminStatus });
    console.log(`[AdminActions DEBUG] toggleUserAdminStatus: Successfully updated admin status for UID: ${targetUserId} to ${newAdminStatus}.`);
    return { success: true };
  } catch (error: any) {
    console.error(`[AdminActions DEBUG] toggleUserAdminStatus: Error toggling admin status for ${targetUserId}:`, error);
    return { success: false, error: `Failed to toggle admin status: ${error.message}` };
  }
}

export async function adjustUserLukuPoints(
  callerUid: string,
  targetUserId: string,
  points: number,
  operation: 'add' | 'set' | 'subtract'
): Promise<{ success: boolean; error?: string }> {
  console.log(`[AdminActions DEBUG] adjustUserLukuPoints: Called by UID: ${callerUid} for target UID: ${targetUserId}, points: ${points}, operation: ${operation}`);
  if (!adminInitialized || !adminDb) {
    console.error("[AdminActions DEBUG] adjustUserLukuPoints: Admin SDK not configured.");
    return { success: false, error: "Admin SDK not configured." };
  }
  const isAdmin = await verifyRequestingUserIsAdmin(callerUid);
  if (!isAdmin) {
    console.warn(`[AdminActions DEBUG] adjustUserLukuPoints: Unauthorized access attempt by UID: ${callerUid}`);
    return { success: false, error: "Unauthorized: Caller is not an admin." };
  }

  if (isNaN(points) || (operation !== 'set' && points <= 0 && operation !== 'subtract')) {
     console.warn(`[AdminActions DEBUG] adjustUserLukuPoints: Invalid point amount for operation '${operation}': ${points}`);
     return { success: false, error: "Invalid point amount. Must be a positive number for 'add'." };
  }
   if (operation === 'subtract' && points < 0) {
    console.warn(`[AdminActions DEBUG] adjustUserLukuPoints: Invalid point amount for 'subtract': ${points}. Should be positive.`);
    return { success: false, error: "For 'subtract', provide a positive number of points to remove." };
  }

  try {
    const userDocRef = adminDb.collection('users').doc(targetUserId);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
      console.warn(`[AdminActions DEBUG] adjustUserLukuPoints: Target user profile UID: ${targetUserId} not found.`);
      return { success: false, error: "Target user profile not found." };
    }
    
    let newPointsValue;
    if (operation === 'add') {
      newPointsValue = FieldValue.increment(points);
    } else if (operation === 'subtract') {
      newPointsValue = FieldValue.increment(-Math.abs(points)); 
    } 
    else { // 'set'
      newPointsValue = points;
    }

    await userDocRef.update({ lukuPoints: newPointsValue });
    console.log(`[AdminActions DEBUG] adjustUserLukuPoints: Successfully adjusted LukuPoints for UID: ${targetUserId}.`);
    return { success: true };
  } catch (error: any) {
    console.error(`[AdminActions DEBUG] adjustUserLukuPoints: Error adjusting LukuPoints for ${targetUserId}:`, error);
    return { success: false, error: `Failed to adjust LukuPoints: ${error.message}` };
  }
}
