// src/lib/analytics.ts
import { analytics } from '@/config/firebase';
import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';

// Analytics event names - keeping them organized
export const ANALYTICS_EVENTS = {
  // User authentication events
  SIGN_UP: 'sign_up',
  LOGIN: 'login',
  LOGOUT: 'logout',
  EMAIL_VERIFICATION: 'email_verification',
  
  // Outfit-related events
  OUTFIT_UPLOAD: 'outfit_upload',
  OUTFIT_AI_ANALYSIS: 'outfit_ai_analysis',
  OUTFIT_SUBMIT_TO_LEADERBOARD: 'outfit_submit_to_leaderboard',
  OUTFIT_VIEW_DETAILS: 'outfit_view_details',
  
  // Profile events
  PROFILE_UPDATE: 'profile_update',
  PROFILE_PHOTO_UPLOAD: 'profile_photo_upload',
  SOCIAL_LINK_ADD: 'social_link_add',
  
  // Leaderboard events
  LEADERBOARD_VIEW: 'leaderboard_view',
  LEADERBOARD_FILTER: 'leaderboard_filter',
  
  // Gamification events
  BADGE_EARNED: 'badge_earned',
  POINTS_EARNED: 'points_earned',
  STREAK_ACHIEVED: 'streak_achieved',
  
  // AI usage events
  AI_USAGE_LIMIT_REACHED: 'ai_usage_limit_reached',
  AI_FEEDBACK_VIEW: 'ai_feedback_view',
  
  // Admin events (if needed)
  ADMIN_USER_ROLE_CHANGE: 'admin_user_role_change',
  ADMIN_TICKET_CREATE: 'admin_ticket_create',
  
  // Engagement events
  PAGE_VIEW: 'page_view',
  SESSION_START: 'session_start',
  FEATURE_USAGE: 'feature_usage',
} as const;

// Helper function to safely log analytics events
export function trackEvent(
  eventName: keyof typeof ANALYTICS_EVENTS | string,
  parameters?: Record<string, any>
) {
  if (!analytics || typeof window === 'undefined') {
    // Don't track in server-side rendering or if analytics isn't available
    return;
  }

  try {
    logEvent(analytics, eventName, {
      timestamp: new Date().toISOString(),
      ...parameters,
    });
  } catch (error) {
    console.warn('[ANALYTICS] Failed to log event:', eventName, error);
  }
}

// Set user ID for analytics
export function setAnalyticsUserId(userId: string | null) {
  if (!analytics || typeof window === 'undefined') return;
  
  try {
    if (userId) {
      setUserId(analytics, userId);
    } else {
      setUserId(analytics, null);
    }
  } catch (error) {
    console.warn('[ANALYTICS] Failed to set user ID:', error);
  }
}

// Set user properties for analytics
export function setAnalyticsUserProperties(properties: Record<string, any>) {
  if (!analytics || typeof window === 'undefined') return;
  
  try {
    setUserProperties(analytics, properties);
  } catch (error) {
    console.warn('[ANALYTICS] Failed to set user properties:', error);
  }
}

// Predefined tracking functions for common events
export const track = {
  // Authentication events
  signUp: (method: 'email' | 'google' = 'email') => 
    trackEvent(ANALYTICS_EVENTS.SIGN_UP, { method }),
  
  login: (method: 'email' | 'google' = 'email') => 
    trackEvent(ANALYTICS_EVENTS.LOGIN, { method }),
  
  logout: () => 
    trackEvent(ANALYTICS_EVENTS.LOGOUT),
  
  // Outfit events
  outfitUpload: (fileSize?: number, fileType?: string) => 
    trackEvent(ANALYTICS_EVENTS.OUTFIT_UPLOAD, { file_size: fileSize, file_type: fileType }),
  
  outfitAIAnalysis: (rating: number, processingTime?: number) => 
    trackEvent(ANALYTICS_EVENTS.OUTFIT_AI_ANALYSIS, { 
      rating, 
      processing_time_ms: processingTime 
    }),
  
  outfitSubmitToLeaderboard: (rating: number, userId: string) => 
    trackEvent(ANALYTICS_EVENTS.OUTFIT_SUBMIT_TO_LEADERBOARD, { 
      rating, 
      user_id: userId 
    }),
  
  // Profile events
  profileUpdate: (fields: string[]) => 
    trackEvent(ANALYTICS_EVENTS.PROFILE_UPDATE, { fields_updated: fields }),
  
  socialLinkAdd: (platform: 'tiktok' | 'instagram') => 
    trackEvent(ANALYTICS_EVENTS.SOCIAL_LINK_ADD, { platform }),
  
  // Gamification events
  badgeEarned: (badgeType: string, userPoints: number) => 
    trackEvent(ANALYTICS_EVENTS.BADGE_EARNED, { 
      badge_type: badgeType,
      user_points: userPoints 
    }),
  
  pointsEarned: (points: number, reason: string, totalPoints: number) => 
    trackEvent(ANALYTICS_EVENTS.POINTS_EARNED, { 
      points_earned: points,
      reason,
      total_points: totalPoints 
    }),
  
  // Page views
  pageView: (pageName: string, userId?: string) => 
    trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, { 
      page_name: pageName,
      user_id: userId 
    }),
  
  // AI usage
  aiUsageLimitReached: (currentUsage: number, limit: number) => 
    trackEvent(ANALYTICS_EVENTS.AI_USAGE_LIMIT_REACHED, { 
      current_usage: currentUsage,
      limit 
    }),
  
  // Leaderboard
  leaderboardView: (date: string, userId?: string) => 
    trackEvent(ANALYTICS_EVENTS.LEADERBOARD_VIEW, { 
      leaderboard_date: date,
      user_id: userId 
    }),
  
  // Feature usage
  featureUsage: (featureName: string, context?: string) => 
    trackEvent(ANALYTICS_EVENTS.FEATURE_USAGE, { 
      feature_name: featureName,
      context 
    }),
} as const;

// Initialize user analytics when user logs in
export function initializeUserAnalytics(user: {
  uid: string;
  email?: string | null;
  emailVerified?: boolean;
  role?: string;
  lukuPoints?: number;
  badges?: string[];
}) {
  setAnalyticsUserId(user.uid);
  setAnalyticsUserProperties({
    email_verified: user.emailVerified,
    user_role: user.role || 'user',
    luku_points: user.lukuPoints || 0,
    badge_count: user.badges?.length || 0,
    last_login: new Date().toISOString(),
  });
}

// Clear analytics data on logout
export function clearUserAnalytics() {
  setAnalyticsUserId(null);
}