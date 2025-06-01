
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ShieldAlert, Loader2, Users, BarChart3, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminUsersPage from './users/page'; 

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
      } else if (user && !userProfile?.isAdmin) {
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

  if (!userProfile?.isAdmin) {
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

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">LukuCheck Admin Dashboard</CardTitle>
          <CardDescription>Welcome, {userProfile.username || 'Admin'}. Manage your application here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-1 gap-1 sm:grid-cols-3 mb-6">
              <TabsTrigger value="users" className="flex items-center justify-center gap-2 text-xs sm:text-sm py-2.5">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" /> Users
              </TabsTrigger>
              <TabsTrigger value="leaderboards" className="flex items-center justify-center gap-2 text-xs sm:text-sm py-2.5">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" /> Leaderboards
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center justify-center gap-2 text-xs sm:text-sm py-2.5">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" /> Settings
              </TabsTrigger>
            </TabsList>
            <TabsContent value="users">
              <AdminUsersPage />
            </TabsContent>
            <TabsContent value="leaderboards">
              <Card>
                <CardHeader>
                  <CardTitle>Leaderboard Management</CardTitle>
                  <CardDescription>View and moderate leaderboard entries.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Leaderboard management features will be available here soon. This section is a placeholder.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Application Settings</CardTitle>
                  <CardDescription>Configure application-wide settings.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Application settings will be available here soon. This section is a placeholder.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

