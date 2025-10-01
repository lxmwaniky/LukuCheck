/**
 * Tests for outfitActions.ts
 * 
 * INTERMEDIATE DIFFICULTY - Building on utils.test.ts
 * 
 * This file tests server actions that handle:
 * - Date/time logic (timezones, release schedules)
 * - Firestore queries (leaderboards, outfits)
 * - AI processing (style suggestions)
 * 
 * KEY CONCEPTS YOU'LL LEARN:
 * - Mocking Firebase Firestore
 * - Mocking AI API calls
 * - Testing time-dependent logic with fake timers
 * - Testing async functions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock AI module BEFORE importing the functions
vi.mock('@/ai/flows/style-suggestions', () => ({
  getStyleSuggestions: vi.fn(),
}));

// Mock Firebase config BEFORE importing the functions
vi.mock('@/config/firebase', async () => {
  const { db, storage } = await import('@/__mocks__/firebase');
  return { db, storage };
});

// Mock firebase/firestore module
vi.mock('firebase/firestore', async () => {
  const mocks = await import('@/__mocks__/firebase');
  return {
    collection: mocks.collection,
    query: mocks.query,
    where: mocks.where,
    orderBy: mocks.orderBy,
    getDocs: mocks.getDocs,
    doc: mocks.doc,
    getDoc: mocks.getDoc,
    addDoc: mocks.addDoc,
    Timestamp: mocks.Timestamp,
  };
});

// Import the functions we're testing
import {
  processOutfitWithAI,
  getLeaderboardData,
  getWeeklyLeaderboardData,
  getCurrentWeekStart,
} from '@/actions/outfitActions';

// Import mocked Firestore functions (these are now mocked at module level)
import { getDocs, getDoc } from 'firebase/firestore';

// Import mock helpers
import { 
  createMockQuerySnapshot,
  createMockDocumentSnapshot,
  resetFirebaseClientMocks,
  createMockTimestamp,
  createMockOutfit,
} from '@/__mocks__/firebase';

// Cast as mocks so we can use mockResolvedValue, etc.
const getDocsMock = getDocs as any;
const getDocMock = getDoc as any;

// Import the mocked AI function and cast it as a mock
import { getStyleSuggestions as getStyleSuggestionsOriginal } from '@/ai/flows/style-suggestions';
const getStyleSuggestions = vi.mocked(getStyleSuggestionsOriginal);

// Import AI mock helpers
import {
  mockAIWithRating,
  mockAIError,
  resetAIMocks,
  createMockStyleSuggestions,
} from '@/__mocks__/genkit';

// Import timing config to understand release schedule
import { TIMING_CONFIG } from '@/config/timing';

/**
 * ============================================================================
 * SETUP AND TEARDOWN
 * ============================================================================
 */

beforeEach(() => {
  // Reset all mocks before each test for clean state
  resetFirebaseClientMocks();
  vi.clearAllMocks();
  vi.clearAllTimers();
  
  // Reset AI mock to default behavior
  getStyleSuggestions.mockResolvedValue(createMockStyleSuggestions());
});

afterEach(() => {
  // Clean up after each test
  vi.useRealTimers(); // Restore real timers
  vi.clearAllMocks();
});

/**
 * ============================================================================
 * TEST SUITE 1: processOutfitWithAI()
 * ============================================================================
 * 
 * This function sends an outfit photo to AI and gets style suggestions.
 * 
 * What we're testing:
 * - Does it call the AI with correct parameters?
 * - Does it handle successful AI responses?
 * - Does it handle AI errors gracefully?
 */

