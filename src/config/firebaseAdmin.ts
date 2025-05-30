
// This file initializes the Firebase Admin SDK for server-side operations.

import admin from 'firebase-admin';

let adminInitialized = false;
let adminDb: admin.firestore.Firestore | null = null;
let adminAuth: admin.auth.Auth | null = null;
let adminStorageService: admin.storage.Storage | null = null;

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
const storageBucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

// console.log("--- [ADMIN_SDK_CONFIG] Attempting to initialize Firebase Admin SDK ---");
// console.log("--- [ADMIN_SDK_CONFIG] Environment Variable Check ---");

if (!serviceAccountBase64) {
  console.error("[ADMIN_SDK_CONFIG] CRITICAL: FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set.");
} 
// else {
//   console.log("[ADMIN_SDK_CONFIG] Raw FIREBASE_SERVICE_ACCOUNT_BASE64 (first 10 chars):", serviceAccountBase64.substring(0, 10) + "...");
// }

if (!storageBucketName) {
  console.error("[ADMIN_SDK_CONFIG] CRITICAL: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable is not set.");
} 
// else {
//   console.log("[ADMIN_SDK_CONFIG] Raw NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:", storageBucketName);
// }


if (serviceAccountBase64 && storageBucketName) {
  try {
    const serviceAccountJsonString = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJsonString);

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: storageBucketName, 
      });
      // console.log("[ADMIN_SDK_CONFIG] Firebase Admin SDK initialized successfully.");
      adminInitialized = true;
    } else {
      // console.log("[ADMIN_SDK_CONFIG] Firebase Admin SDK was already initialized.");
      adminInitialized = true; 
    }
    
    if(adminInitialized){
        adminDb = admin.firestore();
        adminAuth = admin.auth();
        adminStorageService = admin.storage();
    }

  } catch (error: any) {
    console.error("[ADMIN_SDK_CONFIG] Firebase Admin SDK initialization error during admin.initializeApp():", error.message);
    if (error.message.includes("JSON.parse")) {
        console.error("[ADMIN_SDK_CONFIG] This often means the FIREBASE_SERVICE_ACCOUNT_BASE64 string is not a valid base64 encoding of the service account JSON, or the JSON itself is malformed.");
    } else if (error.message.includes("storageBucket")) {
        console.error("[ADMIN_SDK_CONFIG] This might be related to the storageBucket name format or permissions.");
    }
    // console.error("[ADMIN_SDK_CONFIG] Full error object:", error);
    adminInitialized = false;
  }
} else {
  console.error("[ADMIN_SDK_CONFIG] Admin SDK not initialized due to missing environment variables.");
  adminInitialized = false;
}
// console.log(`[ADMIN_SDK_CONFIG] Final adminInitialized status when module loaded: ${adminInitialized}`);


export async function getAdminStorageBucket() {
  if (adminStorageService && adminInitialized) {
    return adminStorageService.bucket();
  }
  console.warn("[ADMIN_SDK_CONFIG] Admin Storage not initialized or Admin SDK init failed, cannot get bucket.");
  return null;
}

export { adminDb, adminAuth, adminInitialized };
