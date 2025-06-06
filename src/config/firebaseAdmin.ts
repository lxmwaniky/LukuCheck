
// This file initializes the Firebase Admin SDK for server-side operations.
import admin from 'firebase-admin';

let adminInitialized = false;
let adminDb: admin.firestore.Firestore | null = null;
let adminAuth: admin.auth.Auth | null = null;
let adminStorageService: admin.storage.Storage | null = null;

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
let storageBucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

let criticalAdminConfigError = false;

if (!serviceAccountBase64) {
  console.error("[ADMIN_SDK_CONFIG_ERROR] CRITICAL: FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set.");
  criticalAdminConfigError = true;
}

if (!storageBucketName) {
  console.error("[ADMIN_SDK_CONFIG_ERROR] CRITICAL: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable is not set.");
  criticalAdminConfigError = true;
}


if (!criticalAdminConfigError) {
  try {
    const serviceAccountJsonString = Buffer.from(serviceAccountBase64!, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJsonString);

    if (storageBucketName!.endsWith('.firebasestorage.app')) {
      // Let's assume the user provides what the Admin SDK expects for `storageBucket` property.
    } else if (!storageBucketName!.endsWith('.appspot.com') && !storageBucketName!.includes('.')) {
        storageBucketName = `${storageBucketName}.appspot.com`;
    }

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: storageBucketName, 
      });
      adminInitialized = true;
    } else {
      // If already initialized (e.g. in a previous serverless function invocation), use existing app.
      // Ensure our modules are set if this path is taken and they weren't on first init.
      adminInitialized = true; 
    }
    
    if(adminInitialized){
        adminDb = admin.firestore();
        adminAuth = admin.auth();
        adminStorageService = admin.storage();
    }

  } catch (error: any) {
    console.error("[ADMIN_SDK_CONFIG_ERROR] Firebase Admin SDK initialization error:", error.message);
    adminInitialized = false;
  }
} else {
  // Error messages already printed above.
  adminInitialized = false;
}

export async function getAdminStorageBucket() {
  if (adminStorageService && adminInitialized) {
    return adminStorageService.bucket();
  }
  return null;
}

export { adminDb, adminAuth, adminInitialized };

    