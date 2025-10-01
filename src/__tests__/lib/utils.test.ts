/**
 * Tests for utils.ts
 * 
 * This is a LEARNING TEST - perfect for beginners!
 * We're testing the cn() function which merges CSS classes.
 * 
 * What is cn()?
 * - Combines multiple class names into one string
 * - Handles conditional classes (objects)
 * - Removes duplicate Tailwind classes (e.g., keeps last "p-4" if you have "p-2 p-4")
 * - Filters out falsy values (null, undefined, false)
 */

import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

/**
 * describe() groups related tests together
 * Think of it as a "test suite" or category
 */
describe('cn() - Class Name Utility', () => {
  
  /**
   * TEST 1: Basic class merging
   * 
   * What we're testing:
   * - Can cn() combine multiple class strings?
   * 
   * Why it matters:
   * - This is the most common use case
   * - Example: cn('text-red-500', 'font-bold') → 'text-red-500 font-bold'
   */
  it('should merge multiple class strings', () => {
    // ARRANGE: Set up test data
    const class1 = 'text-red-500';
    const class2 = 'font-bold';
    const class3 = 'p-4';
    
    // ACT: Call the function we're testing
    const result = cn(class1, class2, class3);
    
    // ASSERT: Check if the result is what we expect
    expect(result).toBe('text-red-500 font-bold p-4');
  });

  /**
   * TEST 2: Conditional classes using objects
   * 
   * What we're testing:
   * - Can cn() handle objects where keys are classes and values are booleans?
   * 
   * Why it matters:
   * - Allows conditional styling: cn({ 'text-red-500': isError, 'text-green-500': !isError })
   * - Only includes classes where the value is true
   */
  it('should handle conditional classes (objects)', () => {
    // ARRANGE: Create an object with conditional classes
    const isActive = true;
    const isDisabled = false;
    
    // ACT: Pass object with boolean values
    const result = cn({
      'bg-blue-500': isActive,    // This will be included (true)
      'bg-gray-300': isDisabled,  // This will be excluded (false)
      'text-white': true,         // This will be included (true)
      'opacity-50': false         // This will be excluded (false)
    });
    
    // ASSERT: Only classes with true values should be included
    expect(result).toBe('bg-blue-500 text-white');
  });

  /**
   * TEST 3: Array of classes
   * 
   * What we're testing:
   * - Can cn() handle arrays of class names?
   * 
   * Why it matters:
   * - Sometimes you build classes dynamically in an array
   * - Example: const classes = ['text-lg', 'font-bold']; cn(classes)
   */
  it('should handle arrays of classes', () => {
    // ARRANGE: Create an array of classes
    const classArray = ['flex', 'items-center', 'justify-between'];
    
    // ACT: Pass the array to cn()
    const result = cn(classArray);
    
    // ASSERT: All classes should be merged
    expect(result).toBe('flex items-center justify-between');
  });

  /**
   * TEST 4: Conflicting Tailwind classes (IMPORTANT!)
   * 
   * What we're testing:
   * - Does cn() handle conflicting Tailwind classes correctly?
   * 
   * Why it matters:
   * - Tailwind classes can conflict (e.g., p-2 and p-4 both set padding)
   * - tailwind-merge keeps only the LAST conflicting class
   * - This prevents CSS conflicts and unexpected styling
   */
  it('should resolve conflicting Tailwind classes (keep last)', () => {
    // ARRANGE: Create conflicting padding classes
    // p-2 = padding: 0.5rem
    // p-4 = padding: 1rem
    // They conflict! Only one should remain.
    const result1 = cn('p-2', 'p-4');
    
    // ASSERT: Should keep p-4 (the last one)
    expect(result1).toBe('p-4');
    
    // ARRANGE: More complex conflict - padding and margin
    const result2 = cn('px-2 py-1', 'p-4');
    // px-2 = padding-left/right: 0.5rem
    // py-1 = padding-top/bottom: 0.25rem
    // p-4 = padding (all sides): 1rem
    // p-4 overrides both px-2 and py-1
    
    // ASSERT: Should keep only p-4
    expect(result2).toBe('p-4');
    
    // ARRANGE: Text size conflict
    const result3 = cn('text-sm', 'text-lg', 'text-xl');
    
    // ASSERT: Should keep text-xl (the last one)
    expect(result3).toBe('text-xl');
  });

  /**
   * TEST 5: Empty, null, and undefined inputs
   * 
   * What we're testing:
   * - Does cn() handle "falsy" values gracefully?
   * 
   * Why it matters:
   * - In real code, you might have: cn('base-class', someCondition && 'conditional-class')
   * - If someCondition is false, it returns false (not a string)
   * - cn() should filter these out, not crash
   */
  it('should filter out falsy values (null, undefined, false)', () => {
    // ARRANGE & ACT: Pass various falsy values
    const result = cn(
      'text-red-500',  // Valid class
      null,            // Should be filtered out
      undefined,       // Should be filtered out
      false,           // Should be filtered out
      '',              // Empty string - should be filtered out
      'font-bold'      // Valid class
    );
    
    // ASSERT: Only valid classes should remain
    expect(result).toBe('text-red-500 font-bold');
  });

  /**
   * TEST 6: Mixed arguments (strings, objects, arrays)
   * 
   * What we're testing:
   * - Can cn() handle a mix of different input types?
   * 
   * Why it matters:
   * - Real-world usage often combines multiple patterns
   * - Example: cn('base', { 'active': isActive }, ['flex', 'items-center'])
   */
  it('should handle mixed argument types', () => {
    // ARRANGE: Create a complex mix of inputs
    const isActive = true;
    const isDisabled = false;
    
    // ACT: Pass strings, objects, and arrays together
    const result = cn(
      'btn',                              // String
      'btn-primary',                      // String
      { 'btn-active': isActive },         // Object (conditional)
      { 'btn-disabled': isDisabled },     // Object (conditional)
      ['rounded-lg', 'shadow-md'],        // Array
      isActive && 'hover:bg-blue-600'     // Conditional string
    );
    
    // ASSERT: Should merge everything correctly
    expect(result).toBe('btn btn-primary btn-active rounded-lg shadow-md hover:bg-blue-600');
  });

  /**
   * TEST 7: No arguments
   * 
   * What we're testing:
   * - What happens if cn() is called with no arguments?
   * 
   * Why it matters:
   * - Edge case that shouldn't crash the app
   * - Should return an empty string
   */
  it('should return empty string when called with no arguments', () => {
    // ACT: Call cn() with no arguments
    const result = cn();
    
    // ASSERT: Should return empty string
    expect(result).toBe('');
  });

  /**
   * TEST 8: Duplicate non-conflicting classes
   * 
   * What we're testing:
   * - Does cn() remove duplicate classes?
   * 
   * Why it matters:
   * - Prevents bloated class strings
   * - Example: 'flex flex' → 'flex'
   */
  it('should remove duplicate classes', () => {
    // ARRANGE & ACT: Pass duplicate classes
    const result = cn('flex', 'items-center', 'flex', 'justify-center', 'items-center');
    
    // ASSERT: Duplicates should be removed (order may vary)
    // Check that each class appears only once
    expect(result).toContain('flex');
    expect(result).toContain('items-center');
    expect(result).toContain('justify-center');
    
    // Verify no duplicates by checking the result doesn't have repeated classes
    const classes = result.split(' ');
    const uniqueClasses = [...new Set(classes)];
    expect(classes.length).toBe(uniqueClasses.length);
  });

  /**
   * TEST 9: Complex real-world example
   * 
   * What we're testing:
   * - A realistic component scenario
   * 
   * Why it matters:
   * - Shows how cn() is actually used in components
   */
  it('should handle complex real-world button example', () => {
    // ARRANGE: Simulate button component props
    const variant: string = 'primary';
    const size: string = 'lg';
    const isLoading = false;
    const isDisabled = true;
    const customClasses = 'my-custom-class';
    
    // ACT: Build button classes like in a real component
    const result = cn(
      // Base button classes
      'inline-flex items-center justify-center rounded-md font-medium transition-colors',
      // Variant classes
      {
        'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
        'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
      } as Record<string, boolean>,
      // Size classes
      {
        'h-9 px-3 text-sm': size === 'sm',
        'h-10 px-4 text-base': size === 'md',
        'h-12 px-6 text-lg': size === 'lg',
      } as Record<string, boolean>,
      // State classes
      {
        'opacity-50 cursor-not-allowed': isDisabled,
        'cursor-wait': isLoading,
      } as Record<string, boolean>,
      // Custom classes from props
      customClasses
    );
    
    // ASSERT: Should build complete button class string
    expect(result).toContain('inline-flex');
    expect(result).toContain('bg-blue-600'); // primary variant
    expect(result).toContain('h-12'); // lg size
    expect(result).toContain('opacity-50'); // disabled state
    expect(result).toContain('my-custom-class'); // custom class
    expect(result).not.toContain('cursor-wait'); // not loading
  });

  /**
   * TEST 10: Tailwind arbitrary values
   * 
   * What we're testing:
   * - Does cn() work with Tailwind's arbitrary values?
   * 
   * Why it matters:
   * - Tailwind allows custom values like: bg-[#1da1f2] or w-[347px]
   * - These should be preserved
   */
  it('should preserve Tailwind arbitrary values', () => {
    // ARRANGE & ACT: Use arbitrary values
    const result = cn(
      'bg-[#1da1f2]',           // Custom hex color
      'w-[347px]',              // Custom width
      'h-[calc(100vh-64px)]'    // Custom calc value
    );
    
    // ASSERT: Arbitrary values should be preserved
    expect(result).toBe('bg-[#1da1f2] w-[347px] h-[calc(100vh-64px)]');
  });
});

