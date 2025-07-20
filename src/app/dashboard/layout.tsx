'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, Home, LogOut, ReceiptText, Settings, Users, Loader2, CheckCheck, Building, Menu, Banknote, LifeBuoy, FileClock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Toaster } from 'react-hot-toast';
import { IUser } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

type ClientNotification = {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

function NavLink({ href, onLinkClick, children, pathname }: { href: string, onLinkClick?: () => void, children: React.ReactNode, pathname: string }) {
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      onClick={onLinkClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive ? 'bg-muted text-primary' : 'text-muted-foreground hover:text-primary'}`}
    >
      {children}
    </Link>
  );
}

function NavLinks({ user, onLinkClick, unreadPaymentsCount }: { user: IUser | null, onLinkClick?: () => void, unreadPaymentsCount: number }) {
  const pathname = usePathname();
  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      <NavLink href="/dashboard" onLinkClick={onLinkClick} pathname={pathname}><Home className="h-4 w-4" />Dashboard</NavLink>
      
      {user?.role === 'ADMIN' && (
        <>
          <NavLink href="/dashboard/payments" onLinkClick={onLinkClick} pathname={pathname}>
            <Banknote className="h-4 w-4" />Payments
            {unreadPaymentsCount > 0 && <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">{unreadPaymentsCount}</Badge>}
          </NavLink>
          <NavLink href="/dashboard/tenants" onLinkClick={onLinkClick} pathname={pathname}><Users className="h-4 w-4" />Tenants</NavLink>
          <NavLink href="/dashboard/rooms" onLinkClick={onLinkClick} pathname={pathname}><Building className="h-4 w-4" />Rooms</NavLink>
          <NavLink href="/dashboard/rent-bills" onLinkClick={onLinkClick} pathname={pathname}><ReceiptText className="h-4 w-4" />Rent Bills</NavLink>
          <NavLink href="/dashboard/utility-bills" onLinkClick={onLinkClick} pathname={pathname}><ReceiptText className="h-4 w-4" />Utility Bills</NavLink>
        </>
      )}
      
      {user?.role === 'TENANT' && (
          <>
            <NavLink href="/dashboard/statement" onLinkClick={onLinkClick} pathname={pathname}><FileClock className="h-4 w-4" />My Statement</NavLink>
          </>
      )}

      <DropdownMenuSeparator className="my-2" />
      <NavLink href="/dashboard/settings" onLinkClick={onLinkClick} pathname={pathname}><Settings className="h-4 w-4" />Settings</NavLink>
      <NavLink href="/dashboard/support" onLinkClick={onLinkClick} pathname={pathname}><LifeBuoy className="h-4 w-4" />Support</NavLink>
    </nav>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

  const fetchAdminData = useCallback(async () => {
    const res = await fetch('/api/payments');
    const data = await res.json();
    if (data.success) {
      setPendingPaymentsCount(data.data.length);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    const res = await fetch('/api/notifications');
    const data = await res.json();
    if (data.success) setNotifications(data.data);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (userData.success) {
          setUser(userData.user);
          await fetchNotifications();
          if (userData.user.role === 'ADMIN') {
            await fetchAdminData();
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to fetch initial data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [router, fetchNotifications, fetchAdminData]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const handleLogout = async () => {
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  };
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    await fetch('/api/notifications', { method: 'PATCH' });
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-white md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              {/* ✅ FIX: Added h-auto to maintain aspect ratio */}
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="h-auto object-contain" />
              <span>STG Tower</span>
            </Link>
          </div>
          <div className="flex-1"><NavLinks user={user} unreadPaymentsCount={pendingPaymentsCount} /></div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-white px-4 lg:h-[60px] lg:px-6">
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild><Button variant="outline" size="icon" className="shrink-0 md:hidden"><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <div className="flex h-14 items-center border-b px-4">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                  {/* ✅ FIX: Added h-auto to maintain aspect ratio */}
                  <Image src="/logo.png" alt="Logo" width={32} height={32} className="h-auto object-contain" />
                  <span>STG Tower</span>
                </Link>
              </div>
              <NavLinks user={user} onLinkClick={() => setSheetOpen(false)} unreadPaymentsCount={pendingPaymentsCount} />
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1"></div>
          <DropdownMenu onOpenChange={(open) => { if(open) fetchNotifications() }}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 relative">
                {unreadCount > 0 && (<span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">{unreadCount}</span>)}
                <Bell className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex justify-between items-center">
                <span>Notifications</span>
                {unreadCount > 0 && <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}><CheckCheck className="mr-2 h-4 w-4" />Mark all as read</Button>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? (
                notifications.map(n => (
                  <DropdownMenuItem key={n._id} className={`flex flex-col items-start gap-1 whitespace-normal ${!n.isRead ? 'bg-blue-50' : ''}`}>
                    <p className="font-semibold">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem>No new notifications</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar><AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${user?.fullName}`} /><AvatarFallback>{user?.fullName?.charAt(0) || 'U'}</AvatarFallback></Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.fullName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href="/dashboard/settings">Settings</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/dashboard/support">Support</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /><span>Logout</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-gray-50/40">{children}</main>
        <Toaster />
      </div>
    </div>
  );
}