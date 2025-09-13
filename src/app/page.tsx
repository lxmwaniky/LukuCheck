'use client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Camera, Sparkles, Trophy, ArrowRight, Zap, Users, Target } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();

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