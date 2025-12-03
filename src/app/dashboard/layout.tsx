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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import { Toaster, toast } from 'react-hot-toast';
import { Separator } from '@/components/ui/separator';

// --- Icons from lucide-react ---
// ✅ ADDED: ShieldCheck, Droplets, Wallet for the new menu items
import { 
  Bell, Home, LogOut, ReceiptText, Settings, Users, Loader2, CheckCheck, Building, Menu, 
  Banknote, LifeBuoy, FileClock, Wrench, ChevronDown, Sparkles, CreditCard, PanelsTopLeft,
  ShieldCheck, Droplets, Wallet 
} from 'lucide-react';

// --- Animation & Utilities ---
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
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


// --- Sub-Component: NavLink with Advanced Active State ---
const NavLink = forwardRef<HTMLAnchorElement, { href: string; onClick?: () => void; children: React.ReactNode }>(({ href, onClick, children }, ref) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <Link href={href} onClick={onClick} ref={ref} className="relative block">
      <div className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary",
        isActive && "text-primary bg-primary/5 font-medium"
      )}>
        {isActive && (
          <motion.div
            layoutId="active-nav-indicator"
            className="absolute inset-0 rounded-lg bg-primary/10 border-l-4 border-primary"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-3">{children}</span>
      </div>
    </Link>
  );
});
NavLink.displayName = "NavLink";


// --- Sub-Component: Navigation Links ---
function NavLinks({ user, onLinkClick, unreadPaymentsCount }: { user: IUser; onLinkClick?: () => void; unreadPaymentsCount: number }) {
  const navItems = [
    { href: "/dashboard", icon: <PanelsTopLeft className="h-4 w-4" />, label: "Dashboard" },
    
    // --- ADMIN LINKS ---
    ...(user.role === 'ADMIN' ? [
      { href: "/dashboard/payments", icon: <Banknote className="h-4 w-4" />, label: "Payments", badge: unreadPaymentsCount },
      { href: "/dashboard/tenants", icon: <Users className="h-4 w-4" />, label: "Tenants" },
      { href: "/dashboard/rooms", icon: <Building className="h-4 w-4" />, label: "Rooms" },
      { href: "/dashboard/rent-bills", icon: <ReceiptText className="h-4 w-4" />, label: "Rent Bills" },
      { href: "/dashboard/utility-bills", icon: <ReceiptText className="h-4 w-4" />, label: "Utility Bills" },
      { href: "/dashboard/maintenance", icon: <Wrench className="h-4 w-4" />, label: "Maintenance" },
      
      // ✅ ADDED: New Security & Water Links
      { href: "/dashboard/staff", icon: <ShieldCheck className="h-4 w-4" />, label: "Staff Management" },
      { href: "/dashboard/water-tankers", icon: <Droplets className="h-4 w-4" />, label: "Water Logs" },
      { href: "/dashboard/security-management", icon: <Wallet className="h-4 w-4" />, label: "Security Finance" },
    ] : []),

    // --- TENANT LINKS ---
    ...(user.role === 'TENANT' ? [
      { href: "/dashboard/statement", icon: <FileClock className="h-4 w-4" />, label: "My Statement" },
    ] : []),

    // --- SECURITY GUARD LINKS (Optional, if they log into this dashboard too) ---
    ...(user.role === 'SECURITY' ? [
       { href: "/dashboard/security", icon: <ShieldCheck className="h-4 w-4" />, label: "Guard Portal" },
    ] : []),
  ];
  
  const bottomNavItems = [
      { href: "/dashboard/settings", icon: <Settings className="h-4 w-4" />, label: "Settings" },
      { href: "/dashboard/support", icon: <LifeBuoy className="h-4 w-4" />, label: "Support" },
  ];

  return (
    <LayoutGroup>
      <nav className="grid items-start gap-1 px-2 text-sm font-medium lg:px-4">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} onClick={onLinkClick}>
            {item.icon}
            {item.label}
            {item.badge && item.badge > 0 && <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-white z-20">{item.badge}</Badge>}
          </NavLink>
        ))}
        <Separator className="my-3" />
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


