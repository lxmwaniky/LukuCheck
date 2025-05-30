
'use client';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, db }  from '@/config/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp, getDoc, Unsubscribe, Timestamp, updateDoc } from 'firebase/firestore';
import type { ReactNode} from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { processReferral } from '@/actions/userActions'; 

export interface UserProfile {
  uid: string;
  email: string | null;
  username: string | null;
  photoURL: string | null;
  customPhotoURL?: string | null;
  emailVerified: boolean;
  createdAt?: Timestamp | null;
  lastLogin?: Timestamp | null;
  tiktokUrl?: string | null;
  instagramUrl?: string | null;
  lukuPoints?: number;
  referredBy?: string | null;
  referralPointsAwarded?: boolean;
  tiktokPointsAwarded?: boolean; 
  instagramPointsAwarded?: boolean;
  badges?: string[]; // e.g., ['PROFILE_PRO', 'FIRST_SUBMISSION']
  currentStreak?: number;
  lastSubmissionDate?: string | null; // YYYY-MM-DD
}

export interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  userProfile: UserProfile | null;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userProfile: null,
  refreshUserProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralProcessingAttempted, setReferralProcessingAttempted] = useState(false);


  const fetchAndSetUserProfile = async (firebaseUser: FirebaseUser) => {
    if (!firebaseUser) {
      setUserProfile(null);
      setReferralProcessingAttempted(false); 
      return;
    }
    const userRef = doc(db, 'users', firebaseUser.uid);
    try {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const profileData = userSnap.data();
        
        if (profileData.lastLogin?.toDate()?.toDateString() !== new Date().toDateString()) {
            await updateDoc(userRef, { lastLogin: serverTimestamp() });
        }
        const loadedProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          username: profileData.username || firebaseUser.displayName,
          photoURL: profileData.customPhotoURL || profileData.photoURL || firebaseUser.photoURL,
          customPhotoURL: profileData.customPhotoURL,
          emailVerified: firebaseUser.emailVerified,
          createdAt: profileData.createdAt,
          lastLogin: profileData.lastLogin || serverTimestamp(),
          tiktokUrl: profileData.tiktokUrl || null,
          instagramUrl: profileData.instagramUrl || null,
          lukuPoints: profileData.lukuPoints || 0,
          referredBy: profileData.referredBy || null,
          referralPointsAwarded: profileData.referralPointsAwarded || false,
          tiktokPointsAwarded: profileData.tiktokPointsAwarded || false,
          instagramPointsAwarded: profileData.instagramPointsAwarded || false,
          badges: profileData.badges || [],
          currentStreak: profileData.currentStreak || 0,
          lastSubmissionDate: profileData.lastSubmissionDate || null,
        };
        setUserProfile(loadedProfile);

        if (
          firebaseUser.emailVerified &&
          loadedProfile.referredBy &&
          !loadedProfile.referralPointsAwarded &&
          !referralProcessingAttempted 
        ) {
          setReferralProcessingAttempted(true); 
          console.log('[AuthContext] Attempting to process referral for user:', firebaseUser.uid);
          try {
            const result = await processReferral(firebaseUser.uid);
            if (result.success) {
              console.log('[AuthContext] Referral processed successfully for user:', firebaseUser.uid, 'Message:', result.message);
              // Optionally refresh profile here if points/badges for referrer are immediately needed client-side for referrer
            } else {
              console.error('[AuthContext] Failed to process referral:', result.error);
            }
          } catch (e) {
            console.error('[AuthContext] Error calling processReferral action:', e);
          }
        }

      } else {
        console.warn("User profile not found in Firestore for UID:", firebaseUser.uid);
        setUserProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          username: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          lukuPoints: 0, 
          referralPointsAwarded: false,
          tiktokPointsAwarded: false,
          instagramPointsAwarded: false,
          badges: [],
          currentStreak: 0,
          lastSubmissionDate: null,
        });
      }
    } catch (error) {
      console.error("Error fetching/setting user profile from Firestore:", error);
      setUserProfile(null);
    }
  };

  const refreshUserProfile = async () => {
    setLoading(true);
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const freshFirebaseUser = auth.currentUser;
      setUser(freshFirebaseUser);
      if (freshFirebaseUser) {
        await fetchAndSetUserProfile(freshFirebaseUser);
      } else {
        setUserProfile(null);
        setReferralProcessingAttempted(false); 
      }
    } else {
        setUserProfile(null);
        setReferralProcessingAttempted(false); 
    }
    setLoading(false);
  };


  useEffect(() => {
    let profileListenerUnsubscribe: Unsubscribe | null = null;

    const authUnsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (profileListenerUnsubscribe) {
        profileListenerUnsubscribe();
        profileListenerUnsubscribe = null;
      }

      setLoading(true);
      if (firebaseUser) {
        await firebaseUser.reload();
        const currentFirebaseUser = auth.currentUser;
        setUser(currentFirebaseUser);
        setReferralProcessingAttempted(false); 

        if (currentFirebaseUser) {
          const userRef = doc(db, 'users', currentFirebaseUser.uid);
          await fetchAndSetUserProfile(currentFirebaseUser); 
          
          profileListenerUnsubscribe = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
              const profileData = snapshot.data();
              const updatedProfile: UserProfile = {
                uid: currentFirebaseUser.uid,
                email: currentFirebaseUser.email,
                username: profileData.username || currentFirebaseUser.displayName,
                photoURL: profileData.customPhotoURL || profileData.photoURL || currentFirebaseUser.photoURL,
                customPhotoURL: profileData.customPhotoURL,
                emailVerified: currentFirebaseUser.emailVerified, 
                createdAt: profileData.createdAt,
                lastLogin: profileData.lastLogin,
                tiktokUrl: profileData.tiktokUrl || null,
                instagramUrl: profileData.instagramUrl || null,
                lukuPoints: profileData.lukuPoints || 0,
                referredBy: profileData.referredBy || null,
                referralPointsAwarded: profileData.referralPointsAwarded || false,
                tiktokPointsAwarded: profileData.tiktokPointsAwarded || false,
                instagramPointsAwarded: profileData.instagramPointsAwarded || false,
                badges: profileData.badges || [],
                currentStreak: profileData.currentStreak || 0,
                lastSubmissionDate: profileData.lastSubmissionDate || null,
              };
              setUserProfile(updatedProfile);

               if (
                currentFirebaseUser.emailVerified &&
                updatedProfile.referredBy &&
                !updatedProfile.referralPointsAwarded &&
                !referralProcessingAttempted
              ) {
                setReferralProcessingAttempted(true);
                console.log('[AuthContext Snapshot] Attempting to process referral for user:', currentFirebaseUser.uid);
                 processReferral(currentFirebaseUser.uid).then(result => {
                     if (result.success) {
                        console.log('[AuthContext Snapshot] Referral processed successfully for user:', currentFirebaseUser.uid, 'Message:', result.message);
                     } else {
                        console.error('[AuthContext Snapshot] Failed to process referral:', result.error);
                     }
                 }).catch(e => console.error('[AuthContext Snapshot] Error calling processReferral action:', e));
              }

            } else {
               console.warn("User profile document no longer exists for UID:", currentFirebaseUser.uid);
               setUserProfile(null);
            }
            setLoading(false);
          }, (error) => {
            console.error("Error in profile onSnapshot listener:", error);
            setUserProfile(null);
            setLoading(false);
          });
        } else {
           setUserProfile(null);
           setLoading(false);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setReferralProcessingAttempted(false);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (profileListenerUnsubscribe) {
        profileListenerUnsubscribe();
      }
    };
  }, []); 

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

    