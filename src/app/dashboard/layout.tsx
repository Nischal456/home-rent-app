'use client';

// --- Core React & Next.js Imports ---
import React, { useEffect, useState, useCallback, forwardRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// --- UI Components from shadcn/ui ---
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import { Toaster, toast } from 'react-hot-toast';
import { Separator } from '@/components/ui/separator';

// --- Icons from lucide-react ---
import {
  Bell, Home, LogOut, ReceiptText, Settings, Users, Loader2, Building, Menu,
  Banknote, LifeBuoy, FileClock, Wrench, ChevronDown, Sparkles, Newspaper,CreditCard, PanelsTopLeft,
  ShieldCheck, Droplets, Wallet, Grid2X2, Zap
} from 'lucide-react';

// --- Animation & Utilities ---
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { IUser } from '@/types';
import { cn } from '@/lib/utils';

// --- Type Definitions ---
type ClientNotification = {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: 'payment' | 'maintenance' | 'general';
};

// Explicitly define the type to fix TypeScript Error 2339
type NavItemType = {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
};

type MobileNavItemType = {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
};

// --- Sub-Component: NavLink with Advanced Active State (Desktop) ---
const NavLink = forwardRef<HTMLAnchorElement, { href: string; onClick?: () => void; children: React.ReactNode }>(({ href, onClick, children }, ref) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <Link href={href} onClick={onClick} ref={ref} className="relative block group transform-gpu">
      <div className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-500 transition-all duration-300 hover:text-[#0B2863] active:scale-[0.98]",
        isActive && "text-[#0B2863] font-bold"
      )}>
        {isActive && (
          <motion.div
            layoutId="desktop-active-indicator"
            className="absolute inset-0 rounded-2xl bg-blue-50/80 border border-blue-100/50 shadow-sm"
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-3 w-full">{children}</span>
      </div>
    </Link>
  );
});
NavLink.displayName = "NavLink";