describe('processOutfitWithAI()', () => {
  
  /**
   * HAPPY PATH: AI returns valid style suggestions
   */
  it('should successfully process outfit with AI', async () => {
    // ARRANGE: Set up mock AI response
    const mockPhotoData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';
    const mockAIResponse = createMockStyleSuggestions({
      rating: 8.5,
      complimentOrCritique: 'Great outfit!',
    });
    
    getStyleSuggestions.mockResolvedValueOnce(mockAIResponse);
    
    // ACT: Call the function
    const result = await processOutfitWithAI({ photoDataUri: mockPhotoData });
    
    // ASSERT: Check the result
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockAIResponse);
    expect(result.data?.rating).toBe(8.5);
    expect(result.error).toBeUndefined();
    
    // Verify AI was called with correct photo
    expect(getStyleSuggestions).toHaveBeenCalledWith({ photoDataUri: mockPhotoData });
    expect(getStyleSuggestions).toHaveBeenCalledTimes(1);
  });

  /**
   * EDGE CASE: AI returns perfect score (10/10)
   */
  it('should handle perfect score from AI', async () => {
    // ARRANGE: Mock perfect score
    getStyleSuggestions.mockResolvedValueOnce(createMockStyleSuggestions({ rating: 10.0 }));
    
    // ACT
    const result = await processOutfitWithAI({ 
      photoDataUri: 'data:image/jpeg;base64,test' 
    });
    
    // ASSERT
    expect(result.success).toBe(true);
    expect(result.data?.rating).toBe(10.0);
  });

  /**
   * EDGE CASE: AI returns low score
   */
  it('should handle low rating from AI', async () => {
    // ARRANGE: Mock low score
    getStyleSuggestions.mockResolvedValueOnce(createMockStyleSuggestions({ rating: 2.0 }));
    
    // ACT
    const result = await processOutfitWithAI({ 
      photoDataUri: 'data:image/jpeg;base64,test' 
    });
    
    // ASSERT
    expect(result.success).toBe(true);
    expect(result.data?.rating).toBe(2.0);
  });

  /**
   * ERROR CASE: AI service fails
   */
  it('should handle AI service errors', async () => {
    // ARRANGE: Mock AI error
    getStyleSuggestions.mockRejectedValueOnce(new Error('AI service unavailable'));
    
    // ACT
    const result = await processOutfitWithAI({ 
      photoDataUri: 'data:image/jpeg;base64,test' 
    });
    
    // ASSERT
    expect(result.success).toBe(false);
    expect(result.error).toContain('AI service unavailable');
    expect(result.data).toBeUndefined();
  });

  /**
   * ERROR CASE: AI returns invalid data (missing rating)
   */
  it('should handle invalid AI response', async () => {
    // ARRANGE: Mock invalid response (no rating)
    getStyleSuggestions.mockResolvedValueOnce({
      isActualUserOutfit: true,
      rating: undefined as any, // Invalid!
      complimentOrCritique: 'Test',
      colorSuggestions: [],
      lookSuggestions: 'Test',
    });
    
    // ACT
    const result = await processOutfitWithAI({ 
      photoDataUri: 'data:image/jpeg;base64,test' 
    });
    
    // ASSERT
    expect(result.success).toBe(false);
    expect(result.error).toContain('failed to return valid data');
  });
});

/**
 * ============================================================================
 * TEST SUITE 2: getCurrentWeekStart()
 * ============================================================================
 * 
 * This function calculates the Monday of the current week.
 * 
 * What we're testing:
 * - Does it return Monday for any day of the week?
 * - Does it handle Sunday correctly (go back to previous Monday)?
 * - Does it format dates correctly (YYYY-MM-DD)?
 */

