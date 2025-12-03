'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { IUser } from '@/types';

// --- Import the specific Dashboards ---
import { AdminDashboard } from './admin-dashboard';
import { TenantDashboard } from './tenant-dashboard';
import SecurityDashboard from './security/page'; // Importing the Security Dashboard component

export default function DashboardPage() {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        
        if (data.success) {
          setUser(data.user);
        } else {
          // If auth fails, redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to fetch user', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ✅ LOGIC UPDATE: Route to the correct dashboard based on Role
  
  if (user.role === 'ADMIN') {
    return <AdminDashboard />;
  } 
  
  if (user.role === 'SECURITY') {
    return <SecurityDashboard />;
  }

  // Default to Tenant Dashboard for 'TENANT' role
  return <TenantDashboard />;
}