'use client';

// --- Core React & Next.js Imports ---
import { useEffect, useState, useCallback, ReactNode, useMemo } from 'react';

// --- UI Components from shadcn/ui ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// --- Icons from lucide-react ---
import { DollarSign, Loader2, Wrench, FileText, CreditCard, Hourglass, AlertTriangle, CheckCircle, Bell, Sparkles, Receipt, XCircle, Trash2, X } from 'lucide-react';

// --- Animation with Framer Motion ---
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';

// --- Utilities & Types ---
import NepaliDate from 'nepali-date-converter';
import { toast } from 'react-hot-toast';
import { IRentBill, IUtilityBill, IUser, IMaintenanceRequest, IRoom, IPayment } from '@/types';
import { cn } from '@/lib/utils';
import { RequestMaintenanceForm } from './request-maintenance-form';
import { PaymentDialog } from './payment-dialog';
import { BillDetailsDialog } from './bill-details-dialog';


// --- Type Definitions ---
type CombinedBill = (IRentBill | IUtilityBill) & { type: 'Rent' | 'Utility' };
type Status = 'DUE' | 'PAID' | 'OVERDUE' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
type Notification = { id: string; type: 'bill' | 'maintenance'; title: string; description: string; date: Date; icon: ReactNode; };

// --- Enhanced & Reusable Components ---

const AnimatedNumber = ({ value }: { value: number }) => {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current) => `Rs ${Math.round(current).toLocaleString('en-IN')}`);

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    return <motion.span>{display}</motion.span>;
};

const StatusBadge = ({ status }: { status: Status }) => {
    const statusConfig = {
        PAID: { text: "Paid", icon: <CheckCircle className="h-3.5 w-3.5" />, className: "bg-green-100/80 text-green-900 border-green-300" },
        COMPLETED: { text: "Completed", icon: <CheckCircle className="h-3.5 w-3.5" />, className: "bg-green-100/80 text-green-900 border-green-300" },
        DUE: { text: "Due", icon: <Hourglass className="h-3.5 w-3.5" />, className: "bg-yellow-100/80 text-yellow-900 border-yellow-300" },
        PENDING: { text: "Pending", icon: <Hourglass className="h-3.5 w-3.5 animate-spin-slow" />, className: "bg-blue-100/80 text-blue-900 border-blue-300" },
        OVERDUE: { text: "Overdue", icon: <AlertTriangle className="h-3.5 w-3.5" />, className: "bg-red-100/80 text-red-900 border-red-300 animate-pulse" },
        IN_PROGRESS: { text: "In Progress", icon: <Wrench className="h-3.5 w-3.5 animate-spin-slow" />, className: "bg-purple-100/80 text-purple-900 border-purple-300" },
    };
    const config = statusConfig[status] || { text: status, icon: null, className: "bg-gray-100/80 text-gray-900" };

    return <Badge variant="outline" className={cn("inline-flex items-center gap-1.5 font-semibold backdrop-blur-sm", config.className)}>{config.icon}<span>{config.text}</span></Badge>;
};

// ✅ ADDED: NotificationBell now handles dismissing notifications
const NotificationBell = ({ notifications, onDismiss, onClearAll }: { notifications: Notification[], onDismiss: (id: string) => void, onClearAll: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.length;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <motion.button whileTap={{ scale: 0.9 }} className="relative rounded-full p-2 text-gray-600 hover:bg-gray-200/50 hover:text-gray-800 transition-colors">
                    <Bell />
                    {unreadCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
                        >
                            {unreadCount}
                        </motion.span>
                    )}
                </motion.button>
            </PopoverTrigger>
            <PopoverContent className="w-80 backdrop-blur-xl bg-white/70 border-gray-200/80 shadow-2xl mr-4">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-gray-800">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button variant="link" size="sm" className="text-primary -mr-2 h-auto p-1" onClick={onClearAll}>
                            Clear All
                        </Button>
                    )}
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    <AnimatePresence>
                        {notifications.length > 0 ? notifications.map((notif, i) => (
                            <motion.div
                                key={notif.id}
                                layout
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                                exit={{ opacity: 0, x: 50, transition: { duration: 0.3 } }}
                                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-500/10 group relative"
                            >
                                <div className="p-2 bg-white/80 rounded-full shadow-sm">{notif.icon}</div>
                                <div className="flex-grow">
                                    <p className="font-semibold text-sm text-gray-900">{notif.title}</p>
                                    <p className="text-xs text-gray-600">{notif.description}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new NepaliDate(notif.date).format('YYYY-MM-DD, h:mm a')}</p>
                                </div>
                                <button
                                    onClick={() => onDismiss(notif.id)}
                                    className="absolute top-1 right-1 p-1 rounded-full text-gray-400 bg-transparent opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </motion.div>
                        )) : (
                            <div className="text-center text-sm text-gray-500 py-8">
                                <Sparkles className="mx-auto h-8 w-8 text-gray-400 mb-2"/>
                                You're all caught up!
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </PopoverContent>
        </Popover>
    );
};


