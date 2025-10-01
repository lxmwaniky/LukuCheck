# Firebase & AI Mocks - Complete Guide

This directory contains mock implementations of Firebase and AI services used in tests. Mocking allows us to test business logic without making actual network calls.

## 📁 Files Overview

### `firebaseAdmin.ts`
Mocks for **Firebase Admin SDK** (server-side operations):
- ✅ Firestore Admin (`adminDb`, collections, documents, queries)
- ✅ Firebase Auth Admin (`getAdminAuth`, user management)
- ✅ Firebase Storage Admin (`getAdminStorageBucket`, file operations)
- ✅ FieldValue operations (`increment`, `arrayUnion`, `serverTimestamp`)
- ✅ Timestamp utilities

### `firebase.ts`
Mocks for **Firebase Client SDK** (client-side operations):
- ✅ Firestore Client (`db`, `collection`, `query`, `getDocs`)
- ✅ Firebase Storage Client (`storage`, `ref`, `uploadString`)
- ✅ Firebase Auth Client (`signIn`, `signOut`, `onAuthStateChanged`)

### `genkit.ts`
Mocks for **AI/Genkit services**:
- ✅ `getStyleSuggestions` - AI outfit analysis
- ✅ Predefined responses (high/medium/low ratings)
- ✅ Error scenarios (rate limits, timeouts, invalid images)
- ✅ Usage tracking mocks

---

## 🎯 What is Mocking?

**Mocking** replaces real functions with fake versions that:
1. **Don't make network calls** - Tests run fast and offline
2. **Return predictable data** - Tests are reliable and repeatable
3. **Track function calls** - You can verify functions were called correctly
4. **Simulate errors** - Test error handling without breaking things

### Example: Real vs Mock

**Real Firebase (Production)**:
```typescript
// Makes actual network call to Firebase servers
const userDoc = await adminDb.collection('users').doc('user123').get();
// ❌ Slow (network latency)
// ❌ Requires Firebase credentials
// ❌ Can fail if Firebase is down
// ❌ Costs money (Firebase usage)
```

**Mock Firebase (Tests)**:
```typescript
// Returns fake data instantly
const userDoc = await adminDb.collection('users').doc('user123').get();
// ✅ Instant (no network)
// ✅ No credentials needed
// ✅ Always works
// ✅ Free
```

---

## 🔧 How to Use Mocks in Tests

### Basic Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createUserProfileInFirestore } from '@/actions/userActions';

// Import mocks
import { 
  adminDb, 
  createMockDocumentReference,
  resetFirebaseAdminMocks 
} from '@/__mocks__/firebaseAdmin';

describe('createUserProfileInFirestore', () => {
  beforeEach(() => {
    // Reset mocks before each test for clean state
    resetFirebaseAdminMocks();
  });

  it('should create a user profile', async () => {
    // 1. ARRANGE: Set up mock behavior
    const mockUserRef = createMockDocumentReference();
    adminDb.collection.mockReturnValue({
      doc: vi.fn(() => mockUserRef)
    });

    // 2. ACT: Call the function being tested
    const result = await createUserProfileInFirestore(
      'user123',
      'test@example.com',
      'testuser'
    );

    // 3. ASSERT: Verify the results
    expect(result.success).toBe(true);
    expect(mockUserRef.set).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'user123',
        email: 'test@example.com',
        username: 'testuser'
      })
    );
  });
});
```

---

## 📚 Common Mock Patterns

### 1. Mock a Firestore Document

```typescript
import { createMockDocumentReference } from '@/__mocks__/firebaseAdmin';

// Create a mock document with initial data
const mockUserDoc = createMockDocumentReference({
  uid: 'user123',
  email: 'test@example.com',
  lukuPoints: 10
});

// Mock the collection().doc() chain
adminDb.collection.mockReturnValue({
  doc: vi.fn(() => mockUserDoc)
});

// Now when your code calls adminDb.collection('users').doc('user123')
// it returns mockUserDoc
```

### 2. Mock a Firestore Query

```typescript
import { createMockQuerySnapshot } from '@/__mocks__/firebaseAdmin';

// Create mock query results
const mockOutfits = [
  { userId: 'user123', rating: 8.5, outfitImageURL: 'url1' },
  { userId: 'user123', rating: 7.0, outfitImageURL: 'url2' }
];

const mockQuery = {
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  get: vi.fn(async () => createMockQuerySnapshot(mockOutfits))
};

adminDb.collection.mockReturnValue(mockQuery);

// Now queries return your mock data
const snapshot = await adminDb.collection('outfits')
  .where('userId', '==', 'user123')
  .orderBy('rating', 'desc')
  .get();

expect(snapshot.docs).toHaveLength(2);
```

### 3. Mock Storage Upload

```typescript
import { getAdminStorageBucket } from '@/__mocks__/firebaseAdmin';

// Mock storage bucket
const mockBucket = {
  file: vi.fn((path) => ({
    save: vi.fn(async () => undefined),
    makePublic: vi.fn(async () => undefined),
    publicUrl: () => `https://storage.googleapis.com/bucket/${path}`
  }))
};

getAdminStorageBucket.mockResolvedValue(mockBucket);

// Now storage operations work without real uploads
const bucket = await getAdminStorageBucket();
const file = bucket.file('photos/test.jpg');
await file.save(Buffer.from('fake-image-data'));
expect(file.save).toHaveBeenCalled();
```

### 4. Mock AI Responses

```typescript
import { getStyleSuggestions, mockAIWithRating } from '@/__mocks__/genkit';

// Option 1: Mock with specific rating
mockAIWithRating(9.5);
const result = await getStyleSuggestions({ photoDataUri: 'data:image...' });
expect(result.rating).toBe(9.5);

