'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Loader2, Wrench, CalendarDays, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { IRentBill, IUtilityBill, IUser } from '@/types';
import { IMaintenanceRequest } from '@/models/MaintenanceRequest';
import { RequestMaintenanceForm } from './request-maintenance-form';
import { motion } from 'framer-motion';
import NepaliDate from 'nepali-date-converter';

const getStatusBadge = (status: 'DUE' | 'PAID' | 'OVERDUE' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    const variants = {
        PAID: "bg-green-100 text-green-800 border-green-200",
        COMPLETED: "bg-green-100 text-green-800 border-green-200",
        DUE: "bg-yellow-100 text-yellow-800 border-yellow-200",
        PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
        OVERDUE: "bg-red-100 text-red-800 border-red-200",
        IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return <Badge variant="outline" className={variants[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
};

export function TenantDashboard() {
  const [user, setUser] = useState<IUser | null>(null);
  const [rentBills, setRentBills] = useState<IRentBill[]>([]);
  const [utilityBills, setUtilityBills] = useState<IUtilityBill[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<IMaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMaintDialogOpen, setMaintDialogOpen] = useState(false);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, rentRes, utilityRes, maintRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/my-bills/rent'),
        fetch('/api/my-bills/utility'),
        fetch('/api/my-maintenance'),
      ]);
      const userData = await userRes.json();
      const rentData = await rentRes.json();
      const utilityData = await utilityRes.json();
      const maintData = await maintRes.json();

      if (userData.success) setUser(userData.user);
      if (rentData.success) setRentBills(rentData.data);
      if (utilityData.success) setUtilityBills(utilityData.data);
      if (maintData.success) setMaintenanceRequests(maintData.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);
  
  const totalDue = rentBills.filter(b => b.status === 'DUE').reduce((acc, bill) => acc + bill.amount, 0)
                 + utilityBills.filter(b => b.status === 'DUE').reduce((acc, bill) => acc + bill.totalAmount, 0);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
  };

  if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <motion.div variants={cardVariants} initial="hidden" animate="visible" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <motion.div variants={cardVariants}>
          <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Amount Due</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
              <CardContent><div className="text-3xl font-bold">Rs {totalDue.toLocaleString('en-IN')}</div><p className="text-xs text-muted-foreground">Across all unpaid bills</p></CardContent>
          </Card>
        </motion.div>
        <motion.div variants={cardVariants}>
          <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Lease Information</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p><strong>Start:</strong> {user?.leaseStartDate ? new NepaliDate(user.leaseStartDate).format('YYYY-MM-DD') : 'N/A'}</p>
                  <p><strong>End:</strong> {user?.leaseEndDate ? new NepaliDate(user.leaseEndDate).format('YYYY-MM-DD') : 'N/A'}</p>
                </div>
              </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={cardVariants}>
          <Dialog open={isMaintDialogOpen} onOpenChange={setMaintDialogOpen}>
              <DialogTrigger asChild>
                  <Button size="lg" className="w-full h-full text-lg shadow-lg hover:shadow-xl transition-shadow"><Wrench className="mr-2 h-5 w-5"/> Request Maintenance</Button>
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
          <CardContent><Table><TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Period/Month</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>
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
          <CardContent><Table><TableHeader><TableRow><TableHead>Issue</TableHead><TableHead>Submitted</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{maintenanceRequests.length > 0 ? maintenanceRequests.map(req => (<TableRow key={req._id}><TableCell className="font-medium">{req.issue}</TableCell><TableCell>{new NepaliDate(req.createdAt).format('YYYY-MM-DD')}</TableCell><TableCell>{getStatusBadge(req.status)}</TableCell></TableRow>)) : <TableRow><TableCell colSpan={3} className="text-center h-24">No maintenance requests found.</TableCell></TableRow>}</TableBody></Table></CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
