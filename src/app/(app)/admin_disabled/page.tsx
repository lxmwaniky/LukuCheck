
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
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 group">
    <div className="p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-4">{description}</p>
      <Link href={href} passHref legacyBehavior>
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white group-hover:scale-[1.02] transition-all duration-200" 
          disabled={disabled}
        >
          Go to {title} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  </div>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userProfile?.role || !['admin', 'manager'].includes(userProfile.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 w-full max-w-md text-center">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-full inline-block mb-4">
              <ShieldAlert className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
            <p className="text-gray-600 dark:text-gray-300">
              You do not have permission to view this page.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Welcome, {userProfile.username || 'Admin User'}. Your role: <span className="font-semibold text-blue-600">{userProfile.role}</span>
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
          <DashboardItem
            title="Global Settings"
            description="Configure application-wide settings (Admin only)."
            href="#"
            icon={Settings}
            disabled={userProfile.role !== 'admin'}
          />
        </div>
      </div>
    </div>
  );
}
