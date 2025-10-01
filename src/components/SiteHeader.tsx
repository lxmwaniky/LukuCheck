'use client';
import Link from 'next/link';
import { Shirt, Trophy, User as UserIcon, LogIn, LogOut, Sun, Moon, Menu, UploadCloud, Coins, Flame, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/config/firebase';
import { signOut } from 'firebase/auth';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useEffect, useState } from 'react';

export function SiteHeader() {
  const { user, userProfile, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      router.push('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const userDisplayName = userProfile?.username || userProfile?.email?.split('@')[0] || "User";
  const userAvatarInitial = (userProfile?.username || "L").charAt(0).toUpperCase();
  const userAvatarSrc = userProfile?.customPhotoURL || userProfile?.photoURL || undefined;
  const isAdminOrManager = userProfile?.role && ['admin', 'manager'].includes(userProfile.role);


  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  
  const renderThemeIcon = () => {
    if (!mounted) {
      
      return <Moon className="h-5 w-5" />;
    }
    return theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />;
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Shirt className="h-8 w-8 text-blue-600 group-hover:text-blue-700 transition-colors" />
          <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">LukuCheck</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-4">
          {user && (
            <>
              <Link href="/upload">
                <Button variant="ghost" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Submit
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button variant="ghost" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  <Trophy className="mr-2 h-4 w-4" />
                  Leaderboard
                </Button>
              </Link>
              <div className="flex items-center gap-3 ml-2">
                {typeof userProfile?.lukuPoints === 'number' && userProfile.lukuPoints > 0 && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 rounded-full">
                    <Coins className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                      {userProfile.lukuPoints}
                    </span>
                  </div>
                )}
                {typeof userProfile?.currentStreak === 'number' && userProfile.currentStreak > 0 && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-orange-50 dark:bg-orange-900/20 rounded-full">
                    <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                      {userProfile.currentStreak}
                    </span>
                  </div>
                )}
                <Link href="/profile">
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700">
                      <AvatarImage src={userAvatarSrc} alt={userDisplayName} />
                      <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-semibold">
                        {userAvatarInitial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden lg:block">
                      {userDisplayName}
                    </span>
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* Theme Toggle Button (Desktop) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {renderThemeIcon()}
          </Button>

          {/* Auth Button */}
          {!loading && (
            user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="ml-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            ) : (
              <Link href="/auth">
                <Button
                  size="sm"
                  className="ml-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )
          )}
        </nav>

        
        <div className="md:hidden flex items-center gap-2">
         
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle theme"
          >
            {renderThemeIcon()}
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0 flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
              <SheetHeader className="p-6 border-b border-gray-200 dark:border-gray-800">
                <Link href="/" className="flex items-center gap-2 group">
                  <Shirt className="h-8 w-8 text-blue-600" />
                  <SheetTitle className="text-xl font-bold text-gray-900 dark:text-white">LukuCheck</SheetTitle>
                </Link>
              </SheetHeader>
              <nav className="flex flex-col p-6 flex-grow space-y-4">
                {user && (
                  <>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Avatar className="h-12 w-12 border border-gray-200 dark:border-gray-700">
                        <AvatarImage src={userAvatarSrc} alt={userDisplayName} />
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-lg font-semibold">
                          {userAvatarInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{userDisplayName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {typeof userProfile?.lukuPoints === 'number' && userProfile.lukuPoints > 0 && (
                            <div className="flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-300">
                              <Coins className="h-3 w-3" />
                              {userProfile.lukuPoints}
                            </div>
                          )}
                          {typeof userProfile?.currentStreak === 'number' && userProfile.currentStreak > 0 && (
                            <div className="flex items-center gap-1 text-xs text-orange-700 dark:text-orange-300">
                              <Flame className="h-3 w-3" />
                              {userProfile.currentStreak}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <SheetClose asChild>
                        <Link href="/upload">
                          <Button variant="ghost" className="w-full justify-start text-base py-3 px-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300">
                            <UploadCloud className="mr-3 h-5 w-5" />
                            Submit Look
                          </Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/leaderboard">
                          <Button variant="ghost" className="w-full justify-start text-base py-3 px-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300">
                            <Trophy className="mr-3 h-5 w-5" />
                            Leaderboard
                          </Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/profile">
                          <Button variant="ghost" className="w-full justify-start text-base py-3 px-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300">
                            <UserIcon className="mr-3 h-5 w-5" />
                            Profile
                          </Button>
                        </Link>
                      </SheetClose>
                      {isAdminOrManager && (
                        <SheetClose asChild>
                          <Link href="/admin">
                            <Button variant="ghost" className="w-full justify-start text-base py-3 px-4 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400">
                              <UserCog className="mr-3 h-5 w-5" />
                              Admin Panel
                            </Button>
                          </Link>
                        </SheetClose>
                      )}
                    </div>
                  </>
                )}
                <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                  {!loading && (
                    user ? (
                      <SheetClose asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-base py-3 px-4 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={handleLogout}
                        >
                          <LogOut className="mr-3 h-5 w-5" />
                          Logout
                        </Button>
                      </SheetClose>
                    ) : (
                      <SheetClose asChild>
                        <Link href="/auth">
                          <Button className="w-full justify-start text-base py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white">
                            <LogIn className="mr-3 h-5 w-5" />
                            Sign In
                          </Button>
                        </Link>
                      </SheetClose>
                    )
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}