// --- Sub-Component: Notification Bell ---
function NotificationBell({ notifications, onMarkAllRead }: { notifications: ClientNotification[]; onMarkAllRead: () => void; }) {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: ClientNotification['type']) => {
    switch (type) {
      case 'payment': return <CreditCard className="h-5 w-5 text-green-500" />;
      case 'maintenance': return <Wrench className="h-5 w-5 text-orange-500" />;
      default: return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const groupedNotifications = useMemo(() => {
    return notifications.reduce<Record<string, ClientNotification[]>>((acc, notif) => {
      const date = new Date(notif.createdAt);
      let groupKey = 'Older';
      if (isToday(date)) groupKey = 'Today';
      else if (isYesterday(date)) groupKey = 'Yesterday';

      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(notif);
      return acc;
    }, {});
  }, [notifications]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex justify-between items-center px-3 py-2">
          <span className="font-bold text-base">Notifications</span>
          {unreadCount > 0 && 
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => onMarkAllRead()}>
                Mark all as read
            </Button>
          }
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          {notifications.length > 0 ? (
            Object.entries(groupedNotifications).map(([group, notifs]) => (
              <div key={group}>
                <p className="text-xs font-semibold text-muted-foreground uppercase px-3 py-2">{group}</p>
                {notifs.map(n => (
                  <DropdownMenuItem key={n._id} className={cn("flex items-start gap-3 whitespace-normal data-[highlighted]:bg-muted/80 p-3", !n.isRead && "bg-primary/5")}>
                    <div className="mt-1">{getNotificationIcon(n.type)}</div>
                    <div className="flex-1">
                      <p className="font-semibold">{n.title}</p>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8 px-4">
                <Sparkles className="mx-auto h-8 w-8 text-gray-400 mb-2"/>
                <p className="font-medium">All caught up!</p>
                <p className="text-sm">You have no new notifications.</p>
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
        <Button variant="ghost" className="relative h-auto px-2 py-1 space-x-2 rounded-full hover:bg-muted">
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${user.fullName}`} alt={user.fullName}/>
            <AvatarFallback>{user.fullName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="hidden lg:flex lg:flex-col lg:items-start">
            <span className="text-sm font-medium">{user.fullName}</span>
            <span className="text-xs text-muted-foreground">{user.role}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
             <Avatar className="h-10 w-10">
                <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${user.fullName}`} alt={user.fullName}/>
                <AvatarFallback>{user.fullName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.fullName}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/dashboard/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/dashboard/support"><LifeBuoy className="mr-2 h-4 w-4" />Support</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-red-500 focus:bg-red-50 focus:text-red-600"><LogOut className="mr-2 h-4 w-4" />Logout</DropdownMenuItem>
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
      if (data.success) {
        setPendingPaymentsCount(data.data.length);
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
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
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
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
              headers: {'Content-Type': 'application/json'} 
          });
      } catch (error) {
          console.error("Failed to mark notifications as read on server", error);
          toast.error("Could not sync notifications with server.");
      }
  };
  
  if (isLoading || !user) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="flex flex-col items-center gap-4">
                <Image src="/logo.png" alt="Logo" width={64} height={64} className="h-auto object-contain animate-pulse" />
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading Your Dashboard...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr]">
      {/* --- Desktop Sidebar --- */}
      <aside className="hidden border-r bg-muted/30 md:block h-screen sticky top-0 overflow-y-auto">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/dashboard" className="flex items-center gap-3 font-bold text-primary">
              <div className="h-6 w-6 relative  overflow-hidden ">
                 <Image src="/home.png" alt="Logo" fill className="object-cover" />
              </div>
              <span className="text-lg">STG Tower</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
             <NavLinks user={user} unreadPaymentsCount={pendingPaymentsCount} />
          </div>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <div className="flex flex-col min-h-screen">
        {/* --- Header --- */}
        <header className="flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6 sticky top-0 z-30">
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-[280px]">
                <SheetHeader className="p-4 border-b bg-muted/10">
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <SheetDescription className="sr-only">Mobile navigation menu</SheetDescription>
                    <Link href="/dashboard" className="flex items-center gap-3 font-bold text-primary" onClick={() => setSheetOpen(false)}>
                        <div className="h-8 w-8 relative rounded-full overflow-hidden border">
                           <Image src="/logo.png" alt="Logo" fill className="object-cover" />
                        </div>
                        <span>STG Tower</span>
                    </Link>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto py-4">
                  <NavLinks user={user} onLinkClick={() => setSheetOpen(false)} unreadPaymentsCount={pendingPaymentsCount} />
                </div>
            </SheetContent>
          </Sheet>
          
          <div className="w-full flex-1" />
          <div className="flex items-center gap-2">
             <NotificationBell notifications={notifications} onMarkAllRead={handleMarkAllAsRead} />
             <UserNav user={user} onLogout={handleLogout} />
          </div>
        </header>

        {/* --- Page Content --- */}
        <main className="flex-1 p-4 lg:p-6 bg-muted/20 overflow-x-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-[1600px] mx-auto"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </main>
        <Toaster position="bottom-right" />
      </div>
    </div>
  );
}