
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ShieldAlert, Loader2, Users, BarChart3, Settings, CalendarDays } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminUsersPage from './users/page'; 
import { getLeaderboardData, type LeaderboardEntry as ServerLeaderboardEntry } from '@/actions/outfitActions';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Star, Trophy, Flame } from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { LukuBadge } from '@/components/LukuBadge';

type LeaderboardEntry = ServerLeaderboardEntry;

function AdminLeaderboardView() {
  const [leaderboardDate, setLeaderboardDate] = useState<Date>(subDays(new Date(),1));
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchLeaderboard = async (date: Date) => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    const dateString = format(date, 'yyyy-MM-dd');
    const result = await getLeaderboardData({ leaderboardDate: dateString });
    if (result.error) {
      setError(result.error);
      setEntries([]);
    } else {
      setEntries(result.entries);
      setMessage(result.message || (result.entries.length === 0 ? `No entries for ${format(date, 'PPP')}.` : null));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard(leaderboardDate);
  }, [leaderboardDate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard Management</CardTitle>
        <CardDescription>View daily leaderboard entries. Moderation tools coming soon.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !leaderboardDate && "text-muted-foreground"
                )}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {leaderboardDate ? format(leaderboardDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={leaderboardDate}
                onSelect={(day) => day && setLeaderboardDate(day)}
                initialFocus
                disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={() => fetchLeaderboard(leaderboardDate)} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading leaderboard...</p>
          </div>
        )}
        {error && <p className="text-destructive">Error: {error}</p>}
        {message && !error && <p className="text-muted-foreground">{message}</p>}

        {!isLoading && !error && entries.length > 0 && (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">Rank</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-center">Streak</TableHead>
                  <TableHead className="text-center">Outfit</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, index) => (
                  <TableRow key={entry.id} className={index < 3 ? 'bg-accent/10' : ''}>
                    <TableCell className="font-bold text-lg text-center">
                      {index === 0 && <Trophy className="h-5 w-5 inline-block text-yellow-400" />}
                      {index === 1 && <Trophy className="h-5 w-5 inline-block text-slate-400" />}
                      {index === 2 && <Trophy className="h-5 w-5 inline-block text-yellow-600" />}
                      {index > 2 && `#${index + 1}`}
                       {index < 3 && <span className="sr-only">#{index + 1}</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={entry.userPhotoURL || undefined} alt={entry.username || 'User'} />
                          <AvatarFallback>{(entry.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium truncate max-w-[150px]">{entry.username || 'Anonymous'}</span>
                        <LukuBadge lukuPoints={entry.lukuPoints} />
                      </div>
                    </TableCell>
                     <TableCell className="text-center">
                      {entry.currentStreak > 0 && <Flame className="h-4 w-4 inline text-destructive mr-1" />}
                      {entry.currentStreak}
                    </TableCell>
                    <TableCell className="text-center">
                       <Image src={entry.outfitImageURL} alt="Outfit" width={40} height={40} className="rounded-md object-cover mx-auto aspect-square" data-ai-hint="fashion clothing thumbnail"/>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-lg">{entry.rating.toFixed(1)}</span>
                      <Star className="h-4 w-4 inline text-accent fill-accent ml-1"/>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


export default function AdminDashboardPage() {
  const { userProfile, loading, user } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !loading) {
      if (!user) {
        router.replace('/login?redirect=/admin');
      } else if (user && (!userProfile?.role || !['admin', 'manager'].includes(userProfile.role))) {
        // Stay on this page to show "Access Denied"
      }
    }
  }, [user, userProfile, loading, router, isClient]);

  if (!isClient || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Admin Dashboard...</p>
      </div>
    );
  }

  if (!userProfile?.role || !['admin', 'manager'].includes(userProfile.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="items-center text-center">
            <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
            <CardTitle className="text-2xl sm:text-3xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You do not have permission to view this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const isAdmin = userProfile.role === 'admin';

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">LukuCheck Admin Dashboard</CardTitle>
          <CardDescription>Welcome, {userProfile.username || 'Admin User'}. Your role: {userProfile.role}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-1 gap-1 sm:flex sm:flex-row mb-6">
              <TabsTrigger value="users" className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs sm:text-sm py-2.5">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" /> Users
              </TabsTrigger>
              <TabsTrigger value="leaderboards" className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs sm:text-sm py-2.5">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" /> Leaderboards
              </TabsTrigger>
              <TabsTrigger value="settings" disabled={!isAdmin} className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs sm:text-sm py-2.5">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" /> Settings
              </TabsTrigger>
            </TabsList>
            <TabsContent value="users">
             <Suspense fallback={<div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                <AdminUsersPage />
              </Suspense>
            </TabsContent>
            <TabsContent value="leaderboards">
              <Suspense fallback={<div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                <AdminLeaderboardView />
              </Suspense>
            </TabsContent>
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Application Settings</CardTitle>
                  <CardDescription>Configure application-wide settings. Only available to Admins.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Global application settings, such as AI model selection, point values for actions, or feature toggles, will be configurable here in a future update.</p>
                  <p className="mt-2 text-sm text-muted-foreground">For now, this section is a placeholder. Specific settings require careful planning and implementation.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
