'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Loader2, Wrench, FileText, CreditCard, Hourglass } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { IRentBill, IUtilityBill, IUser, IMaintenanceRequest, IRoom, IPayment } from '@/types'; // <-- Correct import
import { RequestMaintenanceForm } from './request-maintenance-form';
import { PaymentDialog } from './payment-dialog';
import { motion } from 'framer-motion';
import NepaliDate from 'nepali-date-converter';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/authFetch';
import { toast } from 'react-hot-toast';

const getStatusBadge = (status: 'DUE' | 'PAID' | 'OVERDUE' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    const variants = {
        PAID: "bg-green-100 text-green-800 border-green-200",
        COMPLETED: "bg-green-100 text-green-800 border-green-200",
        DUE: "bg-yellow-100 text-yellow-800 border-yellow-200",
        PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
        OVERDUE: "bg-red-100 text-red-800 border-red-200",
        IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
    };
    const formattedStatus = status.replace('_', ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
    return <Badge variant="outline" className={`capitalize ${variants[status] || "bg-gray-100 text-gray-800"}`}>{formattedStatus}</Badge>;
};

export function TenantDashboard() {
  const { token } = useAuth();
  const [user, setUser] = useState<IUser | null>(null);
  const [rentBills, setRentBills] = useState<IRentBill[]>([]);
  const [utilityBills, setUtilityBills] = useState<IUtilityBill[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<IMaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMaintDialogOpen, setMaintDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<IPayment | null>(null);

  const fetchAllData = useCallback(async (isInitialLoad = false) => {
    if (!token) {
        if (isInitialLoad) setLoading(false);
        return;
    }
    if (isInitialLoad) setLoading(true);
    try {
      const [userData, rentData, utilityData, maintData, pendingPaymentData] = await Promise.all([
        authFetch('/api/auth/me', token),
        authFetch('/api/my-bills/rent', token),
        authFetch('/api/my-bills/utility', token),
        authFetch('/api/my-maintenance', token),
        authFetch('/api/my-pending-payment', token),
      ]);

      if (userData.success) setUser(userData.user);
      if (rentData.success) setRentBills(rentData.data);
      if (utilityData.success) setUtilityBills(utilityData.data);
      if (maintData.success) setMaintenanceRequests(maintData.data);
      if (pendingPaymentData.success) setPendingPayment(pendingPaymentData.pendingPayment);
    } catch (error: any) {
      console.error("Failed to fetch dashboard data", error);
      toast.error(error.message);
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAllData(true);
    const interval = setInterval(() => fetchAllData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);
  
  const rentBillsDue = rentBills.filter(b => b.status === 'DUE');
  const utilityBillsDue = utilityBills.filter(b => b.status === 'DUE');
  const totalDue = rentBillsDue.reduce((acc, bill) => acc + bill.amount, 0) + utilityBillsDue.reduce((acc, bill) => acc + bill.totalAmount, 0);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
  };

  if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const roomInfo = user?.roomId as IRoom | undefined;

  return (
    <>
      <div className="space-y-8">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <motion.div variants={cardVariants}>
            <Card className="hover:shadow-lg transition-shadow h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Amount Due</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">Rs {pendingPayment ? pendingPayment.amount.toLocaleString('en-IN') : totalDue.toLocaleString('en-IN')}</div>
                    {pendingPayment ? (
                        <div className="flex items-center text-xs text-orange-600 font-semibold mt-2">
                            <Hourglass className="mr-2 h-4 w-4" />
                            Payment Pending Verification
                        </div>
                    ) : totalDue > 0 ? (
                        <Button size="sm" className="mt-2" onClick={() => setPaymentDialogOpen(true)}><CreditCard className="mr-2 h-4 w-4"/> Pay Now</Button>
                    ) : (
                        <p className="text-xs text-green-600 font-semibold mt-2">All bills are paid. Thank you!</p>
                    )}
                </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={cardVariants}>
            <Card className="hover:shadow-lg transition-shadow h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">My Room & Lease</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <p><strong>Room:</strong> {roomInfo?.roomNumber || 'N/A'}</p>
                    <p><strong>Monthly Rent:</strong> <span className="font-semibold">Rs {roomInfo?.rentAmount.toLocaleString('en-IN') || 'N/A'}</span></p>
                    <p><strong>Lease End:</strong> {user?.leaseEndDate ? new NepaliDate(user.leaseEndDate).format('YYYY-MM-DD') : 'N/A'}</p>
                  </div>
                </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={cardVariants}>
            <Dialog open={isMaintDialogOpen} onOpenChange={setMaintDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="lg" className="w-full h-full text-lg shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-orange-500 to-red-500 text-white"><Wrench className="mr-2 h-5 w-5"/> Request Maintenance</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>New Maintenance Request</DialogTitle><DialogDescription>Describe the issue you're facing in your room.</DialogDescription></DialogHeader>
                    <RequestMaintenanceForm onSuccess={() => { setMaintDialogOpen(false); fetchAllData(); }} />
                </DialogContent>
            </Dialog>
          </motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader><CardTitle>My Bills</CardTitle><CardDescription>A combined history of your rent and utility bills.</CardDescription></CardHeader>
            <CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Period/Month</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>
              {[...rentBills, ...utilityBills].sort((a, b) => new Date(b.billDateAD).getTime() - new Date(a.billDateAD).getTime()).map(bill => (
                  <TableRow key={bill._id}>
                    <TableCell><Badge variant="secondary">{(bill as IRentBill).rentForPeriod ? 'Rent' : 'Utility'}</Badge></TableCell>
                    <TableCell>{(bill as IRentBill).rentForPeriod || (bill as IUtilityBill).billingMonthBS}</TableCell>
                    <TableCell>Rs {(bill as IRentBill).amount?.toLocaleString() || (bill as IUtilityBill).totalAmount?.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(bill.status)}</TableCell>
                  </TableRow>
              ))}
            </TableBody></Table></CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader><CardTitle>My Maintenance Requests</CardTitle><CardDescription>Track the status of your submitted requests.</CardDescription></CardHeader>
            <CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Issue</TableHead><TableHead>Submitted</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{maintenanceRequests.length > 0 ? maintenanceRequests.map(req => (<TableRow key={req._id}><TableCell className="font-medium">{req.issue}</TableCell><TableCell>{new NepaliDate(req.createdAt).format('YYYY-MM-DD')}</TableCell><TableCell>{getStatusBadge(req.status)}</TableCell></TableRow>)) : <TableRow><TableCell colSpan={3} className="text-center h-24">No maintenance requests found.</TableCell></TableRow>}</TableBody></Table></CardContent>
          </Card>
        </motion.div>
      </div>
      <PaymentDialog 
        isOpen={isPaymentDialogOpen} 
        onClose={() => { setPaymentDialogOpen(false); fetchAllData(); }} 
        totalDue={totalDue}
        rentBillsDue={rentBillsDue}
        utilityBillsDue={utilityBillsDue}
      />
    </>
  );
}
