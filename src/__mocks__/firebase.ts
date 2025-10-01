/**
 * Firebase Client SDK Mocks
 * 
 * This file provides mock implementations of Firebase Client SDK functions
 * used in client-side actions (outfitActions.ts). These mocks simulate
 * Firestore queries, Storage uploads, and Auth operations.
 */

import { vi } from 'vitest';

// ============================================================================
// MOCK DATA TYPES
// ============================================================================

/**
 * Mock Firestore Timestamp (Client SDK)
 * Mimics firebase/firestore Timestamp
 */
export const createMockTimestamp = (date: Date = new Date()) => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: (date.getTime() % 1000) * 1000000,
  toDate: () => date,
  toMillis: () => date.getTime(),
  isEqual: vi.fn((other: any) => date.getTime() === other?.toDate?.()?.getTime()),
});

/**
 * Mock Timestamp class with static methods
 */
export const Timestamp = {
  now: vi.fn(() => createMockTimestamp()),
  fromDate: vi.fn((date: Date) => createMockTimestamp(date)),
  fromMillis: vi.fn((ms: number) => createMockTimestamp(new Date(ms))),
};

// ============================================================================
// FIRESTORE CLIENT MOCKS
// ============================================================================

/**
 * Mock Firestore document snapshot (Client SDK)
 */
export const createMockDocumentSnapshot = (data: any = null, exists = true) => ({
  exists: () => exists,
  id: 'mock-doc-id',
  ref: { id: 'mock-doc-id', path: 'mock/path' },
  data: () => data,
  get: (field: string) => data?.[field],
  metadata: {
    hasPendingWrites: false,
    fromCache: false,
  },
});

/**
 * Mock Firestore query snapshot (Client SDK)
 */
export const createMockQuerySnapshot = (docs: any[] = []) => ({
  empty: docs.length === 0,
  size: docs.length,
  docs: docs.map((data, index) => ({
    ...createMockDocumentSnapshot(data, true),
    id: `doc-${index}`,
  })),
  forEach: (callback: (doc: any) => void) => {
    docs.forEach((data, index) => {
      callback({
        ...createMockDocumentSnapshot(data, true),
        id: `doc-${index}`,
      });
    });
  },
  metadata: {
    hasPendingWrites: false,
    fromCache: false,
  },
});

/**
 * Mock Firestore document reference (Client SDK)
 */
export const createMockDocumentReference = (initialData: any = null) => {
  let mockData = initialData;
  
  return {
    id: 'mock-doc-id',
    path: 'mock/path',
    
    // Get the document
    get: vi.fn(async () => createMockDocumentSnapshot(mockData, mockData !== null)),
    
    // Set document data
    set: vi.fn(async (data: any, options?: any) => {
      mockData = options?.merge ? { ...mockData, ...data } : data;
      return undefined;
    }),
    
    // Update document data
    update: vi.fn(async (data: any) => {
      mockData = { ...mockData, ...data };
      return undefined;
    }),
    
    // Delete the document
    delete: vi.fn(async () => {
      mockData = null;
      return undefined;
    }),
    
    // Collection reference
    collection: vi.fn((collectionPath: string) => createMockCollectionReference()),
  };
};

/**
 * Mock Firestore collection reference (Client SDK)
 */
export const createMockCollectionReference = () => ({
  id: 'mock-collection-id',
  path: 'mock/collection/path',
  
  // Get a document reference
  doc: vi.fn((docId?: string) => createMockDocumentReference()),
  
  // Add a new document
  add: vi.fn(async (data: any) => createMockDocumentReference(data)),
});

/**
 * Mock Firestore query (Client SDK)
 */
export const createMockQuery = (mockResults: any[] = []) => ({
  // These return the query itself for chaining
  where: vi.fn(function(this: any) { return this; }),
  orderBy: vi.fn(function(this: any) { return this; }),
  limit: vi.fn(function(this: any) { return this; }),
  startAfter: vi.fn(function(this: any) { return this; }),
  endBefore: vi.fn(function(this: any) { return this; }),
  
  // Execute the query
  get: vi.fn(async () => createMockQuerySnapshot(mockResults)),
});

// ============================================================================
// FIRESTORE CLIENT SDK FUNCTIONS
// ============================================================================

/**
 * Mock db instance
 */
export const db = {
  _type: 'Firestore',
  app: { name: 'mock-app' },
};

