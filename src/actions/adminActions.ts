
'use server';

import { adminDb, adminAuth, adminInitialized } from '@/config/firebaseAdmin';
import type { UserRecord as AdminUserRecord } from 'firebase-admin/auth';
import type { UserProfile, UserRole } from '@/contexts/AuthContext';
import { FieldValue } from 'firebase-admin/firestore';
import type FirebaseAdmin from 'firebase-admin';

export interface AdminUserView extends Omit<UserProfile, 'createdAt' | 'lastLogin'> {
  createdAt?: string | null;
  lastLogin?: string | null;
  firebaseAuthDisabled?: boolean;
  referralsMadeCount?: number;
}

async function verifyUserRole(callerUid: string, allowedRoles: UserRole[]): Promise<boolean> {
  if (!adminInitialized || !adminDb) {
    // console.error("[AdminActions] verifyUserRole: Admin SDK not initialized.");
    return false;
  }
  if (!callerUid) {
    // console.error("[AdminActions] verifyUserRole: Caller UID not provided for role verification.");
    return false;
  }
  try {
    const userDocRef = adminDb.collection('users').doc(callerUid);
    const userDocSnap = await userDocRef.get();
    if (userDocSnap.exists) {
      const userData = userDocSnap.data() as UserProfile;
      const userRole = userData.role || 'user';
      if (allowedRoles.includes(userRole)) {
        return true;
      }
    }
    // console.log(`[AdminActions] verifyUserRole: User ${callerUid} role '${userDocSnap.data()?.role || 'user'}' not in allowed roles [${allowedRoles.join(', ')}].`);
    return false;
  } catch (error) {
    // console.error("[AdminActions] verifyUserRole: Error verifying role:", error);
    return false;
  }
}


export async function getAllUsersForAdmin(callerUid: string): Promise<{ success: boolean; users?: AdminUserView[]; error?: string }> {
  if (!adminInitialized || !adminAuth || !adminDb) {
    return { success: false, error: "Admin SDK not configured." };
  }

  const canAccess = await verifyUserRole(callerUid, ['admin', 'manager']);
  if (!canAccess) {
    return { success: false, error: "Unauthorized: Caller does not have sufficient privileges." };
  }

  try {
    const listUsersResult = await adminAuth.listUsers(1000); 
    const firebaseAuthUsers = listUsersResult.users;

    const allUsersDocsSnap = await adminDb.collection('users').get();
    const allUserProfiles: Record<string, UserProfile> = {};
    allUsersDocsSnap.forEach(doc => {
      allUserProfiles[doc.id] = doc.data() as UserProfile;
    });
    
    const referralsMadeCounts: Record<string, number> = {};
    allUsersDocsSnap.forEach(doc => {
        const userData = doc.data() as UserProfile;
        if (userData.referredBy) {
            referralsMadeCounts[userData.referredBy] = (referralsMadeCounts[userData.referredBy] || 0) + 1;
        }
    });


    const userProfilesPromises = firebaseAuthUsers.map(async (authUser) => {
      const firestoreData = allUserProfiles[authUser.uid];
      const referralsCount = referralsMadeCounts[authUser.uid] || 0;
      
      if (firestoreData) {
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
          role: firestoreData.role || 'user',
          createdAt: firestoreData.createdAt ? (firestoreData.createdAt as FirebaseAdmin.firestore.Timestamp).toDate().toISOString() : null, 
          lastLogin: firestoreData.lastLogin ? (firestoreData.lastLogin as FirebaseAdmin.firestore.Timestamp).toDate().toISOString() : null,
          referralsMadeCount: referralsCount,
        } as AdminUserView;
      } else {
        return {
          uid: authUser.uid,
          email: authUser.email || null,
          username: authUser.displayName || 'N/A (No DB Profile)',
          photoURL: authUser.photoURL || null,
          emailVerified: authUser.emailVerified,
          lukuPoints: 0,
          badges: [],
          currentStreak: 0,
          role: 'user',
          firebaseAuthDisabled: authUser.disabled,
          createdAt: null,
          lastLogin: null,
          referralsMadeCount: referralsCount,
        } as AdminUserView;
      }
    });

    const users = await Promise.all(userProfilesPromises);
    const validUsers = users.filter(user => user !== null) as AdminUserView[];
    
    return { success: true, users: validUsers };
  } catch (error: any) {
    // console.error("[AdminActions] getAllUsersForAdmin: Error fetching all users:", error);
    return { success: false, error: `Failed to fetch users: ${error.message}` };
  }
}

export async function setUserRoleAction(
  callerUid: string,
  targetUserId: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  if (!adminInitialized || !adminDb) {
    return { success: false, error: "Admin SDK not configured." };
  }
  const isCallerAdmin = await verifyUserRole(callerUid, ['admin']);
  if (!isCallerAdmin) {
    return { success: false, error: "Unauthorized: Caller is not an admin." };
  }

  if (callerUid === targetUserId && newRole !== 'admin') {
    return { success: false, error: "Admins cannot change their own role to a non-admin role through this panel." };
  }

  try {
    const userDocRef = adminDb.collection('users').doc(targetUserId);
    await userDocRef.update({ role: newRole });
    return { success: true };
  } catch (error: any) {
    // console.error(`[AdminActions] setUserRoleAction: Error setting role for ${targetUserId}:`, error);
    return { success: false, error: `Failed to set user role: ${error.message}` };
  }
}

export async function adjustUserLukuPoints(
  callerUid: string,
  targetUserId: string,
  points: number,
  operation: 'add' | 'set' | 'subtract'
): Promise<{ success: boolean; error?: string }> {
  if (!adminInitialized || !adminDb) {
    return { success: false, error: "Admin SDK not configured." };
  }
  const canAccess = await verifyUserRole(callerUid, ['admin', 'manager']);
  if (!canAccess) {
    return { success: false, error: "Unauthorized: Caller does not have sufficient privileges." };
  }

  if (isNaN(points) || (operation !== 'set' && points <= 0 && operation !== 'subtract')) {
     return { success: false, error: "Invalid point amount. Must be a positive number for 'add'." };
  }
   if (operation === 'subtract' && points < 0) {
    return { success: false, error: "For 'subtract', provide a positive number of points to remove." };
  }

  try {
    const userDocRef = adminDb.collection('users').doc(targetUserId);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
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
    return { success: true };
  } catch (error: any) {
    // console.error(`[AdminActions] adjustUserLukuPoints: Error adjusting LukuPoints for ${targetUserId}:`, error);
    return { success: false, error: `Failed to adjust LukuPoints: ${error.message}` };
  }
}
