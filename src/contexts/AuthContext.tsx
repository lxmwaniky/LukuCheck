
'use client';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, db, isFirebaseConfigValid }  from '@/config/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp, getDoc, Unsubscribe, Timestamp, updateDoc } from 'firebase/firestore';
import type { ReactNode} from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { processReferral } from '@/actions/userActions';
import { AlertTriangle } from 'lucide-react';

export type UserRole = 'user' | 'manager' | 'admin';

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
  badges?: string[];
  currentStreak?: number;
  lastSubmissionDate?: string | null;
  lastTop3BonusDate?: string | null;
  role?: UserRole;
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

const MissingFirebaseConfigErrorDisplay = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background text-foreground">
    <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
    <h1 className="text-2xl font-bold text-destructive mb-2">Firebase Configuration Error</h1>
    <p className="text-center mb-1">LukuCheck cannot start because critical Firebase settings are missing.</p>
    <p className="text-center text-sm text-muted-foreground mb-4 max-w-md">
      Please ensure all <strong>NEXT_PUBLIC_FIREBASE_...</strong> environment variables
      (like API Key, Project ID, etc.) are correctly set.
    </p>
    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4 text-left max-w-md">
      <li>If you are developing locally, check your <strong><code>.env.local</code></strong> file in the project root.</li>
      <li><strong>Restart your development server</strong> after making changes to <code>.env.local</code>.</li>
      <li>If this app is deployed, check your hosting provider's (e.g., Vercel) environment variable settings.</li>
    </ul>
    <p className="text-xs text-muted-foreground">Refer to the project setup instructions or the console logs for more details.</p>
  </div>
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralProcessingAttempted, setReferralProcessingAttempted] = useState(false);

  if (!isFirebaseConfigValid) {
    return <MissingFirebaseConfigErrorDisplay />;
  }

  const fetchAndSetUserProfile = useCallback(async (firebaseUser: FirebaseUser) => {
    if (!firebaseUser || !db) {
      setUserProfile(null);
      setReferralProcessingAttempted(false);
      setLoading(false);
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
          lastTop3BonusDate: profileData.lastTop3BonusDate || null,
          role: profileData.role || 'user',
        };
        setUserProfile(loadedProfile);

        if (
          firebaseUser.emailVerified &&
          loadedProfile.referredBy &&
          !loadedProfile.referralPointsAwarded &&
          !referralProcessingAttempted
        ) {
          setReferralProcessingAttempted(true);
          try {
            await processReferral(firebaseUser.uid);
          } catch (e) {
            // Error logged server-side if it occurs
          }
        }

      } else {
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
          lastTop3BonusDate: null,
          role: 'user',
        });
      }
    } catch (error) {
      setUserProfile(null);
    }
  }, [referralProcessingAttempted]);

  const refreshUserProfile = useCallback(async () => {
    if (!auth || !auth.currentUser) {
        setUserProfile(null);
        setReferralProcessingAttempted(false);
        setLoading(false);
        return;
    }
    setLoading(true);
    await auth.currentUser.reload();
    const freshFirebaseUser = auth.currentUser;
    setUser(freshFirebaseUser);
    if (freshFirebaseUser) {
      await fetchAndSetUserProfile(freshFirebaseUser);
    } else {
      setUserProfile(null);
      setReferralProcessingAttempted(false);
    }
    setLoading(false);
  }, [fetchAndSetUserProfile]);


  useEffect(() => {
    if (!auth) {
        setLoading(false);
        setUser(null);
        setUserProfile(null);
        return;
    }

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

        if (currentFirebaseUser && db) {
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
                lastTop3BonusDate: profileData.lastTop3BonusDate || null,
                role: profileData.role || 'user',
              };
              setUserProfile(updatedProfile);

               if (
                currentFirebaseUser.emailVerified &&
                updatedProfile.referredBy &&
                !updatedProfile.referralPointsAwarded &&
                !referralProcessingAttempted
              ) {
                setReferralProcessingAttempted(true);
                 processReferral(currentFirebaseUser.uid).catch(e => {}); // Fire and forget
              }

            } else {
               setUserProfile(null);
            }
            setLoading(false);
          }, (error) => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