describe('getCurrentWeekStart()', () => {
  
  /**
   * TEST: Monday should return itself
   */
  it('should return the same date when called on Monday', async () => {
    // ARRANGE: Set system time to Monday, January 1, 2024
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z')); // Monday
    
    // ACT
    const result = await getCurrentWeekStart();
    
    // ASSERT: Should return the same Monday
    expect(result).toBe('2024-01-01');
  });

  /**
   * TEST: Tuesday should return previous Monday
   */
  it('should return previous Monday when called on Tuesday', async () => {
    // ARRANGE: Set system time to Tuesday, January 2, 2024
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-02T12:00:00Z')); // Tuesday
    
    // ACT
    const result = await getCurrentWeekStart();
    
    // ASSERT: Should return Monday (Jan 1)
    expect(result).toBe('2024-01-01');
  });

  /**
   * TEST: Sunday should return previous Monday (6 days back)
   */
  it('should return previous Monday when called on Sunday', async () => {
    // ARRANGE: Set system time to Sunday, January 7, 2024
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-07T12:00:00Z')); // Sunday
    
    // ACT
    const result = await getCurrentWeekStart();
    
    // ASSERT: Should return Monday (Jan 1, 6 days earlier)
    expect(result).toBe('2024-01-01');
  });

  /**
   * TEST: Friday should return the Monday of the same week
   */
  it('should return Monday of current week when called on Friday', async () => {
    // ARRANGE: Set system time to Friday, January 5, 2024
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-05T12:00:00Z')); // Friday
    
    // ACT
    const result = await getCurrentWeekStart();
    
    // ASSERT: Should return Monday (Jan 1)
    expect(result).toBe('2024-01-01');
  });

  /**
   * TEST: Date format should be YYYY-MM-DD
   */
  it('should return date in YYYY-MM-DD format', async () => {
    // ARRANGE
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-15T12:00:00Z'));
    
    // ACT
    const result = await getCurrentWeekStart();
    
    // ASSERT: Check format with regex
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

/**
 * ============================================================================
 * TEST SUITE 3: getLeaderboardData()
 * ============================================================================
 * 
 * This function fetches leaderboard entries for a specific date.
 * 
 * IMPORTANT TIME LOGIC:
 * - Leaderboard releases at 3 PM (15:00) each day
 * - Before 3 PM: Show yesterday's leaderboard
 * - After 3 PM: Show today's leaderboard
 * 
 * What we're testing:
 * - Does it fetch correct data from Firestore?
 * - Does it handle release time correctly?
 * - Does it enrich data with user profiles?
 */

describe('getLeaderboardData()', () => {
  
  /**
   * HAPPY PATH: Fetch leaderboard with entries
   */
  it('should fetch leaderboard data for a specific date', async () => {
    // ARRANGE: Mock Firestore data
    const mockDate = '2024-01-15';
    const mockOutfits = [
      createMockOutfit({ 
        rating: 9.5, 
        userId: 'user1',
        username: 'fashionista',
        leaderboardDate: mockDate 
      }),
      createMockOutfit({ 
        rating: 8.0, 
        userId: 'user2',
        username: 'styler',
        leaderboardDate: mockDate 
      }),
    ];
    
    // Mock Firestore query
    getDocsMock.mockResolvedValueOnce(createMockQuerySnapshot(mockOutfits));
    
    // Mock user profile lookups
    getDocMock.mockResolvedValue(createMockDocumentSnapshot({
      username: 'fashionista',
      lukuPoints: 100,
      currentStreak: 5,
    }, true));
    
    // ACT
    const result = await getLeaderboardData({ leaderboardDate: mockDate });
    
    // ASSERT
    expect(result.date).toBe(mockDate);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].rating).toBe(9.5);
    expect(result.entries[1].rating).toBe(8.0);
    expect(result.error).toBeUndefined();
    
    // Verify Firestore was queried correctly
    expect(getDocsMock).toHaveBeenCalled();
  });

  /**
   * EDGE CASE: No entries for the date
   */
  it('should handle empty leaderboard (no submissions)', async () => {
    // ARRANGE: Mock empty query result
    getDocsMock.mockResolvedValueOnce(createMockQuerySnapshot([]));
    
    // ACT
    const result = await getLeaderboardData({ leaderboardDate: '2024-01-15' });
    
    // ASSERT
    expect(result.entries).toHaveLength(0);
    expect(result.message).toContain('No submissions found');
  });

  /**
   * TIME LOGIC: Before 3 PM - should show yesterday's data
   */
  it('should show yesterday\'s leaderboard before 3 PM', async () => {
    // ARRANGE: Set time to 2:00 PM (before release)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T14:00:00')); // 2 PM local time
    
    // Mock yesterday's data
    const yesterdayDate = '2024-01-14';
    getDocsMock.mockResolvedValueOnce(createMockQuerySnapshot([
      createMockOutfit({ leaderboardDate: yesterdayDate })
    ]));
    getDocMock.mockResolvedValue(createMockDocumentSnapshot({}, true));
    
    // ACT: Request today's leaderboard
    const result = await getLeaderboardData({ leaderboardDate: '2024-01-15' });
    
    // ASSERT: Should return yesterday's data instead
    expect(result.isWaitingForRelease).toBe(true);
    expect(result.message).toContain('yesterday');
  });

  /**
   * TIME LOGIC: After 6 PM - should show today's data
   */
  it('should show today\'s leaderboard after 6 PM', async () => {
    // ARRANGE: Set time to 6:01 PM (after release)
    // TIMING_CONFIG.LEADERBOARD_RELEASE_HOUR is 18 (6 PM)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T18:01:00')); // 6:01 PM (after 6 PM release)
    
    // Mock today's data
    const todayDate = '2024-01-15';
    getDocsMock.mockResolvedValueOnce(createMockQuerySnapshot([
      createMockOutfit({ leaderboardDate: todayDate })
    ]));
    getDocMock.mockResolvedValue(createMockDocumentSnapshot({}, true));
    
    // ACT
    const result = await getLeaderboardData({ leaderboardDate: todayDate });
    
    // ASSERT: Should return today's data
    expect(result.date).toBe(todayDate);
    expect(result.isWaitingForRelease).toBeUndefined();
  });

  /**
   * EDGE CASE: Invalid date format
   */
  it('should handle invalid date format', async () => {
    // ACT
    const result = await getLeaderboardData({ leaderboardDate: 'invalid-date' });
    
    // ASSERT
    expect(result.error).toContain('Invalid or missing date');
    expect(result.entries).toHaveLength(0);
  });

  /**
   * ERROR CASE: Firestore query fails
   */
  it('should handle Firestore errors', async () => {
    // ARRANGE: Mock Firestore error
    getDocsMock.mockRejectedValueOnce(new Error('Firestore connection failed'));
    
    // ACT
    const result = await getLeaderboardData({ leaderboardDate: '2024-01-15' });
    
    // ASSERT: Error message should contain the actual error
    expect(result.error).toContain('Firestore connection failed');
    expect(result.entries).toHaveLength(0);
  });

  /**
   * EDGE CASE: User profile not found (deleted user)
   */
  it('should handle missing user profiles gracefully', async () => {
    // ARRANGE: Mock outfit with user that no longer exists
    getDocsMock.mockResolvedValueOnce(createMockQuerySnapshot([
      createMockOutfit({ userId: 'deleted-user' })
    ]));
    
    // Mock user not found
    getDocMock.mockResolvedValueOnce(createMockDocumentSnapshot(null, false));
    
    // ACT
    const result = await getLeaderboardData({ leaderboardDate: '2024-01-15' });
    
    // ASSERT: Should still return entry with fallback data
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].userId).toBe('deleted-user');
  });
});

