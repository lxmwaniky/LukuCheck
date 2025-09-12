
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { 
  getAuth,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, type Analytics } from 'firebase/analytics';

const firebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export let isFirebaseConfigValid = false; 

function isValidFirebaseConfig(config: typeof firebaseConfigValues): config is Required<typeof firebaseConfigValues> {
  const allValuesPresent = 
    !!config.apiKey && 
    !!config.authDomain && 
    !!config.projectId && 
    !!config.storageBucket && 
    !!config.messagingSenderId && 
    !!config.appId;
  if (!allValuesPresent) {
    console.error(
      "[LUKUCHECK_CRITICAL_CONFIG_ERROR] Firebase environment variables are missing. App may not function. Check .env.local or hosting provider settings."
    );
    isFirebaseConfigValid = false;
    return false;
  }
  isFirebaseConfigValid = true;
  return true;
}

let app: ReturnType<typeof initializeApp> | null = null;
let authModule: ReturnType<typeof getAuth> | null = null;
let dbModule: ReturnType<typeof getFirestore> | null = null;
let storageModule: ReturnType<typeof getStorage> | null = null;
let analyticsModule: Analytics | null = null;

if (isValidFirebaseConfig(firebaseConfigValues)) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfigValues) : getApp();
    authModule = getAuth(app);
    dbModule = getFirestore(app);
    storageModule = getStorage(app);
    
    // Initialize Analytics only in browser environment
    if (typeof window !== 'undefined') {
      analyticsModule = getAnalytics(app);
    }
    // Optional: A single success log if needed, but often better to keep startup clean.
    // console.log("[LUKUCHECK_FIREBASE_INIT] Firebase SDK initialized successfully.");
  } catch (error) {
    isFirebaseConfigValid = false; 
    console.error("[LUKUCHECK_FIREBASE_INIT_ERROR] Error during Firebase SDK initialization:", error);
  }
} else {
  // Error already logged by isValidFirebaseConfig
}

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { 
  app, 
  authModule as auth, 
  dbModule as db, 
  storageModule as storage,
  analyticsModule as analytics,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
};

    