/**
 * Mock collection function
 * Returns a collection reference
 */
export const collection = vi.fn((db: any, collectionPath: string) => 
  createMockCollectionReference()
);

/**
 * Mock doc function
 * Returns a document reference
 */
export const doc = vi.fn((db: any, ...pathSegments: string[]) => 
  createMockDocumentReference()
);

/**
 * Mock getDoc function
 * Gets a single document
 */
export const getDoc = vi.fn(async (docRef: any) => 
  createMockDocumentSnapshot(null, false)
);

/**
 * Mock getDocs function
 * Gets multiple documents from a query
 */
export const getDocs = vi.fn(async (query: any) => 
  createMockQuerySnapshot([])
);

/**
 * Mock addDoc function
 * Adds a document to a collection
 */
export const addDoc = vi.fn(async (collectionRef: any, data: any) => 
  createMockDocumentReference(data)
);

/**
 * Mock setDoc function
 * Sets a document's data
 */
export const setDoc = vi.fn(async (docRef: any, data: any, options?: any) => 
  undefined
);

/**
 * Mock updateDoc function
 * Updates a document's data
 */
export const updateDoc = vi.fn(async (docRef: any, data: any) => 
  undefined
);

/**
 * Mock deleteDoc function
 * Deletes a document
 */
export const deleteDoc = vi.fn(async (docRef: any) => 
  undefined
);

/**
 * Mock query function
 * Creates a query on a collection
 */
export const query = vi.fn((collectionRef: any, ...queryConstraints: any[]) => 
  createMockQuery([])
);

/**
 * Mock where function
 * Creates a where clause for queries
 */
export const where = vi.fn((fieldPath: string, opStr: string, value: any) => ({
  type: 'where',
  fieldPath,
  opStr,
  value,
}));

/**
 * Mock orderBy function
 * Creates an orderBy clause for queries
 */
export const orderBy = vi.fn((fieldPath: string, directionStr?: 'asc' | 'desc') => ({
  type: 'orderBy',
  fieldPath,
  directionStr: directionStr || 'asc',
}));

/**
 * Mock limit function
 * Limits query results
 */
export const limit = vi.fn((limit: number) => ({
  type: 'limit',
  limit,
}));

// ============================================================================
// FIREBASE STORAGE CLIENT MOCKS
// ============================================================================

/**
 * Mock Storage reference
 */
export const createMockStorageRef = (fullPath: string) => ({
  bucket: 'mock-bucket',
  fullPath,
  name: fullPath.split('/').pop() || 'file',
  parent: null,
  root: null,
  storage: { app: { name: 'mock-app' } },
  toString: () => `gs://mock-bucket/${fullPath}`,
});

/**
 * Mock storage instance
 */
export const storage = {
  app: { name: 'mock-app' },
  maxOperationRetryTime: 120000,
  maxUploadRetryTime: 600000,
};

/**
 * Mock ref function
 * Creates a storage reference
 */
export const ref = vi.fn((storage: any, path?: string) => 
  createMockStorageRef(path || 'default-path')
);

/**
 * Mock uploadString function
 * Uploads a string to storage
 */