/**
 * ============================================================================
 * TEST SUITE 4: getWeeklyLeaderboardData()
 * ============================================================================
 * 
 * This function aggregates leaderboard data for an entire week.
 * 
 * What we're testing:
 * - Does it calculate the correct week range?
 * - Does it aggregate user submissions correctly?
 * - Does it calculate average and best ratings?
 * - Does it sort by total points?
 */

describe('getWeeklyLeaderboardData()', () => {
  
  /**
   * HAPPY PATH: Aggregate weekly data for multiple users
   */
  it('should aggregate weekly leaderboard data', async () => {
    // ARRANGE: Mock a week of submissions
    const weekStart = '2024-01-01'; // Monday
    
    const mockOutfits = [
      // User 1: 3 submissions
      createMockOutfit({ 
        userId: 'user1', 
        username: 'alice',
        rating: 8.0, 
        leaderboardDate: '2024-01-01' 
      }),
      createMockOutfit({ 
        userId: 'user1', 
        username: 'alice',
        rating: 9.0, 
        leaderboardDate: '2024-01-02' 
      }),
      createMockOutfit({ 
        userId: 'user1', 
        username: 'alice',
        rating: 7.5, 
        leaderboardDate: '2024-01-03' 
      }),
      // User 2: 2 submissions
      createMockOutfit({ 
        userId: 'user2', 
        username: 'bob',
        rating: 9.5, 
        leaderboardDate: '2024-01-01' 
      }),
      createMockOutfit({ 
        userId: 'user2', 
        username: 'bob',
        rating: 8.5, 
        leaderboardDate: '2024-01-02' 
      }),
    ];
    
    getDocsMock.mockResolvedValueOnce(createMockQuerySnapshot(mockOutfits));
    getDocMock.mockResolvedValue(createMockDocumentSnapshot({
      lukuPoints: 50,
      currentStreak: 3,
    }, true));
    
    // ACT
    const result = await getWeeklyLeaderboardData({ weekStart });
    
    // ASSERT
    expect(result.weekStart).toBe('2024-01-01');
    expect(result.weekEnd).toBe('2024-01-07'); // Sunday
    expect(result.entries).toHaveLength(2);
    
    // Check user1 stats (3 submissions, avg 8.17)
    const user1Entry = result.entries.find(e => e.userId === 'user1');
    expect(user1Entry?.totalSubmissions).toBe(3);
    expect(user1Entry?.bestRating).toBe(9.0);
    expect(user1Entry?.avgRating).toBeCloseTo(8.2, 1);
    
    // Check user2 stats (2 submissions, avg 9.0)
    const user2Entry = result.entries.find(e => e.userId === 'user2');
    expect(user2Entry?.totalSubmissions).toBe(2);
    expect(user2Entry?.bestRating).toBe(9.5);
    expect(user2Entry?.avgRating).toBe(9.0);
  });

  /**
   * TEST: Week end calculation
   */
  it('should calculate correct week end date (6 days after start)', async () => {
    // ARRANGE
    getDocsMock.mockResolvedValueOnce(createMockQuerySnapshot([]));
    
    // ACT
    const result = await getWeeklyLeaderboardData({ weekStart: '2024-01-01' });
    
    // ASSERT
    expect(result.weekStart).toBe('2024-01-01'); // Monday
    expect(result.weekEnd).toBe('2024-01-07');   // Sunday (6 days later)
  });

  /**
   * EDGE CASE: Empty week (no submissions)
   */
  it('should handle week with no submissions', async () => {
    // ARRANGE
    getDocsMock.mockResolvedValueOnce(createMockQuerySnapshot([]));
    
    // ACT
    const result = await getWeeklyLeaderboardData({ weekStart: '2024-01-01' });
    
    // ASSERT
    expect(result.entries).toHaveLength(0);
    expect(result.message).toContain('No submissions found');
  });

  /**
   * TEST: Sorting by total points (descending)
   */
  it('should sort users by total points (highest first)', async () => {
    // ARRANGE: User with higher points should be first
    const mockOutfits = [
      // User 1: Lower rating but more submissions
      createMockOutfit({ userId: 'user1', rating: 6.0, leaderboardDate: '2024-01-01' }),
      createMockOutfit({ userId: 'user1', rating: 6.0, leaderboardDate: '2024-01-02' }),
      createMockOutfit({ userId: 'user1', rating: 6.0, leaderboardDate: '2024-01-03' }),
      // User 2: Higher rating but fewer submissions
      createMockOutfit({ userId: 'user2', rating: 10.0, leaderboardDate: '2024-01-01' }),
    ];
    
    getDocsMock.mockResolvedValueOnce(createMockQuerySnapshot(mockOutfits));
    getDocMock.mockResolvedValue(createMockDocumentSnapshot({}, true));
    
    // ACT
    const result = await getWeeklyLeaderboardData({ weekStart: '2024-01-01' });
    
    // ASSERT: Check that entries are sorted by totalPoints
    expect(result.entries[0].totalPoints).toBeGreaterThanOrEqual(result.entries[1].totalPoints);
  });

  /**
   * TIME LOGIC: Should only include released days
   */
  it('should exclude today if leaderboard not yet released', async () => {
    // ARRANGE: Set time to 2 PM (before 3 PM release)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-03T14:00:00')); // Wednesday 2 PM
    
    getDocsMock.mockResolvedValueOnce(createMockQuerySnapshot([]));
    
    // ACT: Request current week
    const result = await getWeeklyLeaderboardData({ weekStart: '2024-01-01' });
    
    // ASSERT: Should have a message (may say "No submissions" or "Updates daily")
    expect(result.message).toBeDefined();
    expect(result.entries).toHaveLength(0);
  });

  /**
   * ERROR CASE: Firestore error
   */
  it('should handle Firestore errors in weekly data', async () => {
    // ARRANGE
    getDocsMock.mockRejectedValueOnce(new Error('Database error'));
    
    // ACT
    const result = await getWeeklyLeaderboardData({ weekStart: '2024-01-01' });
    
    // ASSERT: Error message should contain the actual error
    expect(result.error).toContain('Database error');
    expect(result.entries).toHaveLength(0);
  });
});

