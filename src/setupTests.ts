/**
 * Global test setup file
 * This file runs before all tests and sets up global mocks and configurations
 */

import { vi, afterEach } from 'vitest';

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================
// Mock environment variables for Firebase and other services
// Note: NODE_ENV is read-only in some environments, but tests run in 'test' mode by default

// ============================================================================
// NEXT.JS MOCKS
// ============================================================================

// Mock Next.js cache revalidation functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

// ============================================================================
// FIREBASE ADMIN SDK MOCKS
// ============================================================================

// Mock Firebase Admin - will be configured per test file as needed
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: vi.fn((date: Date) => ({ 
      seconds: date.getTime() / 1000, 
      nanoseconds: 0,
      toDate: () => date 
    })),
  },
  FieldValue: {
    serverTimestamp: vi.fn(() => ({ _methodName: 'FieldValue.serverTimestamp' })),
    increment: vi.fn((n: number) => ({ _methodName: 'FieldValue.increment', _operand: n })),
    arrayUnion: vi.fn((...elements: any[]) => ({ 
      _methodName: 'FieldValue.arrayUnion', 
      _elements: elements 
    })),
    arrayRemove: vi.fn((...elements: any[]) => ({ 
      _methodName: 'FieldValue.arrayRemove', 
      _elements: elements 
    })),
    delete: vi.fn(() => ({ _methodName: 'FieldValue.delete' })),
  },
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    createUser: vi.fn(),
    getUserByEmail: vi.fn(),
    getUser: vi.fn(),
  })),
}));

vi.mock('firebase-admin/storage', () => ({
  getStorage: vi.fn(() => ({
    bucket: vi.fn(() => ({
      file: vi.fn(),
      getFiles: vi.fn(),
      upload: vi.fn(),
    })),
  })),
}));

// ============================================================================
// FIREBASE CLIENT SDK MOCKS
// ============================================================================

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: vi.fn((date: Date) => ({ 
      seconds: date.getTime() / 1000, 
      nanoseconds: 0,
      toDate: () => date 
    })),
  },
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadString: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: class GoogleAuthProvider {
    providerId = 'google.com';
    setCustomParameters = vi.fn();
    addScope = vi.fn();
  },
}));

// ============================================================================
// DATE/TIME UTILITIES
// ============================================================================

// Helper to create consistent date mocks
export const mockDate = (dateString: string) => {
  const mockDate = new Date(dateString);
  vi.setSystemTime(mockDate);
  return mockDate;
};

// Helper to reset date mocks
export const resetDateMock = () => {
  vi.useRealTimers();
};

// ============================================================================
// CONSOLE MOCKS (Optional - uncomment to suppress console in tests)
// ============================================================================

// Suppress console.log in tests to reduce noise
// vi.spyOn(console, 'log').mockImplementation(() => {});
// vi.spyOn(console, 'warn').mockImplementation(() => {});
// vi.spyOn(console, 'error').mockImplementation(() => {});

// ============================================================================
// GLOBAL TEST UTILITIES
// ============================================================================

// Helper to create mock Firestore Timestamp
export const createMockTimestamp = (date: Date = new Date()) => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: (date.getTime() % 1000) * 1000000,
  toDate: () => date,
  toMillis: () => date.getTime(),
});

// Helper to create mock user profile
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

// ============================================================================
// CLEANUP
// ============================================================================

// Clear all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
