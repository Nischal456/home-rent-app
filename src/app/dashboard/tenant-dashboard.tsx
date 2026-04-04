'use client';

// --- Core React & Next.js Imports ---
import { useEffect, useState, useCallback, ReactNode, useMemo, lazy, Suspense } from 'react';
import Link from 'next/link';

// --- UI Components from shadcn/ui ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// --- Icons from lucide-react ---
import { Loader2, Wrench, FileText, CreditCard, Hourglass, AlertTriangle, CheckCircle, Receipt, XCircle, ArrowRight, Zap, Building, AlertCircle as AlertCircleIcon, CalendarDays, Droplets, ZapIcon, Wallet } from 'lucide-react';

// --- Animation with Framer Motion ---
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';

// --- Utilities & Types ---
import NepaliDate from 'nepali-date-converter';
import { toast } from 'react-hot-toast';
import { IRentBill, IUtilityBill, IUser, IMaintenanceRequest, IRoom, IPayment } from '@/types';
import { cn } from '@/lib/utils';

// --- Lazy-loaded Components ---
const RequestMaintenanceForm = lazy(() => import('./request-maintenance-form').then(module => ({ default: module.RequestMaintenanceForm })));
const PaymentDialog = lazy(() => import('./payment-dialog').then(module => ({ default: module.PaymentDialog })));
const BillDetailsDialog = lazy(() => import('./bill-details-dialog').then(module => ({ default: module.BillDetailsDialog })));


// --- Type Definitions ---
type CombinedBill = (IRentBill | IUtilityBill) & { type: 'Rent' | 'Utility' };
type Status = 'DUE' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

// --- Reusable Sub-Components ---

const AnimatedNumber = ({ value }: { value: number }) => {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => `Rs ${Math.round(current).toLocaleString('en-IN')}`);
  useEffect(() => { spring.set(value); }, [spring, value]);
  return <motion.span>{display}</motion.span>;
};

const StatusBadge = ({ status }: { status: Status }) => {
  const statusConfig = {
    PAID: { text: "Paid", icon: <CheckCircle className="h-3.5 w-3.5" />, className: "bg-emerald-100/80 text-emerald-700 border-emerald-200" },
    PARTIALLY_PAID: { text: "Partially Paid", icon: <Hourglass className="h-3.5 w-3.5" />, className: "bg-blue-100/80 text-blue-700 border-blue-200" },
    COMPLETED: { text: "Completed", icon: <CheckCircle className="h-3.5 w-3.5" />, className: "bg-emerald-100/80 text-emerald-700 border-emerald-200" },
    DUE: { text: "Due", icon: <Hourglass className="h-3.5 w-3.5" />, className: "bg-amber-100/80 text-amber-700 border-amber-200" },
    PENDING: { text: "Pending", icon: <Hourglass className="h-3.5 w-3.5 animate-spin-slow" />, className: "bg-blue-100/80 text-blue-700 border-blue-200" },
    OVERDUE: { text: "Overdue", icon: <AlertTriangle className="h-3.5 w-3.5" />, className: "bg-red-100/80 text-red-700 border-red-200 animate-pulse" },
    IN_PROGRESS: { text: "In Progress", icon: <Wrench className="h-3.5 w-3.5 animate-spin-slow" />, className: "bg-purple-100/80 text-purple-700 border-purple-200" },
  };
  const config = statusConfig[status] || { text: status, icon: null, className: "bg-slate-100/80 text-slate-700" };
  return <Badge variant="outline" className={cn("inline-flex items-center gap-1.5 font-bold tracking-wide rounded-full px-2.5 py-0.5 backdrop-blur-md shadow-sm", config.className)}>{config.icon}<span>{config.text}</span></Badge>;
};

const getBillIcon = (type: 'Rent' | 'Utility'): ReactNode => {
  switch (type) {
    case 'Rent': return <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shadow-sm"><Receipt className="h-5 w-5" /></div>;
    case 'Utility': return <div className="p-2 bg-yellow-50 text-yellow-600 rounded-xl shadow-sm"><Zap className="h-5 w-5" /></div>;
    default: return null;
  }
};

