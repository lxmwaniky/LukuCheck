/**
 * Centralized timing configuration for LukuCheck daily challenges
 * 
 * All times are in 24-hour format (0-23)
 */

export const TIMING_CONFIG = {
  // Submission window
  SUBMISSION_OPEN_HOUR: 6,    // 6 AM
  SUBMISSION_CLOSE_HOUR: 18,  // 6 PM (changed from 20/8 PM)
  
  // Leaderboard timing
  LEADERBOARD_RELEASE_HOUR: 18,      // 6:00 PM (same time submissions close)
  LEADERBOARD_RELEASE_MINUTE: 0,
  
  // Leaderboard viewing cutoff (determines which day's leaderboard to show)
  LEADERBOARD_VIEWING_CUTOFF_HOUR: 18,   // 6:25 PM (changed from 20:25/8:25 PM)
  LEADERBOARD_VIEWING_CUTOFF_MINUTE: 25,
  
  // When leaderboard viewing ends (next day)
  LEADERBOARD_VIEWING_END_HOUR: 18,      // 6 PM next day (changed from 20/8 PM)
  
  // AI usage reset time (stays the same)
  AI_USAGE_RESET_HOUR: 6,    // 6 AM
} as const;

/**
 * User-friendly display strings for the timing
 */
export const TIMING_DISPLAY = {
  SUBMISSION_WINDOW: '6:00 AM - 6:00 PM',
  LEADERBOARD_RELEASE: '6:00 PM',
  AI_RESET: '6:00 AM',
} as const;

/**
 * Helper messages for different states
 */
export const TIMING_MESSAGES = {
  SUBMISSION_OPEN_SOON: (timeLeft: string) => `Today's submission window (6 AM - 6 PM) for the leaderboard opens in: ${timeLeft}`,
  SUBMISSION_LIVE: (timeLeft: string) => `Submissions LIVE! Closes In: ${timeLeft}`,
  SUBMISSION_OPENS_TOMORROW: (timeLeft: string) => `Opens tomorrow in ${timeLeft}`,
  SUBMISSION_CLOSED_TODAY: 'The 6 PM deadline for today\'s leaderboard submissions has passed. Try again tomorrow from 6 AM!',
  
  LEADERBOARD_RELEASE_IN: (date: string, timeLeft: string) => `${date} Results Release In: ${timeLeft}`,
  LEADERBOARD_LIVE: (date: string, timeLeft: string) => `${date} Results LIVE! Viewable For: ${timeLeft}`,
  
  FAQ_SCHEDULE: `The daily style challenge runs on the following schedule:
• AI Rating Credits Reset: 6:00 AM daily
• Outfit Submission Window: 6:00 AM - 6:00 PM daily  
• Leaderboard Results Release: 6:00 PM daily
• Leaderboard Viewable Until: 6:00 PM the following day`,
} as const;