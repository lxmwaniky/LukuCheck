
'use client';
import Link from 'next/link';
import { Shirt, Trophy, User as UserIcon, LogIn, LogOut, Sun, Moon, Menu, UploadCloud, Coins, Coffee, Flame, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/config/firebase';
import { signOut } from 'firebase/auth';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useEffect, useState } from 'react';
import { LukuBadge } from '@/components/LukuBadge';

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
      console.error('Error signing out:', error);
    }
  };

  const navLinkClass = "w-full justify-start text-base py-3";
  const userDisplayName = userProfile?.username || userProfile?.email?.split('@')[0] || "User";
  const userAvatarInitial = (userProfile?.username || "L").charAt(0).toUpperCase();
  const userAvatarSrc = userProfile?.customPhotoURL || userProfile?.photoURL || undefined;

  const paypalEmail = 'lekko254@gmail.com';
  const paypalDonationUrl = `https://www.paypal.com/donate/?business=${encodeURIComponent(paypalEmail)}&no_recurring=0&item_name=Support+LukuCheck&currency_code=USD`;


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Shirt className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold">LukuCheck</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {user && user.emailVerified && (
            <>
              <Link href="/upload" legacyBehavior passHref>
                <Button variant="ghost" className="text-sm">
                  <UploadCloud className="mr-2 h-4 w-4" /> Upload
                </Button>
              </Link>
              <Link href="/leaderboard" legacyBehavior passHref>
                <Button variant="ghost" className="text-sm">
                  <Trophy className="mr-2 h-4 w-4" /> Leaderboard
                </Button>
              </Link>
              <Link href="/profile" legacyBehavior passHref>
                <Button variant="ghost" className="text-sm flex items-center">
                  <Avatar className="h-6 w-6 mr-2 border">
                    <AvatarImage src={userAvatarSrc} alt={userDisplayName} />
                    <AvatarFallback>{userAvatarInitial}</AvatarFallback>
                  </Avatar>
                  Profile
                </Button>
              </Link>
              {/* {userProfile?.isAdmin && (
                <Link href="/admin" legacyBehavior passHref>
                  <Button variant="ghost" className="text-sm text-destructive hover:text-destructive hover:bg-destructive/10">
                    <ShieldCheck className="mr-2 h-4 w-4" /> Admin
                  </Button>
                </Link>
              )} */}
              {userProfile && userProfile.lukuPoints !== undefined && userProfile.lukuPoints >= 20 && (
                <LukuBadge lukuPoints={userProfile.lukuPoints} size="sm" className="mr-1" />
              )}
              {typeof userProfile?.lukuPoints === 'number' && (
                <div className="flex items-center text-sm font-medium text-primary mr-1 ml-0 px-2 py-1 rounded-md bg-primary/10">
                  <Coins className="h-4 w-4 mr-1 text-yellow-500" />
                  {userProfile.lukuPoints}
                </div>
              )}
              {typeof userProfile?.currentStreak === 'number' && userProfile.currentStreak > 0 && (
                <div className="flex items-center text-sm font-medium text-destructive mr-2 px-2 py-1 rounded-md bg-destructive/10">
                  <Flame className="h-4 w-4 mr-1" />
                  {userProfile.currentStreak}
                </div>
              )}
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
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            ) : (
              <Link href="/login" passHref legacyBehavior>
                <Button variant="default" size="sm">
                  <LogIn className="mr-2 h-4 w-4" /> Login
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
            <SheetContent side="right" className="w-[250px] sm:w-[300px] p-4">
              <SheetHeader>
                <VisuallyHidden asChild>
                  <SheetTitle>Mobile Navigation Menu</SheetTitle>
                </VisuallyHidden>
              </SheetHeader>
              <nav className="flex flex-col space-y-3 mt-6">
                {user && user.emailVerified && (
                  <>
                   <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2">
                      {userProfile && userProfile.lukuPoints !== undefined && userProfile.lukuPoints >= 20 &&(
                         <LukuBadge lukuPoints={userProfile.lukuPoints} size="sm" className="mr-1" />
                      )}
                      {typeof userProfile?.lukuPoints === 'number' && (
                        <div className="flex items-center text-base font-medium text-primary px-2 py-1.5 rounded-md bg-primary/10">
                          <Coins className="h-5 w-5 mr-2 text-yellow-500" />
                          {userProfile.lukuPoints}
                        </div>
                      )}
                      {typeof userProfile?.currentStreak === 'number' && userProfile.currentStreak > 0 && (
                        <div className="flex items-center text-base font-medium text-destructive px-2 py-1.5 rounded-md bg-destructive/10">
                          <Flame className="h-5 w-5 mr-1" />
                          {userProfile.currentStreak}
                        </div>
                      )}
                    </div>
                    <SheetClose asChild>
                      <Link href="/upload" legacyBehavior passHref>
                        <Button variant="ghost" className={navLinkClass}>
                          <UploadCloud className="mr-2 h-5 w-5" /> Upload
                        </Button>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/leaderboard" legacyBehavior passHref>
                        <Button variant="ghost" className={navLinkClass}>
                          <Trophy className="mr-2 h-5 w-5" /> Leaderboard
                        </Button>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/profile" legacyBehavior passHref>
                        <Button variant="ghost" className={navLinkClass}>
                           <Avatar className="h-6 w-6 mr-2 border">
                            <AvatarImage src={userAvatarSrc} alt={userDisplayName} />
                            <AvatarFallback>{userAvatarInitial}</AvatarFallback>
                          </Avatar>
                          Profile
                        </Button>
                      </Link>
                    </SheetClose>
                    {/* {userProfile?.isAdmin && (
                        <SheetClose asChild>
                            <Link href="/admin" legacyBehavior passHref>
                                <Button variant="ghost" className={`${navLinkClass} text-destructive hover:text-destructive hover:bg-destructive/10`}>
                                    <ShieldCheck className="mr-2 h-5 w-5" /> Admin
                                </Button>
                            </Link>
                        </SheetClose>
                    )} */}
                  </>
                )}
                <div className="border-t pt-3 space-y-3">
                  <SheetClose asChild>
                    <a href={paypalDonationUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button variant="outline" className={navLinkClass}>
                        <Coffee className="mr-2 h-5 w-5 text-destructive" /> Donate
                      </Button>
                    </a>
                  </SheetClose>

                  {!loading && (
                    user ? (
                       <SheetClose asChild>
                        <Button variant="outline" className={navLinkClass} onClick={handleLogout}>
                          <LogOut className="mr-2 h-5 w-5" /> Logout
                        </Button>
                      </SheetClose>
                    ) : (
                      <SheetClose asChild>
                        <Link href="/login" passHref legacyBehavior>
                          <Button variant="default" className={navLinkClass}>
                            <LogIn className="mr-2 h-5 w-5" /> Login
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
