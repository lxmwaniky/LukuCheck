
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ShieldAlert, Loader2, Users } from 'lucide-react';
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
      } else if (user && (!userProfile?.role || !['admin', 'manager'].includes(userProfile.role))) {
        // Stay on this page to show "Access Denied" if not admin or manager
        // The AdminUsersPage component itself will handle finer-grained permissions (e.g., read-only for managers)
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
  
  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
            <Users className="h-7 w-7" /> LukuCheck User Management
          </CardTitle>
          <CardDescription>
            Welcome, {userProfile.username || 'Admin User'}. Your role: {userProfile.role}.
            {userProfile.role === 'manager' && " You have read-only access to user data."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <AdminUsersPage />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
