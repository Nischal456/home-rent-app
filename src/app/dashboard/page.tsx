'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { IUser } from '@/models/User';
import { AdminDashboard } from './admin-dashboard';
import { TenantDashboard } from './tenant-dashboard';

export default function DashboardPage() {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!user) {
    return <div>Could not load user data. Please try logging in again.</div>;
  }

  // Render the correct dashboard based on the user's role
  return user.role === 'ADMIN' ? <AdminDashboard /> : <TenantDashboard />;
}
