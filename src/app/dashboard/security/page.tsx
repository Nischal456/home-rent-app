'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import NepaliDate from 'nepali-date-converter';
import { toast } from 'react-hot-toast';
import Pusher from 'pusher-js'; // ✅ Import Pusher Client

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Droplets, Wrench, Wallet, PlusCircle, TrendingDown, TrendingUp, ShieldCheck, CheckCircle2, PlayCircle, Calendar } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// ✅ DEFINITIVE DATE FIX: Handles JS Date time + Nepali Date
const formatDateTime = (dateString: string | Date) => {
    const dateObj = new Date(dateString);
    const nepaliDate = new NepaliDate(dateObj).format('YYYY MMMM DD');
    const time = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${nepaliDate}, ${time}`;
};

// Reusable Row Component for Finance
const FinanceRow = ({ record }: { record: any }) => {
    const isAdvance = record.type === 'ADVANCE';
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white rounded-xl border mb-3 gap-2 shadow-sm">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isAdvance ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {isAdvance ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                </div>
                <div>
                    <p className="font-bold text-slate-800">{record.type === 'SALARY' ? `Salary: ${record.month}` : record.type}</p>
                    {/* ✅ Uses fixed date formatter */}
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3"/> {formatDateTime(record.date)}</p>
                    {/* ✅ Shows remarks */}
                    {record.remarks && <p className="text-xs text-slate-600 mt-1 italic border-l-2 border-slate-200 pl-2">"{record.remarks}"</p>}
                </div>
            </div>
            <span className={`font-mono font-bold text-lg ${isAdvance ? 'text-red-600' : 'text-green-600'}`}>
                {isAdvance ? '-' : '+'}Rs {record.amount.toLocaleString()}
            </span>
        </div>
    );
};

export default function SecurityDashboard() {
  const { data: apiData, error, isLoading, mutate } = useSWR('/api/security/dashboard', fetcher);
  const [isWaterDialogOpen, setIsWaterDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waterCost, setWaterCost] = useState('2200');
  const [waterVol, setWaterVol] = useState('7000');

  // ✅ REAL-TIME NOTIFICATIONS: Listen for payments
  useEffect(() => {
      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      });
      const channel = pusher.subscribe('security-channel');
      
      channel.bind('payment-received', (data: any) => {
          toast.success(data.message || "New Payment Received!", { duration: 5000, icon: '💰' });
          mutate(); // Refresh data instantly
      });

      return () => { pusher.unsubscribe('security-channel'); };
  }, [mutate]);

  const handleAddWater = async () => {
      if(!waterCost || !waterVol) return toast.error("Fill all fields");
      setIsSubmitting(true);
      try {
          const res = await fetch('/api/security/dashboard', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cost: Number(waterCost), volumeLiters: Number(waterVol) })
          });
          if(!res.ok) throw new Error("Failed");
          toast.success("Water Tanker Logged!");
          setIsWaterDialogOpen(false);
          mutate();
      } catch (e) { toast.error("Failed to log."); }
      finally { setIsSubmitting(false); }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
      const toastId = toast.loading("Updating...");
      try {
          const res = await fetch(`/api/maintenance/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: newStatus })
          });
          if(!res.ok) throw new Error("Failed");
          toast.success(newStatus === 'COMPLETED' ? "Task Completed!" : "Work Started", { id: toastId });
          mutate(); 
      } catch(e) { toast.error("Update failed", { id: toastId }); }
  };

  if (isLoading) return <div className="p-8 space-y-4"><Skeleton className="h-32 w-full rounded-xl"/><Skeleton className="h-64 w-full rounded-xl"/></div>;

  const { recentWater, finances, activeMaintenance } = apiData?.data || {};

  // Calculate Net Payable locally for display
  let netBalance = 0;
  finances?.forEach((r: any) => netBalance += (r.type === 'ADVANCE' ? -r.amount : r.amount));

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Mobile-First Header */}
      <header className="bg-slate-900 text-white p-6 pb-16 rounded-b-[2rem] shadow-lg">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="text-emerald-400"/> Security</h1>
                <p className="text-slate-400 text-xs">STG Tower Management</p>
            </div>
            <div className="text-right">
                <p className="text-xs text-slate-400">Today</p>
                <p className="font-mono font-medium">{new NepaliDate().format('YYYY MMMM DD')}</p>
            </div>
        </div>
      </header>

      <main className="px-4 -mt-10 space-y-6">
         {/* Net Balance Card */}
         <Card className="border-0 shadow-lg bg-white/90 backdrop-blur">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Net Payable Balance</p>
                    <h3 className={`text-3xl font-bold ${netBalance < 0 ? "text-red-600" : "text-green-600"}`}>
                        Rs {Math.abs(netBalance).toLocaleString()}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">{netBalance < 0 ? "Advance taken exceeds salary." : "Amount due to you."}</p>
                </div>
                <div className="bg-slate-100 p-3 rounded-full"><Wallet className="text-slate-600"/></div>
            </CardContent>
        </Card>

        <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 h-12 bg-white shadow-sm rounded-xl p-1">
                <TabsTrigger value="tasks" className="rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700"><Wrench className="w-4 h-4 mr-2"/> Tasks</TabsTrigger>
                <TabsTrigger value="water" className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"><Droplets className="w-4 h-4 mr-2"/> Water</TabsTrigger>
                <TabsTrigger value="finance" className="rounded-lg data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"><Wallet className="w-4 h-4 mr-2"/> Pay</TabsTrigger>
            </TabsList>

            {/* Tasks Tab */}
            <TabsContent value="tasks">
                 <div className="space-y-3">
                    {(!activeMaintenance || activeMaintenance.length === 0) ? 
                        <div className="text-center py-10 text-slate-400"><CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-400" /><p>No active issues.</p></div> 
                    : activeMaintenance.map((task: any) => (
                        <motion.div layout initial={{opacity:0}} animate={{opacity:1}} key={task._id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-slate-800">{task.issue}</h4>
                                <Badge className={task.status === 'PENDING' ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}>{task.status}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                <Badge variant="outline">{task.roomId?.roomNumber}</Badge><span>{task.tenantId?.fullName}</span>
                            </div>
                            <div className="flex gap-2">
                                {task.status === 'PENDING' && <Button size="sm" className="flex-1 bg-blue-600" onClick={() => handleUpdateStatus(task._id, 'IN_PROGRESS')}><PlayCircle className="w-4 h-4 mr-2"/> Start</Button>}
                                <Button size="sm" className={`flex-1 ${task.status === 'PENDING' ? 'bg-slate-100 text-slate-600' : 'bg-green-600 text-white'}`} onClick={() => handleUpdateStatus(task._id, 'COMPLETED')}><CheckCircle2 className="w-4 h-4 mr-2"/> Done</Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </TabsContent>

            {/* Water Tab */}
            <TabsContent value="water">
                <div className="space-y-4">
                    <Button onClick={() => setIsWaterDialogOpen(true)} className="w-full bg-blue-600 h-12 text-md shadow-md"><PlusCircle className="mr-2"/> Log Water Tanker</Button>
                    <div className="space-y-3">
                        {recentWater?.map((log: any) => (
                            <div key={log._id} className="flex justify-between items-center p-4 bg-white border rounded-xl shadow-sm">
                                <div>
                                    <p className="font-bold text-slate-800">{log.volumeLiters} Liters</p>
                                    <p className="text-xs text-muted-foreground">{formatDateTime(log.entryDate)}</p>
                                </div>
                                <span className="font-mono font-medium text-slate-900">Rs {log.cost.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </TabsContent>

            {/* Finance Tab */}
            <TabsContent value="finance">
                <div className="space-y-3">
                    {finances?.map((record: any) => <FinanceRow key={record._id} record={record} />)}
                </div>
            </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isWaterDialogOpen} onOpenChange={setIsWaterDialogOpen}>
          <DialogContent className="sm:max-w-xs rounded-xl">
              <DialogHeader><DialogTitle>Add Water Tanker</DialogTitle><DialogDescription>Record a new delivery.</DialogDescription></DialogHeader>
              <div className="space-y-4 py-2">
                  <div><label className="text-xs font-bold text-slate-500 uppercase">Cost (Rs)</label><Input type="number" className="mt-1" value={waterCost} onChange={(e) => setWaterCost(e.target.value)} /></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase">Volume (Liters)</label><Input type="number" className="mt-1" value={waterVol} onChange={(e) => setWaterVol(e.target.value)} /></div>
              </div>
              <DialogFooter><Button onClick={handleAddWater} disabled={isSubmitting} className="w-full">{isSubmitting ? <Loader2 className="animate-spin"/> : 'Confirm Entry'}</Button></DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}