// --- Sub-Component: Full Navigation Links (Sidebar & Sheet) ---
function NavLinks({ user, onLinkClick, unreadPaymentsCount }: { user: IUser; onLinkClick?: () => void; unreadPaymentsCount: number }) {
  const navItems: NavItemType[] = [
    { href: "/dashboard", icon: <PanelsTopLeft className="h-5 w-5" />, label: "Dashboard" },

    ...(user.role === 'ADMIN' ? [
      { href: "/dashboard/payments", icon: <Banknote className="h-5 w-5" />, label: "Payments", badge: unreadPaymentsCount },
      { href: "/dashboard/tenants", icon: <Users className="h-5 w-5" />, label: "Tenants" },
      { href: "/dashboard/rooms", icon: <Building className="h-5 w-5" />, label: "Rooms" },
      { href: "/dashboard/rent-bills", icon: <ReceiptText className="h-5 w-5" />, label: "Rent Bills" },
      { href: "/dashboard/utility-bills", icon: <Zap className="h-5 w-5" />, label: "Utility Bills" },
      { href: "/dashboard/maintenance", icon: <Wrench className="h-5 w-5" />, label: "Maintenance" },
      { href: "/dashboard/staff", icon: <ShieldCheck className="h-5 w-5" />, label: "Staff Management" },
      { href: "/dashboard/water-tankers", icon: <Droplets className="h-5 w-5" />, label: "Water Logs" },
      { href: "/dashboard/security-management", icon: <Wallet className="h-5 w-5" />, label: "Security Finance" },
    ] : []),

    ...(user.role === 'TENANT' ? [
      { href: "/dashboard/statement", icon: <FileClock className="h-5 w-5" />, label: "My Statement" },
    ] : []),

    ...(user.role === 'SECURITY' ? [
      { href: "/dashboard/security", icon: <ShieldCheck className="h-5 w-5" />, label: "Guard Portal" },
    ] : []),
  ];

  const bottomNavItems: NavItemType[] = [
    { href: "/dashboard/settings", icon: <Settings className="h-5 w-5" />, label: "Settings" },
    { href: "/dashboard/support", icon: <LifeBuoy className="h-5 w-5" />, label: "Support" },
  ];

  return (
    <LayoutGroup id="desktop-nav">
      <nav className="grid items-start gap-2 px-4 text-sm font-medium">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} onClick={onLinkClick}>
            {item.icon}
            {item.label}
            {item.badge && item.badge > 0 && <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-sm border-0">{item.badge}</Badge>}
          </NavLink>
        ))}
        <Separator className="my-4 opacity-50" />
        {bottomNavItems.map((item) => (
          <NavLink key={item.href} href={item.href} onClick={onLinkClick}>
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </LayoutGroup>
  );
}

// --- Sub-Component: Native Mobile Bottom Navbar ---
function MobileBottomNav({ user, unreadPaymentsCount, onMenuClick }: { user: IUser; unreadPaymentsCount: number; onMenuClick: () => void }) {
  const pathname = usePathname();

  // Dynamically build bottom nav based on role for a native app feel
  const mobileItems: MobileNavItemType[] = [
    { href: "/dashboard", icon: Home, label: "Home" },
    ...(user.role === 'ADMIN' ? [
      { href: "/dashboard/tenants", icon: Users, label: "Tenants" },
      { href: "/dashboard/rent-bills", icon: ReceiptText, label: "Rent" },
      { href: "/dashboard/utility-bills", icon: Zap, label: "Utility" },
    ] : []),
    ...(user.role === 'TENANT' ? [
      { href: "/dashboard/statement", icon: FileClock, label: "Statement" },
    ] : []),
    ...(user.role === 'SECURITY' ? [
      { href: "/dashboard/security", icon: ShieldCheck, label: "Portal" },
    ] : []),
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[calc(84px+env(safe-area-inset-bottom,20px))] bg-white/95 backdrop-blur-2xl border-t border-slate-100/80 z-40 pb-[env(safe-area-inset-bottom,20px)] flex items-center justify-around px-1 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
      <LayoutGroup id="mobile-nav">
        {mobileItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="relative flex flex-col items-center justify-center w-full h-full space-y-1 transform-gpu active:scale-95 transition-transform">
              <div className="relative z-10 p-1.5 hover:bg-slate-50 rounded-full">
                <Icon className={cn("h-6 w-6 transition-all duration-300", isActive ? "text-[#0B2863] scale-110" : "text-slate-400")} />
                {item.badge && item.badge > 0 && (
                  <Badge className="absolute -top-1 -right-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[9px] text-white border-2 border-white">{item.badge}</Badge>
                )}
              </div>
              <span className={cn("text-[10px] font-bold z-10 transition-colors duration-300", isActive ? "text-[#0B2863]" : "text-slate-400")}>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="mobile-active-indicator"
                  className="absolute top-2 bottom-4 w-14 bg-blue-50/80 rounded-2xl -z-0 border border-blue-100/50"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
        {/* The Menu Button triggers the Sheet */}
        <button onClick={onMenuClick} className="relative flex flex-col items-center justify-center w-full h-full space-y-1 transform-gpu active:scale-95 transition-transform">
          <div className="relative z-10 p-1.5">
            <Grid2X2 className="h-6 w-6 text-slate-400" />
            {/* Show a dot if payments are unread and it's not in the bottom bar */}
            {user.role === 'ADMIN' && unreadPaymentsCount > 0 && (
                 <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-white"></span>
                 </span>
            )}
          </div>
          <span className="text-[10px] font-bold z-10 text-slate-400">More</span>
        </button>
      </LayoutGroup>
    </div>
  );
}

// --- Sub-Component: Notification Bell ---
function NotificationBell({ notifications, onMarkAllRead }: { notifications: ClientNotification[]; onMarkAllRead: () => void; }) {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: ClientNotification['type']) => {
    switch (type) {
      case 'payment': return <div className="p-2 bg-green-50 rounded-xl text-green-600"><CreditCard className="h-4 w-4" /></div>;
      case 'maintenance': return <div className="p-2 bg-orange-50 rounded-xl text-orange-600"><Wrench className="h-4 w-4" /></div>;
      default: return <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><Bell className="h-4 w-4" /></div>;
    }
  };

  const groupedNotifications = useMemo(() => {
    return notifications.reduce<Record<string, ClientNotification[]>>((acc, notif) => {
      const date = new Date(notif.createdAt);
      let groupKey = 'Older';
      if (isToday(date)) groupKey = 'Today';
      else if (isYesterday(date)) groupKey = 'Yesterday';

      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(notif);
      return acc;
    }, {});
  }, [notifications]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 relative rounded-full hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[85vw] md:w-96 rounded-3xl p-2 shadow-xl border-slate-100 z-50 mr-4 md:mr-0">
        <DropdownMenuLabel className="flex justify-between items-center px-4 py-3">
          <span className="font-extrabold text-lg text-slate-900">Notifications</span>
          {unreadCount > 0 &&
            <Button variant="ghost" size="sm" className="h-auto p-1 px-3 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full font-bold" onClick={() => onMarkAllRead()}>
              Mark all read
            </Button>
          }
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="opacity-50" />
        <div className="max-h-[60vh] overflow-y-auto pr-1 styled-scrollbar">
          {notifications.length > 0 ? (
            Object.entries(groupedNotifications).map(([group, notifs]) => (
              <div key={group} className="mb-2">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-4 py-2">{group}</p>
                {notifs.map(n => (
                  <DropdownMenuItem key={n._id} className={cn("flex items-start gap-4 rounded-2xl p-3 mx-2 transition-colors cursor-pointer", !n.isRead ? "bg-blue-50/50 hover:bg-blue-50" : "hover:bg-slate-50")}>
                    {getNotificationIcon(n.type)}
                    <div className="flex-1 space-y-1">
                      <p className={cn("text-sm", !n.isRead ? "font-bold text-slate-900" : "font-medium text-slate-700")}>{n.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] font-bold text-slate-400">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            ))
          ) : (
            <div className="text-center py-10 px-4">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Newspaper className="h-8 w-8 text-slate-300" />
              </div>
              <p className="font-bold text-slate-900">All caught up!</p>
              <p className="text-sm text-slate-500 mt-1">You have no new notifications.</p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// --- Sub-Component: User Dropdown ---
function UserNav({ user, onLogout }: { user: IUser; onLogout: () => void; }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 px-2 space-x-3 rounded-full hover:bg-slate-100 transition-colors transform-gpu active:scale-95 group border border-transparent hover:border-slate-200">
          <Avatar className="h-8 w-8 border border-slate-200 shadow-sm">
            <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${user.fullName}`} alt={user.fullName} />
            <AvatarFallback className="bg-[#0B2863] text-white font-bold">{user.fullName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="hidden lg:flex lg:flex-col lg:items-start">
            <span className="text-sm font-bold text-slate-900">{user.fullName}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user.role}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:text-slate-600 group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-3xl p-2 shadow-xl border-slate-100 z-50">
        <DropdownMenuLabel className="font-normal p-3">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border shadow-sm">
              <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${user.fullName}`} alt={user.fullName} />
              <AvatarFallback className="bg-[#0B2863] text-white font-bold text-lg">{user.fullName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="text-sm font-extrabold text-slate-900">{user.fullName}</p>
              <p className="text-xs font-medium text-slate-500 truncate max-w-[140px]">{user.email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="opacity-50" />
        <DropdownMenuItem asChild className="rounded-xl cursor-pointer p-3 focus:bg-slate-50">
           <Link href="/dashboard/settings"><Settings className="mr-3 h-4 w-4 text-slate-500" /><span className="font-semibold text-slate-700">Settings</span></Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-xl cursor-pointer p-3 focus:bg-slate-50">
           <Link href="/dashboard/support"><LifeBuoy className="mr-3 h-4 w-4 text-slate-500" /><span className="font-semibold text-slate-700">Support</span></Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="opacity-50" />
        <DropdownMenuItem onClick={onLogout} className="rounded-xl cursor-pointer p-3 text-red-600 focus:bg-red-50 focus:text-red-700">
           <LogOut className="mr-3 h-4 w-4" /><span className="font-bold">Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// --- Main Dashboard Layout Component ---
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

  const fetchAdminData = useCallback(async () => {
    try {
      const res = await fetch('/api/payments');
      const data = await res.json();
      if (data.success) setPendingPaymentsCount(data.data.length);
    } catch (error) { console.error("Failed to fetch admin data:", error); }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) setNotifications(data.data);
    } catch (error) { console.error("Failed to fetch notifications:", error); }
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
          if (userData.user.role === 'ADMIN') await fetchAdminData();
        } else router.push('/login');
      } catch (error) {
        router.push('/login');
      } finally { setIsLoading(false); }
    };
    fetchInitialData();
  }, [router, fetchNotifications, fetchAdminData]);

  const handleLogout = async () => {
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
    toast.success("Logged out successfully!");
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id);
    if (unreadIds.length === 0) return;
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ ids: unreadIds }),
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) { toast.error("Could not sync notifications."); }
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-20 h-20 animate-pulse drop-shadow-lg">
             <Image src="/home.png" alt="Logo" fill className="object-contain" priority />
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-[#0B2863]" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[100dvh] w-full md:grid-cols-[280px_1fr] bg-[#f8fafc] font-sans selection:bg-[#0B2863] selection:text-white overflow-hidden">
      
      {/* --- Desktop Premium Sidebar (Hidden on Mobile) --- */}
      <aside className="hidden md:flex flex-col bg-white border-r border-slate-100 h-[100dvh] sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
        <div className="flex h-20 items-center px-8 border-b border-slate-50">
          <Link href="/dashboard" className="flex items-center gap-4 group transform-gpu">
            <div className="h-8 w-8 relative transition-transform duration-300 group-hover:scale-110 drop-shadow-sm">
              <Image src="/home.png" alt="Logo" fill className="object-contain" priority />
            </div>
            <span className="text-xl font-extrabold text-[#0B2863] tracking-tight">STG TOWER</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-6 styled-scrollbar">
          <NavLinks user={user} unreadPaymentsCount={pendingPaymentsCount} />
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <div className="flex flex-col h-[100dvh] relative overflow-hidden">
        
        {/* --- Premium Header --- */}
        <header className="flex h-[calc(4rem+env(safe-area-inset-top))] md:h-[calc(5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] items-center justify-between gap-4 bg-white/80 px-4 md:px-8 backdrop-blur-xl z-30 sticky top-0 border-b border-slate-100/50">
          
          {/* Mobile Logo View (Replaces Hamburger) */}
          <div className="flex md:hidden items-center gap-3">
            <div className="h-8 w-8 relative">
              <Image src="/home.png" alt="Logo" fill className="object-contain" priority />
            </div>
            <span className="text-lg font-extrabold text-[#0B2863] tracking-tight">STG TOWER</span>
          </div>

          <div className="hidden md:block flex-1" />

          {/* Right side actions */}
          <div className="flex items-center gap-2 md:gap-4 bg-white/50 md:px-2 py-1.5 rounded-full border border-transparent md:border-slate-100 md:shadow-sm">
            <NotificationBell notifications={notifications} onMarkAllRead={handleMarkAllAsRead} />
            <div className="hidden md:block w-[1px] h-6 bg-slate-200 mx-1"></div>
            <UserNav user={user} onLogout={handleLogout} />
          </div>
        </header>

        {/* --- Page Content Container --- */}
        {/* pb-28 ensures content doesn't get hidden behind the mobile bottom nav */}
        <main className="flex-1 w-full relative z-10 overflow-y-auto pb-28 md:pb-6 p-4 md:p-6 styled-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[1600px] mx-auto h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        
        {/* --- Native App Style Mobile Bottom Nav --- */}
        <MobileBottomNav user={user} unreadPaymentsCount={pendingPaymentsCount} onMenuClick={() => setSheetOpen(true)} />

        {/* --- Sheet Triggered by Bottom Nav "More" Button --- */}
        <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="left" className="flex flex-col p-0 w-[300px] border-r-0 rounded-r-[2rem] shadow-2xl bg-white z-50">
            <SheetHeader className="p-6 pb-4 border-b border-slate-50">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SheetDescription className="sr-only">Mobile navigation menu</SheetDescription>
              <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setSheetOpen(false)}>
                <div className="h-8 w-8 relative">
                  <Image src="/home.png" alt="Logo" fill className="object-contain" priority />
                </div>
                <span className="text-xl font-extrabold text-[#0B2863]">STG TOWER</span>
              </Link>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto py-4 styled-scrollbar">
              <NavLinks user={user} onLinkClick={() => setSheetOpen(false)} unreadPaymentsCount={pendingPaymentsCount} />
            </div>
          </SheetContent>
        </Sheet>

        {/* --- Toaster Configuration --- */}
        <Toaster 
          position="top-center" 
          containerStyle={{
            top: 'calc(env(safe-area-inset-top, 20px) + 16px)'
          }}
          toastOptions={{
             className: 'rounded-2xl font-bold shadow-xl border border-slate-100 z-[100]',
             style: { background: '#fff', color: '#0f172a' }
          }} 
        />
      </div>
    </div>
  );
}