// --- The Main Dashboard Component ---
export function TenantDashboard() {
  const [user, setUser] = useState<IUser | null>(null);
  const [rentBills, setRentBills] = useState<IRentBill[]>([]);
  const [utilityBills, setUtilityBills] = useState<IUtilityBill[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<IMaintenanceRequest[]>([]);
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
        if (!res.ok) throw new Error(`Failed to load some resources.`);
      }
      const [userData, rentData, utilityData, maintData, pendingPaymentData] = await Promise.all(responses.map(res => res.json()));
      if (userData.success) setUser(userData.user);
      if (rentData.success) setRentBills(rentData.data);
      if (utilityData.success) setUtilityBills(utilityData.data);
      if (maintData.success) setMaintenanceRequests(maintData.data);
      if (pendingPaymentData.success) setPendingPayment(pendingPaymentData.pendingPayment);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast.error(`Failed to load data: ${errorMessage}`);
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // --- Memoized Calculations ---
  const { rentBillsDue, utilityBillsDue, totalDue, allBills, activeMaintenanceCount, roomInfo } = useMemo(() => {
    const rentBillsDue = rentBills.filter(b => b.status === 'DUE' || b.status === 'OVERDUE' || b.status === 'PARTIALLY_PAID');
    const utilityBillsDue = utilityBills.filter(b => b.status === 'DUE' || b.status === 'OVERDUE' || b.status === 'PARTIALLY_PAID');
    const totalDue = rentBillsDue.reduce((acc, bill) => acc + (bill.remainingAmount ?? bill.amount), 0) + utilityBillsDue.reduce((acc, bill) => acc + (bill.remainingAmount ?? bill.totalAmount), 0);
    const allBills = [...rentBills, ...utilityBills].sort((a, b) => new Date(b.billDateAD).getTime() - new Date(a.billDateAD).getTime());
    const activeMaintenanceCount = maintenanceRequests.filter(req => req.status === 'PENDING' || req.status === 'IN_PROGRESS').length;
    const roomInfo = user?.roomId as IRoom | undefined;

    return { rentBillsDue, utilityBillsDue, totalDue, allBills, activeMaintenanceCount, roomInfo };
  }, [rentBills, utilityBills, maintenanceRequests, user]);

  // --- Helper to render dynamic content in the 'Due' card ---
  const renderDueCardContent = () => {
    if (pendingPayment) {
      return (
        <div className="flex flex-col h-full justify-between">
          <div className="text-4xl md:text-5xl font-extrabold text-orange-600 tracking-tight drop-shadow-sm"><AnimatedNumber value={pendingPayment.amount} /></div>
          <div className="flex items-center text-sm text-orange-700 font-bold mt-4 p-3 bg-orange-100/80 rounded-xl animate-pulse shadow-sm border border-orange-200">
            <Hourglass className="mr-2 h-5 w-5" />
            Payment Verification Pending
          </div>
        </div>
      );
    }
    if (totalDue > 0) {
      return (
        <div className="flex flex-col h-full justify-between">
          <div className="text-4xl md:text-5xl font-extrabold text-[#0B2863] tracking-tight drop-shadow-sm"><AnimatedNumber value={totalDue} /></div>
          <Button 
            size="lg" 
            className="mt-5 w-full bg-gradient-to-r from-[#00B074] to-[#009b66] hover:from-[#009b66] hover:to-[#008255] text-white shadow-lg shadow-green-500/30 rounded-xl font-bold text-base h-12 transform-gpu active:scale-[0.98] transition-all" 
            onClick={() => setPaymentDialogOpen(true)}
          >
            <CreditCard className="mr-2 h-5 w-5" />Pay Now
          </Button>
        </div>
      );
    }
    return (
      <div className="flex flex-col h-full justify-between">
        <div className="text-4xl md:text-5xl font-extrabold text-emerald-500 tracking-tight drop-shadow-sm"><AnimatedNumber value={0} /></div>
        <div className="mt-5 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center">
          <CheckCircle className="mr-2 h-5 w-5 text-emerald-500" />
          <p className="text-sm font-bold text-emerald-700">All bills cleared!</p>
        </div>
      </div>
    );
  };

  // --- Loading Skeleton ---
  if (loading) {
    return (
      <div className="space-y-8 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div><Skeleton className="h-10 w-64 rounded-xl" /><Skeleton className="h-5 w-48 mt-3 rounded-lg" /></div>
          <Skeleton className="h-12 w-full sm:w-52 rounded-2xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-48 rounded-[2rem]" /><Skeleton className="h-48 rounded-[2rem]" /><Skeleton className="h-48 rounded-[2rem]" /></div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6"><Skeleton className="h-[400px] rounded-[2rem] lg:col-span-3" /><Skeleton className="h-[400px] rounded-[2rem] lg:col-span-2" /></div>
      </div>
    );
  }
  
  // --- Error State ---
  if (error) {
    return (
      <div className="p-8 max-w-md mx-auto mt-10">
        <Alert variant="destructive" className="bg-white rounded-3xl shadow-xl border-0 p-6">
            <AlertCircleIcon className="h-6 w-6 text-red-500" />
            <AlertTitle className="text-lg font-bold mt-2">Error Loading Dashboard</AlertTitle>
            <AlertDescription className="text-slate-500 mt-2">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <Suspense fallback={<div />}>
        <PaymentDialog isOpen={isPaymentDialogOpen} onClose={() => { setPaymentDialogOpen(false); fetchAllData(); }} totalDue={totalDue} rentBillsDue={rentBillsDue} utilityBillsDue={utilityBillsDue} />
        <BillDetailsDialog isOpen={!!selectedBill} onClose={() => setSelectedBill(null)} bill={selectedBill} user={user} />
      </Suspense>

      {/* --- Premium Animated Background Blobs (Optimized with transform-gpu) --- */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden bg-[#f8fafc] pointer-events-none">
        <div className="absolute top-[-10%] left-[5%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-blue-300/20 rounded-full filter blur-[80px] animate-blob transform-gpu"></div>
        <div className="absolute top-[10%] right-[5%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] bg-indigo-300/20 rounded-full filter blur-[80px] animate-blob animation-delay-2000 transform-gpu"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[35vw] h-[35vw] max-w-[400px] max-h-[400px] bg-orange-300/20 rounded-full filter blur-[80px] animate-blob animation-delay-4000 transform-gpu"></div>
      </div>

      <motion.div 
        className="space-y-8 p-4 md:p-8 max-w-[1600px] mx-auto w-full relative z-10 pb-32" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}
      >
        
        {/* --- Header Section --- */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/60 shadow-sm"
        >
          <div>
            <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-1">Dashboard Overview</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0B2863] tracking-tight">Welcome, {user?.fullName?.split(' ')[0]}!</h1>
            <p className="text-slate-600 font-medium mt-2 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#0B2863]" />
              Today is {new NepaliDate().format('ddd, MMMM D, YYYY')}
            </p>
          </div>
          <Dialog open={isMaintDialogOpen} onOpenChange={setMaintDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="group w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200 px-6 py-6 text-sm sm:text-base font-extrabold text-slate-800 shadow-sm hover:shadow-md hover:border-orange-500 hover:text-orange-600 active:scale-[0.97] transition-all duration-300 transform-gpu"
              >
                <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-orange-50 transition-colors">
                  <Wrench className="h-5 w-5 text-slate-500 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 group-hover:text-orange-500" />
                </div>
                <span className="tracking-wide">Request Maintenance</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-[2.5rem] border-0 shadow-2xl p-6">
              <DialogHeader><DialogTitle className="text-2xl font-bold">New Request</DialogTitle><DialogDescription>Describe the issue you're facing. Our team will get back to you shortly.</DialogDescription></DialogHeader>
              <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#0B2863]" /></div>}>
                <RequestMaintenanceForm onSuccess={() => { setMaintDialogOpen(false); fetchAllData(); toast.success('Maintenance request submitted!', { icon: '🛠️' }); }} />
              </Suspense>
            </DialogContent>
          </Dialog>
        </motion.header>

        {/* --- Top Overview Cards --- */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          <motion.div whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300 } }} className="lg:col-span-1">
            <Card className="h-full border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 backdrop-blur-xl rounded-[2rem] overflow-hidden flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-white/50 border-b border-slate-100/50">
                <CardTitle className="text-sm font-extrabold text-slate-500 uppercase tracking-wider">Total Amount Due</CardTitle>
                <div className="p-2 bg-blue-50 rounded-xl"><CreditCard className="h-5 w-5 text-blue-600" /></div>
              </CardHeader>
              <CardContent className="pt-6 flex-1">
                {renderDueCardContent()}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300 } }}>
            <Card className="h-full border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 backdrop-blur-xl rounded-[2rem] overflow-hidden flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-white/50 border-b border-slate-100/50">
                <CardTitle className="text-sm font-extrabold text-slate-500 uppercase tracking-wider">My Room</CardTitle>
                <div className="p-2 bg-indigo-50 rounded-xl"><Building className="h-5 w-5 text-indigo-600" /></div>
              </CardHeader>
              <CardContent className="pt-6 text-sm space-y-4 flex-1">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="font-semibold text-slate-500">Room Number</span>
                  <span className="text-[#0B2863] font-extrabold text-lg bg-blue-50 px-3 py-1 rounded-lg">{roomInfo?.roomNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="font-semibold text-slate-500">Monthly Rent</span>
                  <span className="font-extrabold text-slate-900 text-base">Rs {roomInfo?.rentAmount.toLocaleString('en-IN') || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Lease End Date</span>
                  <span className="font-bold text-slate-700">{user?.leaseEndDate ? new NepaliDate(new Date(user.leaseEndDate)).format('MMM D, YYYY') : 'N/A'}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300 } }}>
            <Card className="h-full border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 backdrop-blur-xl rounded-[2rem] overflow-hidden flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-white/50 border-b border-slate-100/50">
                <CardTitle className="text-sm font-extrabold text-slate-500 uppercase tracking-wider">Active Maintenance</CardTitle>
                <div className="p-2 bg-orange-50 rounded-xl"><Wrench className="h-5 w-5 text-orange-600" /></div>
              </CardHeader>
              <CardContent className="pt-6 flex-1 flex flex-col justify-center">
                <div className="text-5xl font-extrabold text-orange-500 drop-shadow-sm">{activeMaintenanceCount}</div>
                <p className="text-sm font-bold text-slate-500 mt-2">
                  {activeMaintenanceCount === 1 ? 'Request is currently active' : 'Requests are currently active'}
                </p>
              </CardContent>
            </Card>
          </motion.div>

        </motion.div>

        {/* --- Bottom Tables & Lists --- */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* --- REBUILT RECENT BILL HISTORY (NEXT LEVEL UI) --- */}
          <div className="lg:col-span-3">
            <Card className="border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 backdrop-blur-xl rounded-[2rem] overflow-hidden h-full flex flex-col">
              <CardHeader className="bg-white/50 border-b border-slate-100/50 p-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Recent Bills</CardTitle>
                  <CardDescription className="font-medium text-slate-500 mt-1">Select any card to view detailed breakdown.</CardDescription>
                </div>
              </CardHeader>
              
              {/* Premium Two-Column Layout for Bills */}
              <CardContent className="p-6 bg-slate-50/30 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* --- RENT BILLS COLUMN --- */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                      <Wallet className="h-4 w-4 text-blue-500" /> Rent History
                    </h3>
                    <div className="space-y-3">
                      <AnimatePresence>
                        {rentBills.slice(0, 4).map((bill) => (
                          <motion.div
                            layout
                            key={bill._id.toString()}
                            onClick={() => setSelectedBill({ ...bill, type: 'Rent' } as CombinedBill)}
                            className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:shadow-[0_8px_20px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                          >
                            {/* Subtle hover gradient */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <div className="relative z-10 flex items-center gap-4">
                              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shadow-inner group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                <Wallet className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-base">{bill.rentForPeriod}</h4>
                                <p className="text-xs font-bold text-slate-400 mt-0.5">
                                  Issued: {new Date(bill.billDateAD).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            
                            <div className="relative z-10 mt-3 sm:mt-0 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                              <span className="font-black text-[#0B2863] text-lg">Rs {bill.amount.toLocaleString('en-IN')}</span>
                              <StatusBadge status={bill.status} />
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {rentBills.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-6 bg-white/50 border border-dashed border-slate-200 rounded-2xl">
                          <Receipt className="h-8 w-8 text-slate-300 mb-2" />
                          <p className="text-sm font-bold text-slate-400">No rent bills found.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* --- UTILITY BILLS COLUMN --- */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                      <Zap className="h-4 w-4 text-orange-500" /> Utility History
                    </h3>
                    <div className="space-y-3">
                      <AnimatePresence>
                        {utilityBills.slice(0, 4).map((bill) => (
                          <motion.div
                            layout
                            key={bill._id.toString()}
                            onClick={() => setSelectedBill({ ...bill, type: 'Utility' } as CombinedBill)}
                            className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:shadow-[0_8px_20px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                          >
                            {/* Subtle hover gradient */}
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <div className="relative z-10 flex items-center gap-4">
                              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl shadow-inner group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                                <ZapIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-base">{bill.billingMonthBS}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  {/* Premium visual badge for "Units" indication */}
                                  <Badge variant="secondary" className="bg-slate-100 text-[10px] text-slate-500 px-1.5 py-0 rounded-md border border-slate-200/50 shadow-sm flex items-center gap-1">
                                    <Droplets className="h-3 w-3 text-blue-400" /> + <ZapIcon className="h-3 w-3 text-yellow-500" />
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="relative z-10 mt-3 sm:mt-0 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                              <span className="font-black text-slate-900 text-lg">Rs {bill.totalAmount.toLocaleString('en-IN')}</span>
                              <StatusBadge status={bill.status} />
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {utilityBills.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-6 bg-white/50 border border-dashed border-slate-200 rounded-2xl">
                          <ZapIcon className="h-8 w-8 text-slate-300 mb-2" />
                          <p className="text-sm font-bold text-slate-400">No utility bills found.</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </CardContent>

              {(rentBills.length > 4 || utilityBills.length > 4) && (
                <CardFooter className="p-4 bg-slate-50/80 border-t border-slate-100 mt-auto">
                  <Button asChild variant="ghost" className="w-full font-bold text-[#0B2863] hover:bg-blue-50 hover:text-[#0B2863] rounded-xl h-12 transition-all">
                    <Link href="/dashboard/statement">View Full Statement <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>

          {/* --- ACTIVE MAINTENANCE CARD (Locked / Untouched Logic) --- */}
          <div className="lg:col-span-2">
            <Card className="border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 backdrop-blur-xl rounded-[2rem] overflow-hidden h-full flex flex-col">
              <CardHeader className="bg-white/50 border-b border-slate-100/50 p-6">
                <CardTitle className="text-xl font-extrabold text-slate-900">Recent Maintenance</CardTitle>
                <CardDescription className="font-medium text-slate-500">Status of your last 5 requests.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4 flex-1">
                <AnimatePresence>
                  {maintenanceRequests.slice(0, 5).map((req) => (
                    <motion.div
                      key={req._id.toString()} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="font-bold text-slate-800 text-sm mb-2 sm:mb-0 line-clamp-2 pr-4">{req.issue}</div>
                      <div className="shrink-0"><StatusBadge status={req.status} /></div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {maintenanceRequests.length === 0 && (
                  <div className="text-center py-10">
                    <XCircle className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-bold text-slate-500 text-sm">No maintenance requests found.</p>
                  </div>
                )}
              </CardContent>
              {maintenanceRequests.length > 5 && (
                <CardFooter className="p-4 bg-slate-50/50 border-t border-slate-100/50 mt-auto">
                  <Button variant="ghost" className="w-full font-bold text-slate-700 hover:bg-slate-100 rounded-xl h-12">
                    View All Requests <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>

        </motion.div>
      </motion.div>
    </>
  );
}