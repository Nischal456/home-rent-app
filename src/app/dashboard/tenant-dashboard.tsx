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

// --- Icons from lucide-react ---
import { Loader2, Wrench, FileText, CreditCard, Hourglass, AlertTriangle, CheckCircle, Receipt, XCircle, ArrowRight, Zap, Building } from 'lucide-react'; // ✅ Added Zap, Building

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
type Status = 'DUE' | 'PAID' | 'OVERDUE' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

// --- Reusable Sub-Components ---

const AnimatedNumber = ({ value }: { value: number }) => {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => `Rs ${Math.round(current).toLocaleString('en-IN')}`);
  useEffect(() => { spring.set(value); }, [spring, value]);
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

const getBillIcon = (type: 'Rent' | 'Utility'): ReactNode => {
  switch (type) {
    case 'Rent': return <Receipt className="h-5 w-5 text-blue-500" />;
    case 'Utility': return <Zap className="h-5 w-5 text-yellow-500" />;
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
        if (!res.ok) throw new Error(`A request failed with status ${res.status}`);
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
    const rentBillsDue = rentBills.filter(b => b.status === 'DUE' || b.status === 'OVERDUE');
    const utilityBillsDue = utilityBills.filter(b => b.status === 'DUE' || b.status === 'OVERDUE');
    const totalDue = rentBillsDue.reduce((acc, bill) => acc + bill.amount, 0) + utilityBillsDue.reduce((acc, bill) => acc + bill.totalAmount, 0);
    const allBills = [...rentBills, ...utilityBills].sort((a, b) => new Date(b.billDateAD).getTime() - new Date(a.billDateAD).getTime());
    const activeMaintenanceCount = maintenanceRequests.filter(req => req.status === 'PENDING' || req.status === 'IN_PROGRESS').length;
    const roomInfo = user?.roomId as IRoom | undefined;

    return { rentBillsDue, utilityBillsDue, totalDue, allBills, activeMaintenanceCount, roomInfo };
  }, [rentBills, utilityBills, maintenanceRequests, user]);

  // --- Helper to render dynamic content in the 'Due' card ---
  const renderDueCardContent = () => {
    if (pendingPayment) {
      return (
        <>
          <div className="text-4xl font-extrabold text-orange-600"><AnimatedNumber value={pendingPayment.amount} /></div>
          <div className="flex items-center text-sm text-orange-600 font-semibold mt-3 p-2 bg-orange-100/80 rounded-lg animate-pulse">
            <Hourglass className="mr-2 h-4 w-4" />
            Payment Verification Pending
          </div>
        </>
      );
    }
    if (totalDue > 0) {
      return (
        <>
          <div className="text-4xl font-extrabold text-primary"><AnimatedNumber value={totalDue} /></div>
          <Button size="lg" className="mt-4 w-full" onClick={() => setPaymentDialogOpen(true)}>
            <CreditCard className="mr-2 h-5 w-5" />Pay Now
          </Button>
        </>
      );
    }
    return (
      <>
        <div className="text-4xl font-extrabold text-green-600"><AnimatedNumber value={0} /></div>
        <p className="text-md font-semibold text-green-600 mt-4 flex items-center">
          <CheckCircle className="mr-2 h-5 w-5" />
          All bills cleared!
        </p>
      </>
    );
  };

  if (loading) { /* ... loading state ... */ }
  if (error) { /* ... error state ... */ }

  return (
    <>
      {/* --- Other Dialogs (Controlled) --- */}
      <Suspense fallback={<div />}>
        <PaymentDialog isOpen={isPaymentDialogOpen} onClose={() => { setPaymentDialogOpen(false); fetchAllData(); }} totalDue={totalDue} rentBillsDue={rentBillsDue} utilityBillsDue={utilityBillsDue} />
        <BillDetailsDialog isOpen={!!selectedBill} onClose={() => setSelectedBill(null)} bill={selectedBill} user={user} />
      </Suspense>

      {/* --- Background --- */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden bg-gray-50">
        <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-purple-300/20 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute top-[0%] right-[10%] w-[600px] h-[600px] bg-blue-300/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[25%] w-[400px] h-[400px] bg-pink-300/20 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <motion.div className="space-y-8 p-4 md:p-8" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}>
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Welcome, {user?.fullName?.split(' ')[0]}!</h1>
            <p className="text-muted-foreground mt-1">Today is {new NepaliDate().format('ddd, MMMM D, YYYY')}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* ✅ FIX: Wrapped the Trigger and Content inside the parent Dialog component */}
            <Dialog open={isMaintDialogOpen} onOpenChange={setMaintDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="group w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm sm:text-base font-semibold text-gray-800 shadow-md hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600 active:scale-[0.97] transition-all duration-300"
                >
                  <Wrench
                    className="h-5 w-5 text-gray-500 transition-all duration-300 group-hover:rotate-12 group-hover:scale-125 group-hover:text-orange-500"
                  />
                  <span className="tracking-wide">Request Maintenance</span>
                </Button>


              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Maintenance Request</DialogTitle>
                  <DialogDescription>Describe the issue you're facing. Our team will get back to you shortly.</DialogDescription>
                </DialogHeader>
                <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}>
                  <RequestMaintenanceForm onSuccess={() => { setMaintDialogOpen(false); fetchAllData(); toast.success('Maintenance request submitted!', { icon: '🛠️' }); }} />
                </Suspense>
              </DialogContent>
            </Dialog>
          </div>
        </motion.header>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <motion.div whileHover={{ y: -5, transition: { type: 'spring', stiffness: 300 } }} className="lg:col-span-1">
            <Card className="h-full border-2 border-primary/40 shadow-xl shadow-primary/10 bg-white/60 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-md font-semibold text-gray-600">Total Amount Due</CardTitle>
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>{renderDueCardContent()}</CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -5, transition: { type: 'spring', stiffness: 300 } }}>
            <Card className="h-full shadow-lg bg-white/60 backdrop-blur-xl border-gray-200/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-md font-semibold text-gray-600">My Room</CardTitle>
                <Building className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-4 text-sm space-y-2">
                <p><strong>Room Number:</strong> <span className="text-primary font-bold text-base">{roomInfo?.roomNumber || 'N/A'}</span></p>
                <p><strong>Monthly Rent:</strong> <span className="font-semibold">Rs {roomInfo?.rentAmount.toLocaleString('en-IN') || 'N/A'}</span></p>
                <p><strong>Lease End Date:</strong> {user?.leaseEndDate ? new NepaliDate(user.leaseEndDate).format('ddd, MMMM D, YYYY') : 'N/A'}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -5, transition: { type: 'spring', stiffness: 300 } }}>
            <Card className="h-full shadow-lg bg-white/60 backdrop-blur-xl border-gray-200/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-md font-semibold text-gray-600">Active Maintenance</CardTitle>
                <Wrench className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-4xl font-extrabold text-purple-600">{activeMaintenanceCount}</div>
                <p className="text-xs text-muted-foreground mt-1">{activeMaintenanceCount === 1 ? 'Request is currently active' : 'Requests are currently active'}</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <Card className="shadow-lg bg-white/60 backdrop-blur-xl border-gray-200/80">
              <CardHeader>
                <CardTitle>Recent Bill History</CardTitle>
                <CardDescription>A snapshot of your latest bills. Click a row for details.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead className="w-12"></TableHead><TableHead>Period</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {allBills.slice(0, 5).map((bill) => {
                        const combinedBill: CombinedBill = { ...bill, type: (bill as IRentBill).rentForPeriod ? 'Rent' : 'Utility' };
                        return (
                          <motion.tr layout key={bill._id.toString()} onClick={() => setSelectedBill(combinedBill)} className="cursor-pointer" whileHover={{ backgroundColor: 'rgba(100,100,100,0.05)', transition: { duration: 0.2 } }}>
                            <TableCell className="pl-4">{getBillIcon(combinedBill.type)}</TableCell>
                            <TableCell className="font-medium">
                              <div>{combinedBill.type} Bill</div>
                              <div className="text-xs text-muted-foreground">{(bill as IRentBill).rentForPeriod || (bill as IUtilityBill).billingMonthBS}</div>
                            </TableCell>
                            <TableCell className="font-mono text-right">Rs {(bill as IRentBill).amount?.toLocaleString() || (bill as IUtilityBill).totalAmount?.toLocaleString()}</TableCell>
                            <TableCell className="text-right"><StatusBadge status={bill.status} /></TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                    {allBills.length === 0 && <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground"><XCircle className="mx-auto mb-2 h-6 w-6" />No bills found.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
              {allBills.length > 5 && (
                <CardFooter className="p-4">
                  <Button asChild variant="secondary" className="w-full">
                    <Link href="/dashboard/statement">
                      View Full Statement <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="shadow-xl bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:shadow-2xl">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg sm:text-xl font-bold text-gray-800">Recent Maintenance</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">Status of your last 5 requests.</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <AnimatePresence>
                  {maintenanceRequests.slice(0, 5).map((req) => (
                    <motion.div
                      key={req._id.toString()}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      whileHover={{ scale: 1.01 }}
                      className="flex flex-col rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-all duration-200 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="text-sm font-medium text-gray-800">{req.issue}</div>
                      <div className="mt-2 sm:mt-0 sm:text-right">
                        <StatusBadge status={req.status} />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {maintenanceRequests.length === 0 && (
                  <div className="text-center text-muted-foreground py-6">
                    <XCircle className="mx-auto mb-2 h-6 w-6" />
                    <p className="text-sm">No maintenance requests found.</p>
                  </div>
                )}
              </CardContent>

              {maintenanceRequests.length > 5 && (
                <CardFooter className="mt-4 p-0">
                  <Button variant="secondary" className="w-full text-sm sm:text-base">
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