// --- The Main Dashboard Component ---
export function TenantDashboard() {
  const [user, setUser] = useState<IUser | null>(null);
  const [rentBills, setRentBills] = useState<IRentBill[]>([]);
  const [utilityBills, setUtilityBills] = useState<IUtilityBill[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<IMaintenanceRequest[]>([]);
  // ✅ ADDED: State for notifications to allow dismissal
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMaintDialogOpen, setMaintDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<IPayment | null>(null);
  const [selectedBill, setSelectedBill] = useState<CombinedBill | null>(null);

  const fetchAllData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);
    setError(null);
    try {
      const responses = await Promise.all([
        fetch('/api/auth/me'), fetch('/api/my-bills/rent'), fetch('/api/my-bills/utility'),
        fetch('/api/my-maintenance'), fetch('/api/my-pending-payment'),
      ]);

      for (const res of responses) {
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `A request failed with status ${res.status}`);
        }
      }

      const [userData, rentData, utilityData, maintData, pendingPaymentData] = await Promise.all([
        responses[0].json(), responses[1].json(), responses[2].json(), responses[3].json(), responses[4].json()
      ]);

      if (userData.success) setUser(userData.user);
      if (rentData.success) setRentBills(rentData.data);
      if (utilityData.success) setUtilityBills(utilityData.data);
      if (maintData.success) setMaintenanceRequests(maintData.data);
      if (pendingPaymentData.success) setPendingPayment(pendingPaymentData.pendingPayment);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      console.error("Failed to fetch dashboard data:", errorMessage);
      setError(errorMessage);
      toast.error(`Failed to load data: ${errorMessage}`);
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // ✅ ADDED: useEffect to derive notifications from data, allowing stateful updates
  useEffect(() => {
    const billNotifs = [...rentBills, ...utilityBills]
        .filter(b => b.status === 'DUE' || b.status === 'OVERDUE')
        .map(b => ({
            id: `bill-${b._id.toString()}`,
            type: 'bill' as const,
            title: `New ${(b as IRentBill).rentForPeriod ? 'Rent' : 'Utility'} Bill`,
            description: `A new bill of Rs ${((b as IRentBill).amount || (b as IUtilityBill).totalAmount).toLocaleString()} is due.`,
            date: new Date(b.billDateAD),
            icon: <Receipt className="h-5 w-5 text-blue-500"/>
        }));
    const maintNotifs = maintenanceRequests
        .filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS')
        .map(m => ({
            id: `maint-${m._id.toString()}`,
            type: 'maintenance' as const,
            title: `Request: ${m.issue}`,
            description: `Your maintenance request status is now ${m.status.replace('_', ' ')}.`,
            date: new Date(m.createdAt),
            icon: <Wrench className="h-5 w-5 text-orange-500"/>
        }));

    // Newest notifications are always on top
    const allNotifications = [...billNotifs, ...maintNotifs].sort((a, b) => b.date.getTime() - a.date.getTime());
    setNotifications(allNotifications);
  }, [rentBills, utilityBills, maintenanceRequests]);

  const handleDismissNotification = (id: string) => {
    setNotifications(current => current.filter(n => n.id !== id));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const rentBillsDue = rentBills.filter(b => b.status === 'DUE' || b.status === 'OVERDUE');
  const utilityBillsDue = utilityBills.filter(b => b.status === 'DUE' || b.status === 'OVERDUE');
  const totalDue = rentBillsDue.reduce((acc, bill) => acc + bill.amount, 0) + utilityBillsDue.reduce((acc, bill) => acc + bill.totalAmount, 0);
  const roomInfo = user?.roomId as IRoom | undefined;

  if (loading) {
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Preparing your dashboard...</p>
        </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-700 p-4">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Oops! Something went wrong.</h2>
        <p>We couldn't load your dashboard. Please try refreshing.</p>
        <p className="text-sm text-red-500 mt-2">{error}</p>
        <Button asChild className="mt-6"><a href="/"><Wrench className="mr-2 h-4 w-4"/> Refresh Page</a></Button>
      </div>
    );
  }

  return (
    <>
      {/* --- Animated Aurora Background --- */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden bg-gray-50">
        <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-purple-300/20 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute top-[0%] right-[10%] w-[600px] h-[600px] bg-blue-300/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[25%] w-[400px] h-[400px] bg-pink-300/20 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <motion.div
        className="space-y-8 p-4 md:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }}
      >
        {/* --- Dashboard Header --- */}
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0, transition: { type: 'spring' } }}
            className="flex justify-between items-center"
        >
            <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Welcome, {user?.fullName.split(' ')[0]}!</h1>
                <p className="text-muted-foreground mt-1">Here's what's new for you today.</p>
            </div>
            <NotificationBell notifications={notifications} onDismiss={handleDismissNotification} onClearAll={handleClearAllNotifications} />
        </motion.header>

        {/* --- Metric Cards --- */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { type: 'spring' } }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
            <motion.div whileHover={{ y: -5, transition: { type: 'spring', stiffness: 300 } }} className="lg:col-span-1">
                <Card className="h-full border-2 border-primary/40 shadow-xl shadow-primary/10 bg-white/60 backdrop-blur-xl">
                    <CardHeader><CardTitle className="text-md font-semibold text-gray-600 flex justify-between">Total Amount Due <DollarSign className="h-5 w-5 text-primary" /></CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold text-primary"><AnimatedNumber value={pendingPayment ? pendingPayment.amount : totalDue} /></div>
                        {pendingPayment ? (
                            <div className="flex items-center text-sm text-orange-600 font-semibold mt-3 p-2 bg-orange-100/80 rounded-lg animate-pulse"><Hourglass className="mr-2 h-4 w-4" />Payment Verification Pending</div>
                        ) : totalDue > 0 ? (
                            <Button size="lg" className="mt-4 w-full" onClick={() => setPaymentDialogOpen(true)}><CreditCard className="mr-2 h-5 w-5"/>Pay Now</Button>
                        ) : (
                            <p className="text-md font-semibold text-green-600 mt-4 flex items-center"><CheckCircle className="mr-2 h-5 w-5" />All bills cleared!</p>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div whileHover={{ y: -5, transition: { type: 'spring', stiffness: 300 } }}>
                <Card className="h-full shadow-lg bg-white/60 backdrop-blur-xl border-gray-200/80">
                    <CardHeader><CardTitle className="text-sm font-medium flex justify-between">My Room & Lease <FileText className="h-4 w-4 text-muted-foreground" /></CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm pt-4">
                        <p><strong>Room:</strong> <span className="text-primary font-bold text-base">{roomInfo?.roomNumber || 'N/A'}</span></p>
                        <p><strong>Monthly Rent:</strong> <span className="font-semibold">Rs {roomInfo?.rentAmount.toLocaleString('en-IN') || 'N/A'}</span></p>
                        <p><strong>Lease End:</strong> {user?.leaseEndDate ? new NepaliDate(user.leaseEndDate).format('ddd, MMMM D, YYYY') : 'N/A'}</p>
                    </CardContent>
                </Card>
            </motion.div>

            <Dialog open={isMaintDialogOpen} onOpenChange={setMaintDialogOpen}>
                <DialogTrigger asChild>
                    <motion.div whileHover={{ y: -5, transition: { type: 'spring', stiffness: 300 } }} className="h-full">
                        <Button size="lg" className="w-full h-full text-lg shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-orange-500 to-red-500 text-white group">
                            <Wrench className="mr-3 h-6 w-6 transition-transform duration-300 group-hover:rotate-12"/>Request Maintenance
                        </Button>
                    </motion.div>
                </DialogTrigger>
                <DialogContent><DialogHeader><DialogTitle>New Maintenance Request</DialogTitle><DialogDescription>Describe the issue you&apos;re facing. Our team will get back to you shortly.</DialogDescription></DialogHeader>
                <RequestMaintenanceForm onSuccess={() => { setMaintDialogOpen(false); fetchAllData(); toast.success('Maintenance request submitted!', {icon: '🛠️'}); }} />
                </DialogContent>
            </Dialog>
        </motion.div>

        {/* --- Bills History & Maintenance Requests Tables --- */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { type: 'spring' } }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-6"
        >
            <div className="lg:col-span-3">
                <Card className="shadow-lg bg-white/60 backdrop-blur-xl border-gray-200/80">
                    <CardHeader><CardTitle>Bill History</CardTitle><CardDescription>Combined history of rent and utility bills.</CardDescription></CardHeader>
                    <CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Period</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>
                        <AnimatePresence>{[...rentBills, ...utilityBills].sort((a,b) => new Date(b.billDateAD).getTime() - new Date(a.billDateAD).getTime()).slice(0, 5).map((bill) => {
                            const combinedBill: CombinedBill = { ...bill, type: (bill as IRentBill).rentForPeriod ? 'Rent' : 'Utility' };
                            return (
                                <motion.tr key={bill._id.toString()} layout onClick={() => setSelectedBill(combinedBill)} className="cursor-pointer" whileHover={{ backgroundColor: 'rgba(100,100,100,0.05)', transition: { duration: 0.2 } }}>
                                    <TableCell><Badge variant="secondary" className="font-semibold">{combinedBill.type}</Badge></TableCell>
                                    <TableCell>{(bill as IRentBill).rentForPeriod || (bill as IUtilityBill).billingMonthBS}</TableCell>
                                    <TableCell className="font-mono">Rs {(bill as IRentBill).amount?.toLocaleString() || (bill as IUtilityBill).totalAmount?.toLocaleString()}</TableCell>
                                    <TableCell><StatusBadge status={bill.status} /></TableCell>
                                </motion.tr>
                            );
                        })}</AnimatePresence>
                        {rentBills.length === 0 && utilityBills.length === 0 && <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground"><XCircle className="mx-auto mb-2 h-6 w-6"/>No bills found.</TableCell></TableRow>}
                    </TableBody></Table></CardContent>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <Card className="shadow-lg bg-white/60 backdrop-blur-xl border-gray-200/80">
                    <CardHeader><CardTitle>Maintenance Requests</CardTitle><CardDescription>Status of your recent requests.</CardDescription></CardHeader>
                    <CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Issue</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>
                        <AnimatePresence>{maintenanceRequests.slice(0, 5).map(req => (
                            <motion.tr key={req._id.toString()} layout whileHover={{ backgroundColor: 'rgba(100,100,100,0.05)', transition: { duration: 0.2 } }}>
                                <TableCell className="font-medium">{req.issue}</TableCell>
                                <TableCell><StatusBadge status={req.status} /></TableCell>
                            </motion.tr>
                        ))}</AnimatePresence>
                        {maintenanceRequests.length === 0 && <TableRow><TableCell colSpan={2} className="h-24 text-center text-muted-foreground"><XCircle className="mx-auto mb-2 h-6 w-6"/>No requests found.</TableCell></TableRow>}
                    </TableBody></Table></CardContent>
                </Card>
            </div>
        </motion.div>
      </motion.div>

      {/* --- Dialogs for actions --- */}
      <PaymentDialog isOpen={isPaymentDialogOpen} onClose={() => { setPaymentDialogOpen(false); fetchAllData(); }} totalDue={totalDue} rentBillsDue={rentBillsDue} utilityBillsDue={utilityBillsDue} />
      <BillDetailsDialog isOpen={!!selectedBill} onClose={() => setSelectedBill(null)} bill={selectedBill} />
    </>
  );
}