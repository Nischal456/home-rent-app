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
import { Loader2, Wrench, FileText, CreditCard, Hourglass, AlertTriangle, CheckCircle, Receipt, XCircle, ArrowRight, Zap, Building, AlertCircle as AlertCircleIcon, CalendarDays, Droplets, ZapIcon, Wallet, ExternalLink, QrCode, MessageSquare } from 'lucide-react';

// --- Animation with Framer Motion ---
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';

// --- Utilities & Types ---
import NepaliDate from 'nepali-date-converter';
import { toast } from 'react-hot-toast';
import { IRentBill, IUtilityBill, IUser, IMaintenanceRequest, IRoom, IPayment } from '@/types';
import { cn } from '@/lib/utils';
import { ContractViewerDialog } from '@/components/contract-viewer-dialog';

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

const formatNepaliDate = (date: Date | string | undefined): string => {
  if (!date) return 'Not set';
  try {
    return new NepaliDate(new Date(date)).format('YYYY MMMM DD');
  } catch {
    return 'Not set';
  }
};

const getLeaseRemainingDays = (date: Date | string | undefined): number | null => {
  if (!date) return null;
  try {
    const end = new Date(date).getTime();
    const now = new Date().getTime();
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
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
  const [isViewerOpen, setIsViewerOpen] = useState(false);

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
        <div className="flex flex-col h-full justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submitted Amount</span>
            <div className="text-3xl md:text-4xl font-extrabold text-orange-600 tracking-tight drop-shadow-sm mt-1">
              <AnimatedNumber value={pendingPayment.amount} />
            </div>
          </div>
          
          <div className="p-3.5 bg-orange-50/90 rounded-2xl border border-orange-200/80 space-y-1 my-auto">
            <div className="flex items-center text-xs font-bold text-orange-800">
              <Hourglass className="mr-1.5 h-4 w-4 animate-spin text-orange-600" />
              Payment Verification Pending
            </div>
            <p className="text-[11px] text-orange-700 font-medium leading-relaxed">
              Admin is reviewing your deposit. Your bill will be marked as settled once verified.
            </p>
          </div>

          <div className="text-center py-1">
            <span className="text-xs font-semibold text-slate-400">Waiting for management confirmation</span>
          </div>
        </div>
      );
    }
    if (totalDue > 0) {
      const rentTotal = rentBillsDue.reduce((sum, b) => sum + (b.remainingAmount ?? b.amount), 0);
      const utilityTotal = utilityBillsDue.reduce((sum, b) => sum + (b.remainingAmount ?? b.totalAmount), 0);

      return (
        <div className="flex flex-col h-full justify-between gap-3.5">
          <div>
            <div className="flex items-baseline justify-between">
              <div className="text-4xl md:text-5xl font-black text-[#0B2863] tracking-tight drop-shadow-sm">
                <AnimatedNumber value={totalDue} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                NPR
              </span>
            </div>
          </div>

          {/* Mini Itemized Breakdown filling the vertical space */}
          <div className="space-y-2 py-1 my-auto">
            {rentBillsDue.length > 0 && (
              <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-slate-50/90 border border-slate-100 hover:bg-slate-100/60 transition-colors">
                <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Rent ({rentBillsDue[0]?.rentForPeriod ?? 'Current'})
                </span>
                <span className="font-bold text-slate-900">
                  Rs {rentTotal.toLocaleString('en-IN')}
                </span>
              </div>
            )}
            {utilityBillsDue.length > 0 && (
              <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-slate-50/90 border border-slate-100 hover:bg-slate-100/60 transition-colors">
                <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Utilities ({utilityBillsDue[0]?.billingMonthBS ?? 'Current'})
                </span>
                <span className="font-bold text-slate-900">
                  Rs {utilityTotal.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>

          {/* Tactile High-End Pay Now Button */}
          <Button 
            size="lg" 
            className="w-full bg-gradient-to-r from-[#00B074] to-[#009b66] hover:from-[#009b66] hover:to-[#008255] text-white shadow-lg shadow-green-500/25 rounded-xl font-bold text-base h-12 transform-gpu active:scale-[0.98] transition-all flex items-center justify-center gap-2 group" 
            onClick={() => setPaymentDialogOpen(true)}
          >
            <CreditCard className="h-4 w-4 text-emerald-100 group-hover:scale-110 transition-transform" />
            <span>Pay Now</span>
            <ArrowRight className="h-4 w-4 ml-1 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Button>
        </div>
      );
    }
    return (
      <div className="flex flex-col h-full justify-between gap-4">
        <div>
          <div className="text-4xl md:text-5xl font-black text-emerald-600 tracking-tight drop-shadow-sm">
            <AnimatedNumber value={0} />
          </div>
          <span className="text-xs font-semibold text-slate-400 mt-1 block">Net Balance</span>
        </div>
        
        <div className="p-4 bg-emerald-50/80 border border-emerald-100 rounded-2xl flex items-center gap-3 my-auto">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-900">All bills cleared!</p>
            <p className="text-xs text-emerald-700 font-medium">You have no pending dues.</p>
          </div>
        </div>

        <div className="text-center py-1">
          <span className="text-xs font-semibold text-emerald-600 flex items-center justify-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Account up to date
          </span>
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
            <Card className="h-full border border-white/80 shadow-[0_10px_35px_rgba(0,0,0,0.05)] bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-3 bg-white/60 border-b border-slate-100/60">
                <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-wider">Total Amount Due</CardTitle>
                {pendingPayment ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200/60 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                    Pending
                  </span>
                ) : totalDue > 0 ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    {rentBillsDue.length + utilityBillsDue.length} {rentBillsDue.length + utilityBillsDue.length === 1 ? 'Bill Due' : 'Bills Due'}
                  </span>
                ) : (
                  <div className="p-1.5 bg-emerald-50 rounded-xl"><CheckCircle className="h-4 w-4 text-emerald-600" /></div>
                )}
              </CardHeader>
              <CardContent className="p-5 md:p-6 flex-1 flex flex-col justify-between">
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
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="font-semibold text-slate-500">Lease End Date</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">{formatNepaliDate(user?.leaseEndDate)}</span>
                    {user?.leaseEndDate && (
                      <span className="block text-[11px] font-semibold text-blue-600">
                        {(() => {
                          const days = getLeaseRemainingDays(user.leaseEndDate);
                          if (days === null) return '';
                          if (days < 0) return 'Expired';
                          if (days === 0) return 'Ends today';
                          return `${days} days remaining`;
                        })()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Agreement Contract
                  </span>
                  {user?.contractDocument ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsViewerOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 px-3 py-1.5 rounded-xl transition-colors shadow-xs h-8"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>View Contract</span>
                    </Button>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-lg">
                      No contract added
                    </span>
                  )}
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

        {/* --- Rental Agreement Contract Card (Same as Admin) --- */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12 }} className="w-full">
          <Card className={cn(
            "border shadow-[0_8px_30px_rgba(0,0,0,0.02)] rounded-[2.5rem] backdrop-blur-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all",
            user?.contractDocument
              ? "border-blue-200/70 bg-gradient-to-r from-blue-50/40 via-indigo-50/20 to-white/80"
              : "border-amber-200/80 bg-gradient-to-r from-amber-50/40 via-orange-50/20 to-white/80"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-[1.3rem] flex items-center justify-center shadow-inner flex-shrink-0",
                user?.contractDocument ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
              )}>
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-slate-800 text-lg tracking-tight">Rental Agreement Contract</h4>
                  {user?.contractDocument ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] font-bold tracking-widest uppercase">
                      Active Contract
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold tracking-widest uppercase">
                      No contract added
                    </Badge>
                  )}
                  {user?.leaseEndDate && (
                    <Badge className="bg-blue-100 text-blue-800 border-none text-[10px] font-bold tracking-widest uppercase">
                      Lease End: {formatNepaliDate(user?.leaseEndDate)}
                    </Badge>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  {user?.contractDocument
                    ? `Attached: ${user.contractName || 'Agreement Document'} • Lease Period ends on ${formatNepaliDate(user.leaseEndDate)}`
                    : user?.leaseEndDate 
                      ? `Lease Period ends on ${formatNepaliDate(user.leaseEndDate)} • No contract document attached yet.`
                      : 'No contract added yet. Please contact management.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
              {user?.contractDocument && (
                <Button
                  onClick={() => setIsViewerOpen(true)}
                  className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 rounded-2xl px-6 h-11 font-bold bg-[#0B2863] hover:bg-[#0B2863]/90 text-white shadow-md transition-all active:scale-95 text-xs"
                >
                  <FileText className="w-4 h-4" />
                  View Contract
                </Button>
              )}
            </div>
          </Card>
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
                                {((bill.paymentHistory && bill.paymentHistory.some((p: any) => p.remarks && p.remarks.trim())) || (bill.remarks && bill.remarks.trim())) && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md mt-1 border border-blue-100/80">
                                    <MessageSquare className="w-2.5 h-2.5 text-blue-600" /> Admin Note
                                  </span>
                                )}
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
                                  {((bill.paymentHistory && bill.paymentHistory.some((p: any) => p.remarks && p.remarks.trim())) || (bill.remarks && bill.remarks.trim())) && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/80">
                                      <MessageSquare className="w-2.5 h-2.5 text-blue-600" /> Admin Note
                                    </span>
                                  )}
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

      {user?.contractDocument && (
        <ContractViewerDialog
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          contractUrl={user.contractDocument}
          contractName={user.contractName}
          tenantName={user.fullName}
        />
      )}
    </>
  );
}