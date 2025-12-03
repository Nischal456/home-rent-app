'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from '@/components/ui/badge';
import { Loader2, Wallet, TrendingUp, TrendingDown, UserCheck, Calendar, FileText, PlusCircle, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import NepaliDate from 'nepali-date-converter';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// ✅ HELPER: Accurate Nepali Date & Time Formatter
const formatNepaliDateTime = (dateString: string | Date) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    // Convert to Nepali Date
    const npDate = new NepaliDate(date);
    // Format time in 12-hour format
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${npDate.format('YYYY MMMM DD')}, ${time}`;
};

// --- Transaction Card Component ---
const TransactionCard = ({ record, onClick }: { record: any, onClick: () => void }) => {
    const isAdvance = record.type === 'ADVANCE';
    const isBonus = record.type === 'BONUS';
    
    let icon = <Wallet className="h-5 w-5" />;
    let bgColor = "bg-blue-100 text-blue-600";

    if (isAdvance) {
        icon = <TrendingDown className="h-5 w-5" />;
        bgColor = "bg-red-100 text-red-600";
    } else if (isBonus) {
        icon = <TrendingUp className="h-5 w-5" />;
        bgColor = "bg-green-100 text-green-600";
    }

    return (
        <motion.div 
            layout 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            onClick={onClick}
            className="group flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/50"
        >
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${bgColor} transition-transform group-hover:scale-110`}>
                    {icon}
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 text-base">
                        {record.type === 'SALARY' ? `Salary: ${record.month}` : record.type}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatNepaliDateTime(record.date)}</span>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <span className={`font-mono font-bold text-lg ${isAdvance ? 'text-red-600' : 'text-emerald-600'}`}>
                    {isAdvance ? '-' : '+'}Rs {record.amount.toLocaleString()}
                </span>
                {record.remarks && (
                     <p className="text-xs text-slate-400 mt-1 italic max-w-[150px] truncate">
                        {record.remarks}
                     </p>
                )}
            </div>
        </motion.div>
    );
};

export default function SecurityManagementPage() {
  // ✅ FIX: The API endpoint must be the same one we updated to handle admin logic
  const { data, mutate, isLoading } = useSWR('/api/security/dashboard', fetcher);
  
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null); // For the details popup
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment Form State
  const [payType, setPayType] = useState<'SALARY' | 'BONUS' | 'ADVANCE'>('SALARY');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  const [remarks, setRemarks] = useState('');

  const handlePayment = async () => {
      if (!amount || (payType === 'SALARY' && !month)) return toast.error("Please fill required fields");
      
      setIsSubmitting(true);
      try {
          const res = await fetch('/api/admin/security/pay', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: payType, amount: Number(amount), month, date, remarks })
          });
          
          if (!res.ok) throw new Error("Failed");

          toast.success("Payment Recorded & Guard Notified!");
          setIsPayDialogOpen(false);
          setAmount(''); setRemarks(''); setMonth('');
          mutate(); // Refresh the list
      } catch (e) { toast.error("Failed to record payment."); }
      finally { setIsSubmitting(false); }
  };

  // The API returns data in `data.data`. We extract the finances list.
  const finances = data?.data?.finances || [];
  const netBalance = data?.data?.netBalance || 0;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-800">
                    <UserCheck className="h-8 w-8 text-primary"/> Security Staff Manager
                </h1>
                <p className="text-muted-foreground">Track salary, advances, and payment history.</p>
            </div>
            <Button onClick={() => setIsPayDialogOpen(true)} size="lg" className="shadow-lg bg-primary hover:bg-primary/90">
                <PlusCircle className="mr-2 h-5 w-5"/> Record Payment
            </Button>
        </div>

        {/* Balance Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className={netBalance < 0 ? "border-red-200 bg-red-50/50" : "border-emerald-200 bg-emerald-50/50"}>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Net Payable Balance</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-extrabold ${netBalance < 0 ? "text-red-600" : "text-emerald-600"}`}>
                            Rs {Math.abs(netBalance).toLocaleString()}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                        {netBalance < 0 ? <TrendingDown className="h-4 w-4 text-red-500"/> : <TrendingUp className="h-4 w-4 text-emerald-500"/>}
                        {netBalance < 0 ? "Guard has excess advance." : "Amount due to be paid."}
                    </p>
                </CardContent>
            </Card>
        </div>

        {/* Transactions List */}
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Transaction History</CardTitle>
                    <Badge variant="outline">{finances.length} Records</Badge>
                </div>
                <CardDescription>A complete log of all financial interactions with security staff.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
                {isLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
                ) : finances.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50">
                        <Wallet className="mx-auto h-12 w-12 text-slate-300 mb-3"/>
                        <p className="text-muted-foreground">No payment records found.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {finances.map((record: any) => (
                            <TransactionCard 
                                key={record._id} 
                                record={record} 
                                onClick={() => setSelectedTransaction(record)} 
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>

        {/* --- "Next Level" Details Pop-up --- */}
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
            <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary"/> Transaction Details
                    </DialogTitle>
                </DialogHeader>
                
                {selectedTransaction && (
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-muted-foreground uppercase">Type</p>
                                <Badge variant="outline" className="text-base px-3 py-1">
                                    {selectedTransaction.type}
                                </Badge>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-xs font-bold text-muted-foreground uppercase">Amount</p>
                                <p className="text-2xl font-mono font-bold text-slate-900">
                                    Rs {selectedTransaction.amount.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1 bg-slate-50 p-3 rounded-lg border">
                            <p className="text-xs font-bold text-muted-foreground uppercase">Recorded Date & Time</p>
                            <p className="text-sm font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-slate-500"/>
                                {formatNepaliDateTime(selectedTransaction.date)}
                            </p>
                        </div>

                        {selectedTransaction.type === 'SALARY' && (
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-muted-foreground uppercase">Salary Month</p>
                                <p className="text-sm font-medium text-slate-800">{selectedTransaction.month}</p>
                            </div>
                        )}

                        <div className="space-y-1">
                            <p className="text-xs font-bold text-muted-foreground uppercase">Remarks / Notes</p>
                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border italic">
                                {selectedTransaction.remarks || "No remarks provided."}
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button onClick={() => setSelectedTransaction(null)} className="w-full">Close Details</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* --- Record Payment Form Dialog --- */}
        <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
            <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle>Record Staff Transaction</DialogTitle>
                    <DialogDescription>This will be logged and the guard will be notified.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Transaction Type</label>
                        <Select value={payType} onValueChange={(v: any) => setPayType(v)}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SALARY">Monthly Salary</SelectItem>
                                <SelectItem value="BONUS">Bonus / Incentive</SelectItem>
                                <SelectItem value="ADVANCE">Advance Given</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Amount (Rs)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rs</span>
                                <Input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="pl-9" placeholder="0"/>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Date</label>
                            <Input type="date" value={date} onChange={e=>setDate(e.target.value)} />
                        </div>
                    </div>

                    {payType === 'SALARY' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Salary Month</label>
                            <Input value={month} onChange={e=>setMonth(e.target.value)} placeholder="e.g. Bhadra 2082"/>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Remarks / Notes</label>
                        <Textarea value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="Optional notes..." className="resize-none"/>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handlePayment} disabled={isSubmitting} className="w-full shadow-lg">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Confirm Record'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}