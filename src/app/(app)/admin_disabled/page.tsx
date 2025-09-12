
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Loader2, Users, ListChecks, Settings, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DashboardItemProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
}

const DashboardItem: React.FC<DashboardItemProps> = ({ title, description, href, icon: Icon, disabled }) => (
  <Card className="hover:shadow-lg transition-shadow duration-200">
    <CardHeader>
      <CardTitle className="text-xl flex items-center gap-2">
        <Icon className="h-6 w-6 text-primary" />
        {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <Link href={href} passHref legacyBehavior>
        <Button className="w-full" disabled={disabled}>
          Go to {title} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </CardContent>
  </Card>
);

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
        router.replace('/auth?redirect=/admin');
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
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome, {userProfile.username || 'Admin User'}. Your role: {userProfile.role}.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardItem
          title="User Management"
          description="View, edit, and manage user accounts and roles."
          href="/admin/users"
          icon={Users}
        />
        <DashboardItem
          title="Ticket System"
          description="View and manage user-submitted support tickets."
          href="/admin/tickets"
          icon={ListChecks}
        />
        {/* Placeholder for future settings panel, only for 'admin' role */}
        <DashboardItem
          title="Global Settings"
          description="Configure application-wide settings (Admin only)."
          href="#" // Or a dedicated /admin/settings page
          icon={Settings}
          disabled={userProfile.role !== 'admin'}
        />
      </div>
    </div>
  );
}