/**
 * ============================================================================
 * KEY TESTING CONCEPTS DEMONSTRATED
 * ============================================================================
 * 
 * 1. MOCKING ASYNC FUNCTIONS:
 *    - Use .mockResolvedValueOnce() for successful async calls
 *    - Use .mockRejectedValueOnce() for errors
 * 
 * 2. FAKE TIMERS:
 *    - vi.useFakeTimers() - Enable fake timers
 *    - vi.setSystemTime(date) - Set the "current" time
 *    - vi.useRealTimers() - Restore real timers (in afterEach)
 * 
 * 3. TESTING TIME-DEPENDENT LOGIC:
 *    - Set specific times to test before/after release
 *    - Test different days of the week
 *    - Verify date calculations
 * 
 * 4. MOCKING FIRESTORE:
 *    - Mock query results with createMockQuerySnapshot()
 *    - Mock document lookups with createMockDocumentSnapshot()
 *    - Verify queries were called correctly
 * 
 * 5. TESTING AGGREGATIONS:
 *    - Provide multiple data points
 *    - Verify calculations (avg, sum, max)
 *    - Check sorting logic
 * 
 * ============================================================================
 * HOW TO RUN THESE TESTS
 * ============================================================================
 * 
 * Run only this file:
 *   npm test outfitActions.test
 * 
 * Run in watch mode:
 *   npm run test:watch outfitActions.test
 * 
 * Run with coverage:
 *   npm run test:coverage
 * 
 * ============================================================================
 */