/**
 * ============================================================================
 * HOW TO RUN THESE TESTS
 * ============================================================================
 * 
 * Run ALL tests:
 *   npm test
 * 
 * Run ONLY this file:
 *   npm test utils.test
 * 
 * Run in WATCH mode (re-runs on file changes):
 *   npm run test:watch utils.test
 * 
 * Run with COVERAGE:
 *   npm run test:coverage
 * 
 * ============================================================================
 * UNDERSTANDING TEST OUTPUT
 * ============================================================================
 * 
 * ✓ = Test passed (green checkmark)
 * ✗ = Test failed (red X)
 * 
 * Example output:
 * 
 * ✓ src/__tests__/lib/utils.test.ts (10)
 *   ✓ cn() - Class Name Utility (10)
 *     ✓ should merge multiple class strings
 *     ✓ should handle conditional classes (objects)
 *     ✓ should handle arrays of classes
 *     ...
 * 
 * Test Suites: 1 passed, 1 total
 * Tests:       10 passed, 10 total
 * 
 * ============================================================================
 * WHAT EACH TEST CHECKS
 * ============================================================================
 * 
 * Test 1: Basic merging - Can it combine strings?
 * Test 2: Conditional classes - Can it handle objects with boolean values?
 * Test 3: Arrays - Can it handle array inputs?
 * Test 4: Conflicts - Does it resolve Tailwind class conflicts correctly?
 * Test 5: Falsy values - Does it filter out null/undefined/false?
 * Test 6: Mixed inputs - Can it handle strings + objects + arrays together?
 * Test 7: No arguments - Does it handle empty calls?
 * Test 8: Duplicates - Does it remove duplicate classes?
 * Test 9: Real-world - Does it work in a realistic component scenario?
 * Test 10: Arbitrary values - Does it preserve custom Tailwind values?
 * 
 * ============================================================================
 * KEY TESTING CONCEPTS
 * ============================================================================
 * 
 * 1. ARRANGE-ACT-ASSERT Pattern:
 *    - ARRANGE: Set up test data
 *    - ACT: Call the function being tested
 *    - ASSERT: Check if result matches expectations
 * 
 * 2. describe(): Groups related tests
 *    - Think of it as a folder for tests
 *    - Can be nested for sub-groups
 * 
 * 3. it() or test(): Individual test case
 *    - Both do the same thing (it() reads more naturally)
 *    - Should test ONE specific behavior
 * 
 * 4. expect(): Makes assertions
 *    - expect(result).toBe(expected) - Exact equality
 *    - expect(result).toContain(value) - Includes value
 *    - expect(result).not.toBe(value) - Not equal
 * 
 * ============================================================================
 */