// Option 2: Mock with custom response
getStyleSuggestions.mockResolvedValueOnce({
  rating: 10.0,
  complimentOrCritique: 'Perfect!',
  colorSuggestions: ['No changes needed'],
  lookSuggestions: 'Flawless style'
});

// Option 3: Mock an error
getStyleSuggestions.mockRejectedValueOnce(
  new Error('AI service unavailable')
);
```

### 5. Mock FieldValue Operations

```typescript
import { FieldValue } from '@/__mocks__/firebaseAdmin';

// Test code that uses FieldValue.increment
await userRef.update({
  lukuPoints: FieldValue.increment(5)
});

// Verify FieldValue.increment was called correctly
expect(FieldValue.increment).toHaveBeenCalledWith(5);

// Check the returned sentinel value
const incrementValue = FieldValue.increment(5);
expect(incrementValue._methodName).toBe('FieldValue.increment');
expect(incrementValue._operand).toBe(5);
```

---

## 🧪 Testing Different Scenarios

### Success Scenario
```typescript
it('should successfully update user profile', async () => {
  const mockUserDoc = createMockDocumentReference({
    uid: 'user123',
    username: 'oldname'
  });
  
  adminDb.collection.mockReturnValue({
    doc: vi.fn(() => mockUserDoc)
  });

  const result = await updateUserProfileInFirestore({
    userId: 'user123',
    username: 'newname'
  });

  expect(result.success).toBe(true);
  expect(mockUserDoc.update).toHaveBeenCalled();
});
```

### Error Scenario
```typescript
it('should handle database errors', async () => {
  const mockUserDoc = createMockDocumentReference();
  mockUserDoc.update.mockRejectedValueOnce(
    new Error('Database connection failed')
  );

  adminDb.collection.mockReturnValue({
    doc: vi.fn(() => mockUserDoc)
  });

  const result = await updateUserProfileInFirestore({
    userId: 'user123',
    username: 'newname'
  });

  expect(result.success).toBe(false);
  expect(result.error).toContain('Database connection failed');
});
```

### Edge Cases
```typescript
it('should handle non-existent user', async () => {
  const mockUserDoc = createMockDocumentReference(null); // No data
  mockUserDoc.get.mockResolvedValueOnce(
    createMockDocumentSnapshot(null, false) // exists = false
  );

  adminDb.collection.mockReturnValue({
    doc: vi.fn(() => mockUserDoc)
  });

  const result = await someFunction('nonexistent-user');

  expect(result.error).toContain('User not found');
});
```

---

## 🎓 Key Vitest Mock Functions

### `vi.fn()`
Creates a mock function that tracks calls:
```typescript
const mockFn = vi.fn();
mockFn('arg1', 'arg2');

expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenCalledTimes(1);
```

### `vi.mock()`
Mocks an entire module:
```typescript
vi.mock('@/config/firebaseAdmin', () => ({
  adminDb: createMockAdminDb(),
  adminInitialized: true
}));
```

### Mock Return Values
```typescript
// Return once
mockFn.mockReturnValueOnce('first call');
mockFn.mockReturnValueOnce('second call');

// Return always
mockFn.mockReturnValue('always this');

// Async return
mockFn.mockResolvedValueOnce({ data: 'success' });
mockFn.mockRejectedValueOnce(new Error('failed'));
```

### Mock Implementation
```typescript
mockFn.mockImplementation((arg) => {
  if (arg === 'error') throw new Error('Mock error');
  return { result: arg };
});
```

---

## 🔍 Verifying Mock Calls

```typescript
// Check if called
expect(mockFn).toHaveBeenCalled();
expect(mockFn).not.toHaveBeenCalled();

// Check call count
expect(mockFn).toHaveBeenCalledTimes(3);

// Check arguments
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenLastCalledWith('last', 'args');

// Check with partial match
expect(mockFn).toHaveBeenCalledWith(
  expect.objectContaining({ userId: 'user123' })
);

// Get all calls
const calls = mockFn.mock.calls;
expect(calls[0][0]).toBe('first-arg-of-first-call');
```

---

## 🧹 Cleanup Between Tests

Always reset mocks to avoid test pollution:

```typescript
import { beforeEach, afterEach } from 'vitest';
import { resetFirebaseAdminMocks } from '@/__mocks__/firebaseAdmin';

beforeEach(() => {
  // Reset before each test
  resetFirebaseAdminMocks();
});

afterEach(() => {
  // Or reset after each test
  vi.clearAllMocks();
});
```

---

## 💡 Best Practices

1. **Reset mocks between tests** - Prevents test pollution
2. **Mock at the right level** - Mock external services, not internal logic
3. **Use realistic data** - Mock data should match production data structure
4. **Test both success and failure** - Mock errors to test error handling
5. **Verify mock calls** - Check that functions were called with correct arguments
6. **Keep mocks simple** - Don't over-complicate mock implementations
7. **Document complex mocks** - Add comments explaining mock behavior

---

## 📖 Further Reading

- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Firebase Testing Docs](https://firebase.google.com/docs/rules/unit-tests)

---

## 🆘 Common Issues

### Issue: Mock not working
**Solution**: Make sure you're mocking before importing the module that uses it.

### Issue: Mock persists between tests
**Solution**: Call `resetFirebaseAdminMocks()` in `beforeEach`.

### Issue: Type errors with mocks
**Solution**: Use `vi.fn()` with proper TypeScript types or `as any` for complex mocks.

### Issue: Can't verify mock was called
**Solution**: Make sure you're using the same mock instance that the code calls.

---

Happy Testing! 🎉
