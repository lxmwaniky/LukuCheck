/**
 * Firebase Admin SDK Mocks
 * 
 * This file provides mock implementations of Firebase Admin SDK functions
 * used in server actions (userActions.ts). These mocks allow us to test
 * business logic without making actual Firebase calls.
 */

import { vi } from 'vitest';

// ============================================================================
// MOCK DATA TYPES
// ============================================================================

/**
 * Mock Firestore Timestamp
 * Mimics the structure of Firebase Admin Timestamp
 */
export const createMockTimestamp = (date: Date = new Date()) => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: (date.getTime() % 1000) * 1000000,
  toDate: () => date,
  toMillis: () => date.getTime(),
});

/**
 * Mock Timestamp class with static methods
 */
export const Timestamp = {
  now: vi.fn(() => createMockTimestamp()),
  fromDate: vi.fn((date: Date) => createMockTimestamp(date)),
  fromMillis: vi.fn((ms: number) => createMockTimestamp(new Date(ms))),
};

/**
 * Mock FieldValue for Firestore operations
 * These are sentinel values that tell Firestore to perform special operations
 */
export const FieldValue = {
  // Server-side timestamp - returns a sentinel object
  serverTimestamp: vi.fn(() => ({ 
    _methodName: 'FieldValue.serverTimestamp',
    _isFieldValue: true 
  })),
  
  // Increment a numeric field by the specified amount
  increment: vi.fn((n: number) => ({ 
    _methodName: 'FieldValue.increment', 
    _operand: n,
    _isFieldValue: true 
  })),
  
  // Add elements to an array field (no duplicates)
  arrayUnion: vi.fn((...elements: any[]) => ({ 
    _methodName: 'FieldValue.arrayUnion', 
    _elements: elements,
    _isFieldValue: true 
  })),
  
  // Remove elements from an array field
  arrayRemove: vi.fn((...elements: any[]) => ({ 
    _methodName: 'FieldValue.arrayRemove', 
    _elements: elements,
    _isFieldValue: true 
  })),
  
  // Delete a field from a document
  delete: vi.fn(() => ({ 
    _methodName: 'FieldValue.delete',
    _isFieldValue: true 
  })),
};

// ============================================================================
// FIRESTORE ADMIN MOCKS
// ============================================================================

/**
 * Mock Firestore document snapshot
 * Represents a document retrieved from Firestore
 */
export const createMockDocumentSnapshot = (data: any = null, exists = true) => ({
  exists,
  id: 'mock-doc-id',
  ref: { id: 'mock-doc-id', path: 'mock/path' },
  data: vi.fn(() => data),
  get: vi.fn((field: string) => data?.[field]),
  createTime: createMockTimestamp(),
  updateTime: createMockTimestamp(),
  readTime: createMockTimestamp(),
});

/**
 * Mock Firestore query snapshot
 * Represents results from a query
 */
export const createMockQuerySnapshot = (docs: any[] = []) => ({
  empty: docs.length === 0,
  size: docs.length,
  docs: docs.map((data, index) => createMockDocumentSnapshot(data, true)),
  forEach: vi.fn((callback: (doc: any) => void) => {
    docs.forEach((data) => callback(createMockDocumentSnapshot(data, true)));
  }),
});

/**
 * Mock Firestore document reference
 * Represents a reference to a document (may or may not exist)
 */
export const createMockDocumentReference = (initialData: any = null) => {
  let mockData = initialData;
  
  return {
    id: 'mock-doc-id',
    path: 'mock/path',
    
    // Get the document
    get: vi.fn(async () => createMockDocumentSnapshot(mockData, mockData !== null)),
    
    // Set document data (overwrites)
    set: vi.fn(async (data: any) => {
      mockData = data;
      return { writeTime: createMockTimestamp() };
    }),
    
    // Update document data (merges)
    update: vi.fn(async (data: any) => {
      mockData = { ...mockData, ...data };
      return { writeTime: createMockTimestamp() };
    }),
    
    // Delete the document
    delete: vi.fn(async () => {
      mockData = null;
      return { writeTime: createMockTimestamp() };
    }),
    
    // Create a subcollection reference
    collection: vi.fn((collectionPath: string) => createMockCollectionReference()),
  };
};

/**
 * Mock Firestore collection reference
 * Represents a collection of documents
 */
export const createMockCollectionReference = () => ({
  id: 'mock-collection-id',
  path: 'mock/collection/path',
  
  // Get a document reference by ID
  doc: vi.fn((docId?: string) => createMockDocumentReference()),
  
  // Add a new document with auto-generated ID
  add: vi.fn(async (data: any) => {
    const docRef = createMockDocumentReference(data);
    return docRef;
  }),
  
  // Query the collection
  where: vi.fn(() => createMockQuery()),
  orderBy: vi.fn(() => createMockQuery()),
  limit: vi.fn(() => createMockQuery()),
  
  // Get all documents
  get: vi.fn(async () => createMockQuerySnapshot([])),
});

/**
 * Mock Firestore query
 * Represents a query on a collection
 */
export const createMockQuery = () => ({
  where: vi.fn(() => createMockQuery()),
  orderBy: vi.fn(() => createMockQuery()),
  limit: vi.fn(() => createMockQuery()),
  get: vi.fn(async () => createMockQuerySnapshot([])),
});

/**
 * Mock Firestore batch
 * Allows batching multiple write operations
 */
export const createMockBatch = () => ({
  set: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  commit: vi.fn(async () => [{ writeTime: createMockTimestamp() }]),
});

/**
 * Mock Firestore transaction
 * Allows atomic read-write operations
 */
