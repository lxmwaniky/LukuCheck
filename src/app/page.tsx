'use client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Camera, Sparkles, Trophy, ArrowRight, Zap, Users, Target, HelpCircle } from 'lucide-react';
import { FAQ, type FAQItem } from '@/components/ui/faq';

export default function HomePage() {
  const { user, loading } = useAuth();

  const faqItems: FAQItem[] = [
    {
      question: "How does the AI rating system work?",
      answer: (
        <div className="space-y-2">
          <p>Our AI analyzes your outfit based on several key factors:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Style & Fashion Sense:</strong> Overall aesthetic and trend awareness</li>
            <li><strong>Color Coordination:</strong> How well colors work together</li>
            <li><strong>Fit & Proportions:</strong> How the clothing fits your body</li>
            <li><strong>Occasion Appropriateness:</strong> Suitability for the setting</li>
            <li><strong>Overall Presentation:</strong> Complete look and styling</li>
          </ul>
          <p>Ratings range from 1-10, with 10 being a perfect score that earns special bonuses!</p>
        </div>
      )
    },
    {
      question: "How do I earn LukuPoints?",
      answer: (
        <div className="space-y-2">
          <p>You can earn LukuPoints through various activities:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Profile Setup (5 points):</strong> Complete your profile with photo and social links</li>
            <li><strong>First Submission (3 points):</strong> Upload your very first outfit</li>
            <li><strong>Daily Submissions (1 point each):</strong> Keep your submission streak alive</li>
            <li><strong>Weekend Bonus (1 extra point):</strong> Submit on Saturday or Sunday</li>
            <li><strong>Streak Milestones:</strong> 2 points for 3-day streak, 5 points for 7-day streak</li>
            <li><strong>Leaderboard Rankings:</strong> 5 points (1st), 3 points (2nd), 2 points (3rd place)</li>
            <li><strong>Perfect Score (5 points):</strong> Achieve a perfect 10/10 rating</li>
            <li><strong>Style Rookie Bonus (1 point):</strong> Milestone reward for reaching 15 total points</li>
          </ul>
        </div>
      )
    },
    {
      question: "What are badges and how do I earn them?",
      answer: (
        <div className="space-y-2">
          <p>Badges are special achievements that showcase your style journey:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Profile Pro:</strong> Complete your profile setup</li>
            <li><strong>First Submission:</strong> Upload your first outfit</li>
            <li><strong>Streak Starter:</strong> Maintain a 3-day submission streak</li>
            <li><strong>Streak Keeper:</strong> Achieve a 7-day submission streak</li>
            <li><strong>Style Rookie:</strong> Reach 15 LukuPoints</li>
            <li><strong>Weekend Warrior:</strong> Submit outfits on weekends</li>
            <li><strong>Top 3 Finisher:</strong> Rank in daily leaderboard top 3</li>
            <li><strong>Perfect Score:</strong> Achieve a perfect 10/10 rating</li>
            <li><strong>Century Club:</strong> Reach 100 LukuPoints</li>
            <li><strong>Legend Status:</strong> Reach 250 LukuPoints</li>
          </ul>
        </div>
      )
    },
    {
      question: "How does the leaderboard work?",
      answer: (
        <div className="space-y-2">
          <p>LukuCheck features both daily and weekly leaderboards:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Daily Leaderboard:</strong> Ranks users by their highest-rated outfit submitted that day</li>
            <li><strong>Weekly Leaderboard:</strong> Shows cumulative performance over the week including total submissions, average rating, and streak progress</li>
            <li><strong>Ranking Rewards:</strong> Top 3 daily finishers earn bonus LukuPoints</li>
            <li><strong>Global Competition:</strong> Compete with fashion enthusiasts worldwide</li>
          </ul>
          <p>Leaderboards reset daily and weekly to give everyone a fresh chance to compete!</p>
        </div>
      )
    },
    {
      question: "What are submission streaks?",
      answer: (
        <div className="space-y-2">
          <p>Streaks reward consistent daily outfit submissions:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Daily Streak:</strong> Submit at least one outfit per day</li>
            <li><strong>Streak Protection:</strong> Spend 10 LukuPoints to protect your streak for one day</li>
            <li><strong>Milestone Rewards:</strong> Earn bonus points at 3-day and 7-day milestones</li>
            <li><strong>Weekend Bonus:</strong> Extra point for weekend submissions</li>
            <li><strong>Badge Progress:</strong> Streaks unlock special achievement badges</li>
          </ul>
          <p>Maintaining streaks is a great way to consistently improve your style and earn rewards!</p>
        </div>
      )
    },
    {
      question: "Can I improve my rating over time?",
      answer: "Absolutely! The more you use LukuCheck, the better you'll understand what makes a great outfit. Our AI provides detailed feedback on each submission, helping you learn about color coordination, fit, styling, and fashion trends. Many users see their average ratings improve significantly as they apply the AI's suggestions to their daily outfits."
    },
    {
      question: "Is LukuCheck free to use?",
      answer: "Yes! LukuCheck is completely free to use. You can upload outfits, receive AI ratings and feedback, compete on leaderboards, earn points and badges, and access all core features without any cost. We believe everyone deserves access to great style advice!"
    }
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 text-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6">
              Get Your Outfit
              <span className="block text-blue-600">Rated by AI</span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Upload your outfit and receive instant, detailed fashion feedback 
              powered by artificial intelligence. Improve your style and compete 
              with others on the global leaderboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <Link href="/auth">
                  <Button size="lg" className="px-8 py-4 text-lg">
                    Start Rating Outfits
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/upload">
                  <Button size="lg" className="px-8 py-4 text-lg">
                    Rate My Outfit
                    <Camera className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
              
              <Link href="/leaderboard">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                  View Leaderboard
                  <Trophy className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                How It Works
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Three simple steps to get professional fashion feedback
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="p-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Upload Your Outfit
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Take a photo of your outfit and upload it to our platform
                </p>
              </div>

              <div className="p-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  AI Analysis
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Our AI analyzes style, fit, color coordination, and overall look
                </p>
              </div>

              <div className="p-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Get Feedback
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Receive detailed scores and suggestions to improve your style
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
              Why Choose LukuCheck?
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="flex items-start gap-3">
                <Sparkles className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">AI-Powered Analysis</h3>
                  <p className="text-gray-600 dark:text-gray-300">Get professional fashion feedback instantly</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Users className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Global Community</h3>
                  <p className="text-gray-600 dark:text-gray-300">Connect with fashion enthusiasts worldwide</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Trophy className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Competitive Leaderboard</h3>
                  <p className="text-gray-600 dark:text-gray-300">Compete and see how you rank against others</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Target className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Style Improvement</h3>
                  <p className="text-gray-600 dark:text-gray-300">Learn and improve your fashion sense over time</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                <HelpCircle className="h-8 w-8 text-blue-600" />
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  Frequently Asked Questions
                </h2>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Everything you need to know about ratings, rewards, and competing on LukuCheck
              </p>
            </div>

            <FAQ items={faqItems} />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 text-center">
          <div className="container mx-auto max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Improve Your Style?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Join thousands of users who are already using AI to level up their fashion game.
            </p>
            
            {!user ? (
              <Link href="/auth">
                <Button size="lg" className="px-8 py-4 text-lg">
                  Get Started
                  <Sparkles className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link href="/upload">
                <Button size="lg" className="px-8 py-4 text-lg">
                  Upload Your Look
                  <Camera className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}