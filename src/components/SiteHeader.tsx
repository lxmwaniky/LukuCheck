
'use client';
import Link from 'next/link';
import { Shirt, Trophy, User as UserIcon, LogIn, LogOut, Sun, Moon, Menu, UploadCloud, Coins, Coffee, Flame, ShieldCheck, UserCog, ListChecks } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/config/firebase';
import { signOut } from 'firebase/auth';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'; // Removed SheetClose, SheetDescription
import { useEffect, useState } from 'react';
import { LukuBadge } from '@/components/LukuBadge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      // console.error('Error signing out:', error);
    }
  };

  // Helper function to dispatch Escape key for closing the sheet
  const closeSheetOnClick = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'Escape'}));
  };

  const navLinkClass = "w-full justify-start text-base py-2.5 px-4 hover:bg-accent/10 focus:bg-accent/15 rounded-md";
  const userDisplayName = userProfile?.username || userProfile?.email?.split('@')[0] || "User";
  const userAvatarInitial = (userProfile?.username || "L").charAt(0).toUpperCase();
  const userAvatarSrc = userProfile?.customPhotoURL || userProfile?.photoURL || undefined;

  const paypalEmail = 'lekko254@gmail.com';
  const paypalDonationUrl = `https://www.paypal.com/donate/?business=${encodeURIComponent(paypalEmail)}&no_recurring=0&item_name=Support+LukuCheck&currency_code=USD`;

  const isAdminOrManager = userProfile?.role && ['admin', 'manager'].includes(userProfile.role);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <Shirt className="h-7 w-7 text-primary group-hover:animate-pulse" />
          <span className="text-xl font-bold tracking-tight">LukuCheck</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
          {user && user.emailVerified && (
            <>
              <Link href="/upload" legacyBehavior passHref>
                <Button variant="ghost" className="text-sm px-3">
                  <UploadCloud className="mr-1.5 h-4 w-4" /> Submit Look
                </Button>
              </Link>
              <Link href="/leaderboard" legacyBehavior passHref>
                <Button variant="ghost" className="text-sm px-3">
                  <Trophy className="mr-1.5 h-4 w-4" /> Leaderboard
                </Button>
              </Link>
              <Link href="/profile" legacyBehavior passHref>
                <Button variant="ghost" className="text-sm flex items-center px-3">
                  <Avatar className="h-6 w-6 mr-1.5 border-2 border-primary/50">
                    <AvatarImage src={userAvatarSrc} alt={userDisplayName} />
                    <AvatarFallback>{userAvatarInitial}</AvatarFallback>
                  </Avatar>
                  Profile
                </Button>
              </Link>
              {isAdminOrManager && (
                  <Link href="/admin" legacyBehavior passHref>
                    <Button variant="ghost" className="text-sm text-destructive hover:text-destructive hover:bg-destructive/10 px-3">
                        <UserCog className="mr-1.5 h-4 w-4" /> Admin
                    </Button>
                  </Link>
              )}
              <TooltipProvider delayDuration={100}>
                {userProfile && userProfile.lukuPoints !== undefined && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center text-sm font-medium text-primary mr-1.5 ml-0.5 px-2.5 py-1 rounded-md bg-primary/10 cursor-default">
                        <Coins className="h-4 w-4 mr-1 text-yellow-500" />
                        {userProfile.lukuPoints}
                         {userProfile.lukuPoints >= 20 && <LukuBadge lukuPoints={userProfile.lukuPoints} size="sm" className="ml-1.5" />}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Your LukuPoints: {userProfile.lukuPoints}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {typeof userProfile?.currentStreak === 'number' && userProfile.currentStreak > 0 && (
                   <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center text-sm font-medium text-destructive mr-2 px-2.5 py-1 rounded-md bg-destructive/10 cursor-default">
                        <Flame className="h-4 w-4 mr-1" />
                        {userProfile.currentStreak}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Your LukuStreak: {userProfile.currentStreak} days!</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {mounted && (theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />)}
            {!mounted && <Moon className="h-5 w-5" /> }
            <span className="sr-only">Toggle Theme</span>
          </Button>
          {!loading && (
            user ? (
              <Button variant="outline" size="sm" onClick={handleLogout} className="ml-1">
                <LogOut className="mr-1.5 h-4 w-4" /> Logout
              </Button>
            ) : (
              <Link href="/login" passHref legacyBehavior>
                <Button variant="default" size="sm" className="ml-1">
                  <LogIn className="mr-1.5 h-4 w-4" /> Login
                </Button>
              </Link>
            )
          )}
        </nav>

        {/* Mobile Navigation Trigger */}
        <div className="md:hidden flex items-center">
           <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className="mr-1"
          >
            {mounted ? (theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />) : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle Theme</span>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-0 flex flex-col">
              <SheetHeader className="p-4 border-b">
                 <Link href="/" className="flex items-center gap-2 group" onClick={closeSheetOnClick}>
                    <Shirt className="h-7 w-7 text-primary group-hover:animate-pulse" />
                    <SheetTitle className="text-xl font-bold tracking-tight">LukuCheck</SheetTitle>
                </Link>
              </SheetHeader>
              
              <div className="flex-grow overflow-y-auto">
                {user && user.emailVerified && userProfile && (
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-12 w-12 border-2 border-primary/50">
                        <AvatarImage src={userAvatarSrc} alt={userDisplayName} />
                        <AvatarFallback>{userAvatarInitial}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-base truncate max-w-[180px]">{userDisplayName}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">{userProfile.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        {userProfile.lukuPoints !== undefined && (
                            <div className="flex items-center text-sm font-medium text-primary">
                                <Coins className="h-4 w-4 mr-1 text-yellow-500" />
                                {userProfile.lukuPoints} LukuPoints
                                {userProfile.lukuPoints >= 20 && <LukuBadge lukuPoints={userProfile.lukuPoints} size="sm" className="ml-1.5" />}
                            </div>
                        )}
                        {typeof userProfile.currentStreak === 'number' && userProfile.currentStreak > 0 && (
                            <div className="flex items-center text-sm font-medium text-destructive">
                                <Flame className="h-4 w-4 mr-1" />
                                {userProfile.currentStreak}-Day Streak
                            </div>
                        )}
                    </div>
                  </div>
                )}
                
                <nav className="flex flex-col space-y-1 p-4">
                  {user && user.emailVerified && (
                    <>
                      <Link href="/upload" legacyBehavior passHref>
                        <Button variant="ghost" className={navLinkClass} onClick={closeSheetOnClick}>
                          <UploadCloud className="mr-2 h-5 w-5" /> Submit Look
                        </Button>
                      </Link>
                      <Link href="/leaderboard" legacyBehavior passHref>
                        <Button variant="ghost" className={navLinkClass} onClick={closeSheetOnClick}>
                          <Trophy className="mr-2 h-5 w-5" /> Leaderboard
                        </Button>
                      </Link>
                      <Link href="/profile" legacyBehavior passHref>
                        <Button variant="ghost" className={navLinkClass} onClick={closeSheetOnClick}>
                          <UserIcon className="mr-2 h-5 w-5" /> Profile
                        </Button>
                      </Link>
                       {isAdminOrManager && (
                          <Link href="/admin" legacyBehavior passHref>
                              <Button variant="ghost" className={`${navLinkClass} text-destructive hover:text-destructive hover:bg-destructive/10`} onClick={closeSheetOnClick}>
                                  <UserCog className="mr-2 h-5 w-5" /> Admin Panel
                              </Button>
                          </Link>
                      )}
                      <Separator className="my-2" />
                    </>
                  )}
                  
                  <Link href="/submit-ticket" legacyBehavior passHref>
                    <Button variant="ghost" className={navLinkClass} onClick={closeSheetOnClick}>
                      <ListChecks className="mr-2 h-5 w-5 text-primary/80" /> Support / Tickets
                    </Button>
                  </Link>
                  <a
                    href={paypalDonationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeSheetOnClick}
                    className={cn(buttonVariants({ variant: "ghost" }), navLinkClass, "w-full justify-start text-base py-2.5 px-4")}
                  >
                    <Coffee className="mr-2 h-5 w-5 text-destructive/80" /> Donate
                  </a>
                </nav>
              </div>

              <div className="p-4 border-t mt-auto">
                {!loading && (
                  user ? (
                    <Button variant="destructive" className="w-full justify-start text-base py-2.5 px-4" onClick={() => { handleLogout(); closeSheetOnClick(); }}>
                      <LogOut className="mr-2 h-5 w-5" /> Logout
                    </Button>
                  ) : (
                    <Link href="/login" passHref legacyBehavior>
                      <Button variant="default" className="w-full justify-start text-base py-2.5 px-4" onClick={closeSheetOnClick}>
                        <LogIn className="mr-2 h-5 w-5" /> Login
                      </Button>
                    </Link>
                  )
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