export const createMockTransaction = () => ({
  get: vi.fn(async (docRef: any) => createMockDocumentSnapshot(null, false)),
  set: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

/**
 * Mock Firestore Admin Database
 * Main entry point for Firestore operations
 */
export const createMockAdminDb = () => ({
  collection: vi.fn((collectionPath: string) => createMockCollectionReference()),
  doc: vi.fn((docPath: string) => createMockDocumentReference()),
  batch: vi.fn(() => createMockBatch()),
  runTransaction: vi.fn(async (updateFunction: (transaction: any) => Promise<any>) => {
    const transaction = createMockTransaction();
    return await updateFunction(transaction);
  }),
});

/**
 * Default mock adminDb instance
 * This is what gets imported in tests
 */
export const adminDb = createMockAdminDb();

/**
 * Mock adminInitialized flag
 * Indicates whether Firebase Admin SDK is initialized
 */
export const adminInitialized = true;

// ============================================================================
// FIREBASE AUTH ADMIN MOCKS
// ============================================================================

/**
 * Mock Firebase Auth Admin
 * Handles user authentication operations
 */
export const createMockAdminAuth = () => ({
  // Get user by UID
  getUser: vi.fn(async (uid: string) => ({
    uid,
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
    emailVerified: false,
    disabled: false,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
  })),
  
  // Get user by email
  getUserByEmail: vi.fn(async (email: string) => ({
    uid: 'test-user-id',
    email,
    displayName: 'Test User',
    photoURL: null,
    emailVerified: false,
  })),
  
  // Create a new user
  createUser: vi.fn(async (properties: any) => ({
    uid: 'new-user-id',
    ...properties,
  })),
  
  // Update user properties
  updateUser: vi.fn(async (uid: string, properties: any) => ({
    uid,
    ...properties,
  })),
  
  // Delete a user
  deleteUser: vi.fn(async (uid: string) => undefined),
  
  // Set custom user claims (for roles/permissions)
  setCustomUserClaims: vi.fn(async (uid: string, claims: any) => undefined),
});

/**
 * Mock getAuth function
 * Returns the Auth Admin instance
 */
export const getAdminAuth = vi.fn(() => createMockAdminAuth());

// ============================================================================
// FIREBASE STORAGE ADMIN MOCKS
// ============================================================================

/**
 * Mock Storage File
 * Represents a file in Firebase Storage
 */
export const createMockStorageFile = (filePath: string) => ({
  name: filePath,
  
  // Save file content
  save: vi.fn(async (data: Buffer | string, options?: any) => undefined),
  
  // Make file publicly accessible
  makePublic: vi.fn(async () => undefined),
  
  // Get public URL
  publicUrl: vi.fn(() => `https://storage.googleapis.com/mock-bucket/${filePath}`),
  
  // Delete the file
  delete: vi.fn(async (options?: any) => undefined),
  
  // Download file content
  download: vi.fn(async () => [Buffer.from('mock-file-content')]),
  
  // Check if file exists
  exists: vi.fn(async () => [true]),
  
  // Get file metadata
  getMetadata: vi.fn(async () => ({
    name: filePath,
    bucket: 'mock-bucket',
    contentType: 'image/jpeg',
    size: 1024,
    updated: new Date().toISOString(),
  })),
});

/**
 * Mock Storage Bucket
 * Represents a Firebase Storage bucket
 */
export const createMockStorageBucket = () => ({
  name: 'mock-bucket',
  
  // Get a file reference
  file: vi.fn((filePath: string) => createMockStorageFile(filePath)),
  
  // Get list of files with a prefix
  getFiles: vi.fn(async (options?: { prefix?: string }) => {
    return [[], null]; // [files, nextPageToken]
  }),
  
  // Upload a file
  upload: vi.fn(async (localPath: string, options?: any) => {
    const fileName = localPath.split('/').pop() || 'file';
    return [createMockStorageFile(fileName)];
  }),
  
  // Delete files matching a prefix
  deleteFiles: vi.fn(async (options?: { prefix?: string }) => undefined),
});

/**
 * Mock getAdminStorageBucket function
 * Returns the Storage bucket instance
 */
export const getAdminStorageBucket = vi.fn(async () => createMockStorageBucket());

// ============================================================================
// HELPER FUNCTIONS FOR TESTS
// ============================================================================

/**
 * Reset all Firebase Admin mocks
 * Call this in beforeEach or afterEach to ensure clean state
 */
export const resetFirebaseAdminMocks = () => {
  vi.clearAllMocks();
  
  // Reset FieldValue mocks
  FieldValue.serverTimestamp.mockClear();
  FieldValue.increment.mockClear();
  FieldValue.arrayUnion.mockClear();
  FieldValue.arrayRemove.mockClear();
  FieldValue.delete.mockClear();
  
  // Reset Timestamp mocks
  Timestamp.now.mockClear();
  Timestamp.fromDate.mockClear();
  Timestamp.fromMillis.mockClear();
};

/**
 * Create a mock user profile for testing
 */
export const createMockUserProfile = (overrides = {}) => ({
  uid: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  photoURL: null,
  customPhotoURL: null,
  emailVerified: false,
  createdAt: createMockTimestamp(),
  lastLogin: createMockTimestamp(),
  tiktokUrl: null,
  instagramUrl: null,
  lukuPoints: 5,
  tiktokPointsAwarded: false,
  instagramPointsAwarded: false,
  badges: [],
  currentStreak: 0,
  lastSubmissionDate: null,
  lastTop3BonusDate: null,
  role: 'user',
  isPremium: false,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  stripeSubscriptionStatus: null,
  aiUsageLimit: null,
  ...overrides,
});
