import { processOutfitWithAI, getLeaderboardData } from './outfitActions'; // Assuming this is the correct path
import { getStyleSuggestions } from '../lib/ai'; // Assuming this is the correct path
import { db } from '../lib/firebase'; // Assuming this is the correct path for your Firebase config

// Mock the getStyleSuggestions function
jest.mock('../lib/ai', () => ({
  getStyleSuggestions: jest.fn(),
}));

// Mock Firestore
jest.mock('../lib/firebase', () => {
  const originalFirebase = jest.requireActual('../lib/firebase');
  const mockFirestore = {
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
  };
  return {
    ...originalFirebase,
    db: mockFirestore, // Mock the db export
    // Mock other Firebase services if needed, e.g., auth, storage
  };
});


describe('processOutfitWithAI', () => {
  beforeEach(() => {
    // Clear mock calls and reset any mocked implementations before each test
    (getStyleSuggestions as jest.Mock).mockClear();
  });

  it('should return style suggestions on successful AI processing', async () => {
    const mockSuggestions = {
      style: 'Casual',
      items: ['T-shirt', 'Jeans', 'Sneakers'],
      reasoning: 'A classic casual look.'
    };
    (getStyleSuggestions as jest.Mock).mockResolvedValue(mockSuggestions);

    const result = await processOutfitWithAI('user123', 'outfit456', ['image_url1']);
    expect(result).toEqual(mockSuggestions);
    expect(getStyleSuggestions).toHaveBeenCalledWith(['image_url1']);
  });

  it('should throw an error when AI processing fails', async () => {
    const errorMessage = 'AI processing error';
    (getStyleSuggestions as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(processOutfitWithAI('user123', 'outfit456', ['image_url1'])).rejects.toThrow(errorMessage);
    expect(getStyleSuggestions).toHaveBeenCalledWith(['image_url1']);
  });

  it('should throw an error for invalid or empty AI response', async () => {
    (getStyleSuggestions as jest.Mock).mockResolvedValue(null); // Simulate empty response
    await expect(processOutfitWithAI('user123', 'outfit456', ['image_url1'])).rejects.toThrow('Invalid or empty response from AI service');

    (getStyleSuggestions as jest.Mock).mockResolvedValue({}); // Simulate invalid (empty object)
    await expect(processOutfitWithAI('user123', 'outfit456', ['image_url1'])).rejects.toThrow('Invalid or empty response from AI service');
  });
});

describe('getLeaderboardData', () => {
  // Explicitly type mocks
  const mockCollection = db.collection as jest.Mock;
  const mockQuery = db.query as jest.Mock;
  const mockWhere = db.where as jest.Mock;
  const mockOrderBy = db.orderBy as jest.Mock;
  const mockGetDocs = db.getDocs as jest.Mock;
  const mockDoc = db.doc as jest.Mock;
  const mockGetDoc = db.getDoc as jest.Mock;

  beforeEach(() => {
    // Clear all mock implementations and calls
    mockCollection.mockClear();
    mockQuery.mockClear();
    mockWhere.mockClear();
    mockOrderBy.mockClear();
    mockGetDocs.mockClear();
    mockDoc.mockClear();
    mockGetDoc.mockClear();

    // Reset to default mock implementations if necessary for some tests
    // For example, make query chainable by default:
    mockCollection.mockReturnValue({} as any); // Return a dummy object for chaining
    mockQuery.mockImplementation((q) => q); // Return the query itself for chaining
    mockWhere.mockImplementation((q) => q);
    mockOrderBy.mockImplementation((q) => q);

  });

  it('should return leaderboard data for a valid date with entries', async () => {
    const mockLeaderboardEntries = [
      { id: 'entry1', data: () => ({ userId: 'user1', score: 100, outfitId: 'outfit1' }) },
      { id: 'entry2', data: () => ({ userId: 'user2', score: 90, outfitId: 'outfit2' }) },
    ];
    const mockUser1Doc = { exists: () => true, data: () => ({ username: 'UserOne', profilePic: 'url1' }) };
    const mockUser2Doc = { exists: () => true, data: () => ({ username: 'UserTwo', profilePic: 'url2' }) };

    mockGetDocs.mockResolvedValue({ docs: mockLeaderboardEntries } as any);
    // Mock doc().getDoc() for each user
    mockDoc.mockImplementation((dbRef, path, id) => {
      if (path === 'users' && id === 'user1') return 'user1Ref' as any;
      if (path === 'users' && id === 'user2') return 'user2Ref' as any;
      return 'unknownRef' as any; // Should not happen in this test
    });
    mockGetDoc.mockImplementation((docRef) => {
      if (docRef === 'user1Ref') return Promise.resolve(mockUser1Doc as any);
      if (docRef === 'user2Ref') return Promise.resolve(mockUser2Doc as any);
      return Promise.resolve({ exists: () => false } as any); // Should not happen
    });


    const date = '2023-10-26';
    const data = await getLeaderboardData(date);

    expect(data).toEqual([
      { username: 'UserOne', profilePic: 'url1', score: 100, outfitId: 'outfit1' },
      { username: 'UserTwo', profilePic: 'url2', score: 90, outfitId: 'outfit2' },
    ]);
    expect(mockCollection).toHaveBeenCalledWith(db, 'leaderboards');
    // More specific query checks if necessary:
    // expect(mockWhere).toHaveBeenCalledWith('date', '==', date);
    // expect(mockOrderBy).toHaveBeenCalledWith('score', 'desc');
    expect(mockGetDocs).toHaveBeenCalled();
    expect(mockDoc).toHaveBeenCalledWith(db, 'users', 'user1');
    expect(mockDoc).toHaveBeenCalledWith(db, 'users', 'user2');
    expect(mockGetDoc).toHaveBeenCalledTimes(2);
  });

  it('should return empty array for a valid date with no entries', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] } as any); // No entries

    const date = '2023-10-27';
    const data = await getLeaderboardData(date);

    expect(data).toEqual([]);
    expect(mockCollection).toHaveBeenCalledWith(db, 'leaderboards');
    expect(mockGetDocs).toHaveBeenCalled();
    expect(mockGetDoc).not.toHaveBeenCalled(); // No users to fetch
  });

  it('should throw an error for invalid date format', async () => {
    const invalidDate = '27-10-2023'; // Assuming YYYY-MM-DD is expected by the actual function
    // The actual function `getLeaderboardData` should have validation for the date format.
    // If it throws an error, we test for that. If it tries to query with an invalid date,
    // Firestore might error out, or it might just return no results.
    // For this test, we'll assume the function itself validates the date.
    await expect(getLeaderboardData(invalidDate)).rejects.toThrow('Invalid date format');
  });

  it('should throw an error if Firestore permission is denied', async () => {
    const firestoreError = new Error("Mock Firestore Error: Missing or insufficient permissions.");
    (firestoreError as any).code = 'permission-denied'; // Simulate Firestore error code
    mockGetDocs.mockRejectedValue(firestoreError);

    const date = '2023-10-26';
    await expect(getLeaderboardData(date)).rejects.toThrow("Mock Firestore Error: Missing or insufficient permissions.");
  });

  it('should throw a general error for other Firestore issues', async () => {
    const firestoreError = new Error("Mock Firestore Error: General error.");
    mockGetDocs.mockRejectedValue(firestoreError);

    const date = '2023-10-26';
    await expect(getLeaderboardData(date)).rejects.toThrow("Mock Firestore Error: General error.");
  });
});