export const uploadString = vi.fn(async (
  storageRef: any, 
  data: string, 
  format?: string,
  metadata?: any
) => ({
  metadata: {
    bucket: 'mock-bucket',
    fullPath: storageRef.fullPath,
    name: storageRef.name,
    size: data.length,
    contentType: metadata?.contentType || 'text/plain',
    timeCreated: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  ref: storageRef,
  state: 'success',
  bytesTransferred: data.length,
  totalBytes: data.length,
}));

/**
 * Mock uploadBytes function
 * Uploads bytes to storage
 */
export const uploadBytes = vi.fn(async (
  storageRef: any,
  data: Uint8Array | ArrayBuffer,
  metadata?: any
) => ({
  metadata: {
    bucket: 'mock-bucket',
    fullPath: storageRef.fullPath,
    name: storageRef.name,
    size: data.byteLength || 0,
    contentType: metadata?.contentType || 'application/octet-stream',
    timeCreated: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  ref: storageRef,
  state: 'success',
  bytesTransferred: data.byteLength || 0,
  totalBytes: data.byteLength || 0,
}));

/**
 * Mock getDownloadURL function
 * Gets the download URL for a file
 */
export const getDownloadURL = vi.fn(async (storageRef: any) => 
  `https://firebasestorage.googleapis.com/v0/b/mock-bucket/o/${encodeURIComponent(storageRef.fullPath)}?alt=media&token=mock-token`
);

/**
 * Mock deleteObject function
 * Deletes a file from storage
 */
export const deleteObject = vi.fn(async (storageRef: any) => 
  undefined
);

// ============================================================================
// FIREBASE AUTH CLIENT MOCKS
// ============================================================================

/**
 * Mock User object
 */
export const createMockUser = (overrides = {}) => ({
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: false,
  isAnonymous: false,
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  },
  providerData: [],
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  delete: vi.fn(async () => undefined),
  getIdToken: vi.fn(async () => 'mock-id-token'),
  getIdTokenResult: vi.fn(async () => ({
    token: 'mock-id-token',
    claims: {},
    authTime: new Date().toISOString(),
    issuedAtTime: new Date().toISOString(),
    expirationTime: new Date(Date.now() + 3600000).toISOString(),
    signInProvider: 'password',
  })),
  reload: vi.fn(async () => undefined),
  toJSON: vi.fn(() => ({ uid: 'test-user-id', email: 'test@example.com' })),
  ...overrides,
});

/**
 * Mock Auth instance
 */
export const auth = {
  app: { name: 'mock-app' },
  currentUser: null as any,
  languageCode: 'en',
  tenantId: null,
};

/**
 * Mock signInWithEmailAndPassword
 */
export const signInWithEmailAndPassword = vi.fn(async (
  auth: any,
  email: string,
  password: string
) => ({
  user: createMockUser({ email }),
  providerId: 'password',
  operationType: 'signIn',
}));

/**
 * Mock createUserWithEmailAndPassword
 */
export const createUserWithEmailAndPassword = vi.fn(async (
  auth: any,
  email: string,
  password: string
) => ({
  user: createMockUser({ email }),
  providerId: 'password',
  operationType: 'signIn',
}));

/**
 * Mock signOut
 */
export const signOut = vi.fn(async (auth: any) => undefined);

/**
 * Mock onAuthStateChanged
 */
export const onAuthStateChanged = vi.fn((
  auth: any,
  nextOrObserver: any,
  error?: any,
  completed?: any
) => {
  // Return unsubscribe function
  return () => {};
});

/**
 * Mock GoogleAuthProvider
 */
export class GoogleAuthProvider {
  providerId = 'google.com';
  
  setCustomParameters = vi.fn((params: any) => {
    return this;
  });
  
  addScope = vi.fn((scope: string) => {
    return this;
  });
}

/**
 * Mock getAuth function
 */
export const getAuth = vi.fn(() => auth);

// ============================================================================
// HELPER FUNCTIONS FOR TESTS
// ============================================================================

/**
 * Reset all Firebase Client mocks
 */
export const resetFirebaseClientMocks = () => {
  vi.clearAllMocks();
  
  // Reset Timestamp mocks
  Timestamp.now.mockClear();
  Timestamp.fromDate.mockClear();
  Timestamp.fromMillis.mockClear();
  
  // Reset Firestore mocks
  collection.mockClear();
  doc.mockClear();
  getDoc.mockClear();
  getDocs.mockClear();
  addDoc.mockClear();
  setDoc.mockClear();
  updateDoc.mockClear();
  deleteDoc.mockClear();
  query.mockClear();
  where.mockClear();
  orderBy.mockClear();
  limit.mockClear();
  
  // Reset Storage mocks
  ref.mockClear();
  uploadString.mockClear();
  uploadBytes.mockClear();
  getDownloadURL.mockClear();
  deleteObject.mockClear();
  
  // Reset Auth mocks
  signInWithEmailAndPassword.mockClear();
  createUserWithEmailAndPassword.mockClear();
  signOut.mockClear();
  onAuthStateChanged.mockClear();
};

/**
 * Create mock outfit data for testing
 */
export const createMockOutfit = (overrides = {}) => ({
  id: 'mock-outfit-id',
  userId: 'test-user-id',
  username: 'testuser',
  userPhotoURL: null,
  outfitImageURL: 'https://example.com/outfit.jpg',
  rating: 7.5,
  submittedAt: createMockTimestamp(),
  leaderboardDate: '2025-10-01',
  complimentOrCritique: 'Great color coordination!',
  colorSuggestions: ['Try adding navy blue', 'Consider earth tones'],
  lookSuggestions: 'Perfect for a casual day out',
  ...overrides,
});
