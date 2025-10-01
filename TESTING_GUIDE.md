# 🧪 Testing Guide for LukuCheck

Quick reference for running tests in this project.

---

## 🚀 Running Tests

### Run ALL tests
```bash
npm test
```

### Run ONLY utils.test.ts
```bash
npm test utils.test
```

### Run tests in WATCH mode (auto re-runs on changes)
```bash
npm run test:watch
```

### Run tests with COVERAGE report
```bash
npm run test:coverage
```

### Run tests with UI (visual interface)
```bash
npm run test:ui
```

---

## 📊 Understanding Test Output

### Successful Test Run
```
✓ src/__tests__/lib/utils.test.ts (10)
  ✓ cn() - Class Name Utility (10)
    ✓ should merge multiple class strings
    ✓ should handle conditional classes (objects)
    ✓ should handle arrays of classes
    ✓ should resolve conflicting Tailwind classes (keep last)
    ✓ should filter out falsy values (null, undefined, false)
    ✓ should handle mixed argument types
    ✓ should return empty string when called with no arguments
    ✓ should remove duplicate classes
    ✓ should handle complex real-world button example
    ✓ should preserve Tailwind arbitrary values

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Snapshots:   0 total
Time:        0.523s
```

### Failed Test Example
```
✗ src/__tests__/lib/utils.test.ts (10)
  ✗ cn() - Class Name Utility (10)
    ✗ should merge multiple class strings
      Expected: "text-red-500 font-bold p-4"
      Received: "text-red-500 font-bold"
      
      at src/__tests__/lib/utils.test.ts:35:23
```

---

## 🎯 What Each Test File Tests

### ✅ `utils.test.ts` (COMPLETED)
**Status**: Created and ready to run  
**Difficulty**: ⭐ Beginner (easiest)  
**What it tests**: 
- `cn()` function - CSS class merging utility
- 10 test cases covering all edge cases

**Run it**:
```bash
npm test utils.test
```

### 🔜 `outfitActions.test.ts` (TODO)
**Status**: Not yet created  
**Difficulty**: ⭐⭐ Intermediate  
**What it will test**:
- `processOutfitWithAI()` - AI outfit processing
- `getLeaderboardData()` - Leaderboard queries
- `getWeeklyLeaderboardData()` - Weekly rankings
- Time-based logic (release schedules)

### 🔜 `userActions.test.ts` (TODO)
**Status**: Not yet created  
**Difficulty**: ⭐⭐⭐ Advanced  
**What it will test**:
- `createUserProfileInFirestore()` - User creation
- `updateUserProfileInFirestore()` - Profile updates
- `deleteUserData()` - Account deletion
- Badge and points system
- Streak calculations

---

## 📖 Test Structure Explained

### Basic Test Anatomy
```typescript
describe('Function or Component Name', () => {
  it('should do something specific', () => {
    // ARRANGE: Set up test data
    const input = 'test-data';
    
    // ACT: Call the function
    const result = myFunction(input);
    
    // ASSERT: Check the result
    expect(result).toBe('expected-output');
  });
});
```

### Common Assertions

```typescript
// Exact equality
expect(result).toBe('exact-value');

// Contains value
expect(result).toContain('substring');

// Does NOT contain
expect(result).not.toContain('value');

// Truthy/Falsy
expect(result).toBeTruthy();
expect(result).toBeFalsy();

// Object matching
expect(result).toEqual({ key: 'value' });

// Partial object matching
expect(result).toMatchObject({ key: 'value' });

// Function was called
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenCalledTimes(3);

// Array length
expect(array).toHaveLength(5);

// Type checking
expect(result).toBeInstanceOf(Date);
expect(result).toBeNull();
expect(result).toBeUndefined();
```

---

## 🐛 Debugging Failed Tests

### 1. Read the error message carefully
```
Expected: "text-red-500 font-bold p-4"
Received: "text-red-500 font-bold"
```
This tells you exactly what went wrong.

### 2. Check the line number
```
at src/__tests__/lib/utils.test.ts:35:23
```
Go to line 35, column 23 to see the failing assertion.

### 3. Add console.log() for debugging
```typescript
it('should merge classes', () => {
  const result = cn('text-red-500', 'font-bold');
  console.log('Result:', result); // Debug output
  expect(result).toBe('text-red-500 font-bold');
});
```

### 4. Run only the failing test
```bash
npm test utils.test -- -t "should merge classes"
```

---

## 📈 Coverage Reports

After running `npm run test:coverage`, open:
```
coverage/index.html
```

This shows:
- **Lines**: % of code lines executed
- **Functions**: % of functions called
- **Branches**: % of if/else paths tested
- **Statements**: % of statements executed

**Target**: 80%+ coverage for all metrics

---

## 💡 Best Practices

### ✅ DO
- Write descriptive test names: `should merge multiple class strings`
- Test one thing per test
- Use ARRANGE-ACT-ASSERT pattern
- Test edge cases (null, undefined, empty)
- Reset mocks between tests

### ❌ DON'T
- Write vague test names: `test 1`, `it works`
- Test multiple things in one test
- Skip edge cases
- Leave console.log() in tests
- Share state between tests

---

## 🆘 Common Issues

### Issue: "Cannot find module '@/lib/utils'"
**Solution**: Check `vitest.config.ts` has `vite-tsconfig-paths` plugin

### Issue: "vi is not defined"
**Solution**: Add `import { vi } from 'vitest'` at top of test file

### Issue: "expect is not defined"
**Solution**: Either:
- Add `import { expect } from 'vitest'`, OR
- Check `vitest.config.ts` has `globals: true`

### Issue: Tests pass locally but fail in CI
**Solution**: 
- Check for time-dependent tests (use `vi.useFakeTimers()`)
- Check for environment variables
- Ensure mocks are properly reset

---

## 📚 Next Steps

1. ✅ **Run your first test**: `npm test utils.test`
2. 🔜 **Write tests for outfitActions.ts** (intermediate)
3. 🔜 **Write tests for userActions.ts** (advanced)
4. 🎯 **Achieve 80%+ coverage**
5. 🚀 **Add tests to CI/CD pipeline**

---

## 🔗 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Mock Documentation](./src/__mocks__/README.md)

---

**Happy Testing! 🎉**
