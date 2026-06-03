'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import NepaliDate from 'nepali-date-converter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Droplets, TrendingDown, AlertCircle, User, Calendar, Banknote, Trash2, 
  Plus, CheckCircle, Clock, ChevronDown, ChevronUp, FileSpreadsheet, Printer, 
  Upload, Sparkles, Receipt, FileDown, Wallet, ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { NepaliDatePicker } from 'nepali-datepicker-reactjs';
import 'nepali-datepicker-reactjs/dist/index.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const getGregorianDateString = (nepaliDateStr: string) => {
  try {
    if (!nepaliDateStr) return '';
    const adDate = new NepaliDate(nepaliDateStr).toJsDate();
    return adDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
  } catch (e) {
    return 'Invalid Date';
  }
};

// --- Helper Component for Stat Cards ---
const StatCard = ({ title, value, icon, color, subtext, gradient }: any) => (
  <Card className={`relative overflow-hidden bg-white rounded-[2rem] border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300 hover:shadow-lg`}>
    <div className={`absolute top-0 left-0 w-1.5 h-full ${gradient}`} />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">{title}</CardTitle>
      <div className={`p-2.5 rounded-2xl ${color} shadow-inner`}>{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-black text-slate-900 tracking-tight">{value}</div>
      {subtext && <p className="text-xs font-bold text-slate-400 mt-2 flex items-center gap-1">{subtext}</p>}
    </CardContent>
  </Card>
);

export default function AdminWaterTankerPage() {
  const { data: response, error, isLoading, mutate } = useSWR('/api/admin/water-tankers', fetcher);
  const tankers = response?.data || [];

  // Modals & States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedTanker, setSelectedTanker] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  // Forms
  const [addForm, setAddForm] = useState({
    entryDateBS: new NepaliDate().format('YYYY-MM-DD'),
    vendor: '',
    volumeLiters: '',
    cost: '',
    remarks: ''
  });

  const [payForm, setPayForm] = useState({
    payDateBS: new NepaliDate().format('YYYY-MM-DD'),
    amount: '',
    remarks: '',
    receipt: '',
    method: 'CASH'
  });

  // Base64 File Uploader
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPayForm(prev => ({ ...prev, receipt: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTanker = async () => {
    if (!addForm.vendor || !addForm.cost) {
      return toast.error("Supplier name and Total Bill Cost are required.");
    }

    setIsSubmitting(true);
    try {
      // Convert Nepali BS Date to Gregorian date for storage
      const dateAD = new NepaliDate(addForm.entryDateBS).toJsDate();

      const res = await fetch('/api/admin/water-tankers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryDate: dateAD,
          vendor: addForm.vendor,
          volumeLiters: Number(addForm.volumeLiters || 0),
          cost: Number(addForm.cost),
          remarks: addForm.remarks
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Water tanker log successfully recorded!", { icon: '🌊' });
      setIsAddOpen(false);
      setAddForm({
        entryDateBS: new NepaliDate().format('YYYY-MM-DD'),
        vendor: '',
        volumeLiters: '',
        cost: '',
        remarks: ''
      });
      mutate();
    } catch (e: any) {
      toast.error(e.message || "Failed to log water tanker");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogPayment = async () => {
    if (!selectedTanker || !payForm.amount) {
      return toast.error("Payment amount is required.");
    }

    const currentDue = selectedTanker.remainingAmount ?? (selectedTanker.cost - (selectedTanker.paidAmount || 0));
    if (Number(payForm.amount) > currentDue) {
      return toast.error(`Payment cannot exceed the remaining due amount of Rs ${currentDue.toLocaleString()}`);
    }

    setIsSubmitting(true);
    try {
      const dateAD = new NepaliDate(payForm.payDateBS).toJsDate();

      const res = await fetch(`/api/admin/water-tankers/${selectedTanker._id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(payForm.amount),
          date: dateAD,
          remarks: payForm.remarks,
          receipt: payForm.receipt,
          method: payForm.method
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Installment payment recorded successfully!", { icon: '💰' });
      setIsPayOpen(false);
      setPayForm({
        payDateBS: new NepaliDate().format('YYYY-MM-DD'),
        amount: '',
        remarks: '',
        receipt: '',
        method: 'CASH'
      });
      setSelectedTanker(null);
      mutate();
    } catch (e: any) {
      toast.error(e.message || "Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this water log?")) return;
    try {
      const res = await fetch(`/api/admin/water-tankers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete log");
      toast.success("Water log permanently deleted");
      mutate();
    } catch (e: any) {
      toast.error(e.message || "Deletion failed");
    }
  };

  // --- STATS CALCULATIONS ---
  const { totalCost, totalPaid, totalOutstanding, pendingCount } = useMemo(() => {
    return tankers.reduce((acc: any, t: any) => {
      acc.totalCost += t.cost;
      acc.totalPaid += t.paidAmount || 0;
      acc.totalOutstanding += t.remainingAmount ?? (t.cost - (t.paidAmount || 0));
      if (t.status === 'UNPAID' || t.status === 'PARTIALLY_PAID') {
        acc.pendingCount += 1;
      }
      return acc;
    }, { totalCost: 0, totalPaid: 0, totalOutstanding: 0, pendingCount: 0 });
  }, [tankers]);

  // --- FILTERS & SEARCH ---
  const filteredTankers = useMemo(() => {
    return tankers.filter((t: any) => {
      const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
      const matchesSearch = 
        t.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.remarks?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [tankers, filterStatus, searchQuery]);

  // --- REPORT EXPORTS ---
  const exportToCSV = () => {
    const headers = ["Water Tanker #", "Date", "Vendor", "Quantity (Liters)", "Total Bill (Rs)", "Paid (Rs)", "Remaining Due (Rs)", "Status", "Remarks"];
    const rows = tankers.map((t: any, idx: number) => [
      `WT-${String(idx + 1).padStart(3, '0')}`,
      new NepaliDate(new Date(t.entryDate)).format('YYYY-MM-DD'),
      t.vendor || 'N/A',
      t.volumeLiters || 0,
      t.cost,
      t.paidAmount || 0,
      t.remainingAmount || 0,
      t.status,
      t.remarks || ''
    ]);
    const csvContent = [headers, ...rows].map(row => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `water_tanker_expense_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel report exported successfully!", { icon: '📊' });
  };

  const printReport = () => {
    window.print();
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'PAID': return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case 'PARTIALLY_PAID': return "bg-blue-50 text-blue-700 border-blue-200 animate-pulse";
      case 'OVERPAID': return "bg-purple-50 text-purple-700 border-purple-200";
      default: return "bg-red-50 text-red-700 border-red-200";
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32 rounded-[2rem]"/>
          <Skeleton className="h-32 rounded-[2rem]"/>
          <Skeleton className="h-32 rounded-[2rem]"/>
          <Skeleton className="h-32 rounded-[2rem]"/>
        </div>
        <Skeleton className="h-[500px] w-full rounded-[2.5rem]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <Alert variant="destructive" className="bg-white rounded-3xl shadow-xl border-0 p-6">
          <AlertCircle className="h-6 w-6 text-red-500"/>
          <AlertTitle className="text-lg font-bold mt-2">Error Loading Water Records</AlertTitle>
          <AlertDescription className="text-slate-500 mt-2">Failed to fetch the billing logs.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-8 space-y-8 bg-[#f8fafc] min-h-screen pb-32 print:bg-white print:p-0">
      
      {/* Header (Hidden on Print) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/60 p-6 md:p-8 rounded-[2rem] border border-white/60 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-[1.5rem] shadow-inner"><Droplets className="h-8 w-8" /></div>
          <div>
              <h1 className="text-3xl font-black text-[#0B2863] tracking-tight">Water Tanker Expense & Payments</h1>
              <p className="text-slate-500 font-medium mt-1">Manage utility logs, process dynamic payments, and monitor cash balances.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <Button onClick={exportToCSV} variant="outline" className="flex-1 md:flex-none rounded-xl border-slate-200 font-bold hover:bg-slate-50 h-12">
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> Export Excel
          </Button>
          <Button onClick={printReport} variant="outline" className="flex-1 md:flex-none rounded-xl border-slate-200 font-bold hover:bg-slate-50 h-12">
            <Printer className="mr-2 h-4 w-4 text-slate-500" /> Print PDF
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="w-full md:w-auto shadow-lg shadow-blue-500/20 bg-[#0B2863] hover:bg-blue-800 text-white font-bold rounded-xl h-12 px-6">
            <Plus className="mr-1.5 h-5 w-5" /> Order Tanker
          </Button>
        </div>
      </div>

      {/* Printable Report Header (Only visible on Print) */}
      <div className="hidden print:block mb-8 space-y-4">
        <h1 className="text-3xl font-black text-[#0B2863]">STG Tower - Water Tanker Financial Statement</h1>
        <p className="text-sm font-semibold text-slate-500">Generated on {new NepaliDate().format('YYYY MMMM DD')} (AD {new Date().toLocaleDateString()})</p>
        <div className="grid grid-cols-3 border-y border-slate-100 py-4">
          <div><span className="text-xs uppercase font-extrabold text-slate-400">Total Expenses:</span> <p className="text-xl font-bold text-slate-800">Rs {totalCost.toLocaleString()}</p></div>
          <div><span className="text-xs uppercase font-extrabold text-slate-400">Total Paid Amount:</span> <p className="text-xl font-bold text-slate-800">Rs {totalPaid.toLocaleString()}</p></div>
          <div><span className="text-xs uppercase font-extrabold text-slate-400">Outstanding Due:</span> <p className="text-xl font-bold text-red-600">Rs {totalOutstanding.toLocaleString()}</p></div>
        </div>
      </div>

      {/* Stats Summary Cards (Hidden on Print) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
        <StatCard 
            title="Total Water Expenses" 
            value={`Rs ${totalCost.toLocaleString()}`} 
            icon={<Banknote className="h-5 w-5 text-blue-600"/>} 
            color="bg-blue-50"
            gradient="bg-blue-500"
            subtext="All logged supplies"
        />
        <StatCard 
            title="Total Paid" 
            value={`Rs ${totalPaid.toLocaleString()}`} 
            icon={<Wallet className="h-5 w-5 text-emerald-600"/>} 
            color="bg-emerald-50"
            gradient="bg-emerald-500"
            subtext="Disbursed installments"
        />
        <StatCard 
            title="Total Outstanding Due" 
            value={`Rs ${totalOutstanding.toLocaleString()}`} 
            icon={<TrendingDown className="h-5 w-5 text-red-600"/>} 
            color="bg-red-50"
            gradient="bg-red-500"
            subtext="Remaining unpaid balance"
        />
        <StatCard 
            title="Unpaid/Pending Bills" 
            value={`${pendingCount} Logs`} 
            icon={<AlertCircle className="h-5 w-5 text-amber-600"/>} 
            color="bg-amber-50"
            gradient="bg-amber-500"
            subtext="Requires payment"
        />
      </div>

      {/* Action Filters Panel (Hidden on Print) */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/60 p-4 rounded-[2rem] border border-white/60 shadow-sm print:hidden">
        {/* Status Filters Tabs */}
        <div className="flex overflow-x-auto gap-2 w-full md:w-auto p-1 bg-slate-100 rounded-2xl border border-slate-200">
          {['ALL', 'UNPAID', 'PARTIALLY_PAID', 'PAID'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "px-4 py-2 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap focus:outline-none",
                filterStatus === status 
                  ? "bg-white text-[#0B2863] shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="w-full md:w-80">
          <Input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by supplier or notes..." 
            className="rounded-xl h-11 border-slate-200 font-medium bg-white focus-visible:ring-[#0B2863] text-sm"
          />
        </div>
      </div>

      {/* Records Listing */}
      <div className="space-y-6">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 px-1">
          <Sparkles className="w-5 h-5 text-blue-500"/> Billing Records ({filteredTankers.length})
        </h2>

        {filteredTankers.length === 0 ? (
          <Card className="rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white py-16 text-center">
            <Droplets className="mx-auto h-16 w-16 text-slate-200 mb-4" />
            <h3 className="text-lg font-black text-slate-700">No Water Records Found</h3>
            <p className="text-slate-400 font-semibold text-sm mt-1">Try adjusting your filters or search query.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredTankers.map((t: any, index: number) => {
              const remaining = t.remainingAmount ?? (t.cost - (t.paidAmount || 0));
              const percent = Math.min(100, Math.round(((t.paidAmount || 0) / t.cost) * 100)) || 0;
              const isExpanded = expandedId === t._id;
              
              return (
                <motion.div 
                  layout 
                  key={t._id} 
                  className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_35px_rgb(0,0,0,0.02)] overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-200/60 print:border print:shadow-none print:break-inside-avoid print:mb-6"
                >
                  {/* Card Main Block */}
                  <div className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    
                    {/* Tanker Details */}
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-lg font-black text-[#0B2863]">Water Tanker #WT-{String(index + 1).padStart(3, '0')}</span>
                        <Badge variant="outline" className={cn("font-extrabold text-[10px] tracking-wide rounded-full px-2.5 py-0.5", getStatusBadgeStyle(t.status))}>
                          {t.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-4 text-xs font-bold text-slate-500">
                        <div className="flex items-center gap-2 flex-wrap col-span-1 md:col-span-2">
                          <Calendar className="h-4 w-4 text-slate-400 shrink-0"/>
                          <span className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-500 font-bold">Ordered:</span>
                            <span className="bg-[#0b2863]/5 text-[#0b2863] px-2 py-0.5 rounded font-black">B.S. {new NepaliDate(new Date(t.entryDate)).format('YYYY MMMM DD')}</span>
                            <span className="text-slate-300">/</span>
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">A.D. {new Date(t.entryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 truncate">
                          <User className="h-4 w-4 text-slate-400 shrink-0"/>
                          <span className="truncate">Supplier: {t.vendor || 'N/A'}</span>
                        </div>
                        {t.volumeLiters > 0 && (
                          <div className="flex items-center gap-2 truncate col-span-2 md:col-span-1">
                            <Droplets className="h-4 w-4 text-slate-400 shrink-0"/>
                            <span>Capacity: {t.volumeLiters.toLocaleString()} Liters</span>
                          </div>
                        )}
                      </div>

                      {t.remarks && (
                        <p className="text-xs font-medium text-slate-500 italic bg-slate-50 p-3 rounded-2xl border border-slate-100/50 max-w-2xl print:bg-white print:border-0 print:p-0">
                          Note: {t.remarks}
                        </p>
                      )}
                    </div>

                    {/* Progress Bar & Balances */}
                    <div className="flex flex-col sm:flex-row lg:flex-col justify-between gap-6 shrink-0 lg:w-72">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-extrabold text-slate-500 uppercase tracking-wide">
                          <span>Progress Paid</span>
                          <span>{percent}%</span>
                        </div>
                        {/* Progress Visualizer Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner relative">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${percent}%` }} 
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-1">
                          <span>Paid: Rs {t.paidAmount?.toLocaleString() || 0}</span>
                          <span>Bill: Rs {t.cost.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Remaining Due Callout */}
                      <div className="bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl text-center flex-1 sm:max-w-[200px] lg:max-w-none print:bg-white print:border-0 print:p-0 print:text-right">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Remaining Due</span>
                        <span className={cn("text-xl font-black block mt-0.5", remaining > 0 ? "text-red-500" : "text-emerald-500")}>
                          Rs {remaining.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Panel (Hidden on Print) */}
                    <div className="flex items-center gap-2 border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0 justify-end shrink-0 print:hidden">
                      <Button 
                        onClick={() => { setSelectedTanker(t); setIsPayOpen(true); }}
                        disabled={t.status === 'PAID'}
                        className="bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100 h-10 px-4 rounded-xl font-bold text-xs"
                      >
                        <Banknote className="mr-1.5 h-4 w-4" /> Log Pay
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedId(isExpanded ? null : t._id)}
                        className="h-10 w-10 text-slate-400 hover:text-slate-600 rounded-xl"
                      >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(t._id)} 
                        className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Expandable Installment Payment History Detail block */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden bg-[#fafbfc] border-t border-slate-100 print:bg-white print:height-auto print:overflow-visible"
                      >
                        <div className="p-6 md:p-8 space-y-6">
                          <h3 className="text-sm font-extrabold text-[#0B2863] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                            <Receipt className="w-4 h-4 text-emerald-600" /> Installment Timeline
                          </h3>
                          
                          {(!t.paymentHistory || t.paymentHistory.length === 0) ? (
                            <p className="text-sm font-bold text-slate-400 italic text-center py-6">No payments logged for this tanker yet.</p>
                          ) : (
                            <div className="relative border-l border-slate-200 ml-3.5 space-y-6">
                              {t.paymentHistory.map((pay: any, idx: number) => (
                                <div key={pay._id || idx} className="relative pl-6">
                                  {/* Dot */}
                                  <span className="absolute left-[-5px] top-1.5 flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                                  
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm max-w-3xl">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-extrabold text-slate-800">Rs {pay.amount.toLocaleString()}</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Installment #{idx + 1}</span>
                                        {pay.method && (
                                          <span className={cn(
                                            "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1",
                                            pay.method === 'CASH' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                            pay.method === 'BANK_TRANSFER' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                            pay.method === 'ESEWA' ? "bg-lime-50 text-lime-700 border-lime-100" :
                                            pay.method === 'KHALTI' ? "bg-purple-50 text-purple-700 border-purple-100" :
                                            "bg-slate-50 text-slate-600 border-slate-100"
                                          )}>
                                            {pay.method === 'CASH' ? '💵 Cash' :
                                             pay.method === 'BANK_TRANSFER' ? '🏦 Bank' :
                                             pay.method === 'ESEWA' ? '🟢 eSewa' :
                                             pay.method === 'KHALTI' ? '🟣 Khalti' :
                                             '💳 Other'}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 flex-wrap">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold text-[10px]">B.S. {new NepaliDate(new Date(pay.date)).format('YYYY MMMM DD')}</span>
                                        <span className="text-slate-300">/</span>
                                        <span className="bg-blue-50 px-2 py-0.5 rounded text-blue-700 font-bold text-[10px]">A.D. {new Date(pay.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}</span>
                                      </p>
                                      {pay.remarks && <p className="text-xs text-slate-500 italic mt-1 font-medium bg-slate-50 p-2 rounded-xl border border-slate-100/50 inline-block">"{pay.remarks}"</p>}
                                    </div>

                                    {/* Action items like receipt downloads */}
                                    {pay.receipt && (
                                      <Button 
                                        onClick={() => setSelectedReceipt(pay.receipt)}
                                        variant="outline" 
                                        size="sm" 
                                        className="self-start sm:self-center h-8 rounded-lg border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 print:hidden"
                                      >
                                        <FileDown className="w-3.5 h-3.5 mr-1" /> View Receipt
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODALS */}

      {/* 1. Add Water Tanker Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-0 shadow-2xl bg-white z-[9999] max-h-[90vh] overflow-y-auto">
          <div className="bg-[#0B2863] p-6 text-white relative">
            <DialogTitle className="text-2xl font-black mb-1 flex items-center gap-2"><Droplets className="h-6 w-6"/> Record Water Tanker</DialogTitle>
            <DialogDescription className="text-blue-200 font-medium text-sm">Log supply parameters and auto-dispatch expense ledgers.</DialogDescription>
          </div>
          <div className="p-6 space-y-5 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 flex flex-col">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                  <span>Tanker Date (B.S.)</span>
                  {addForm.entryDateBS && (
                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                      AD: {getGregorianDateString(addForm.entryDateBS)}
                    </span>
                  )}
                </label>
                <div className="h-12 w-full border border-slate-200 rounded-xl bg-white flex items-center focus-within:ring-2 focus-within:ring-[#0B2863] transition-all relative z-[100]">
                  <NepaliDatePicker
                    inputClassName="w-full h-full px-3 py-2 bg-transparent border-0 outline-none font-bold text-sm text-slate-700 cursor-pointer"
                    value={addForm.entryDateBS}
                    onChange={(value: string) => setAddForm(prev => ({ ...prev, entryDateBS: value }))}
                    options={{ calenderLocale: 'en', valueLocale: 'en' }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Liters (Capacity)</label>
                <Input 
                  type="number" 
                  placeholder="e.g. 10000" 
                  value={addForm.volumeLiters} 
                  onChange={e => setAddForm(prev => ({ ...prev, volumeLiters: e.target.value }))}
                  className="h-12 rounded-xl font-bold bg-slate-50 border-transparent focus-visible:border-slate-300 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Supplier/Vendor Name</label>
              <Input 
                placeholder="e.g. ABC Water Supply" 
                value={addForm.vendor} 
                onChange={e => setAddForm(prev => ({ ...prev, vendor: e.target.value }))}
                className="h-12 rounded-xl font-bold bg-slate-50 border-transparent focus-visible:border-slate-300 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Bill Cost (Rs)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">Rs</span>
                <Input 
                  type="number" 
                  placeholder="e.g. 8000" 
                  value={addForm.cost} 
                  onChange={e => setAddForm(prev => ({ ...prev, cost: e.target.value }))}
                  className="h-12 rounded-xl font-black text-sm pl-10 bg-slate-50 border-transparent focus-visible:border-slate-300 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Notes / Remarks</label>
              <Textarea 
                placeholder="Extra notes..." 
                value={addForm.remarks} 
                onChange={e => setAddForm(prev => ({ ...prev, remarks: e.target.value }))}
                className="resize-none rounded-xl font-medium bg-slate-50 border-transparent focus-visible:border-slate-300 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              />
            </div>
          </div>
          <div className="p-6 pt-0 bg-white">
            <Button onClick={handleAddTanker} disabled={isSubmitting} className="w-full h-14 rounded-xl font-black text-lg bg-[#0B2863] text-white hover:bg-blue-800 shadow-md">
              {isSubmitting ? 'Recording...' : 'Record Tanker Order'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Log Payment Installment Dialog */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-0 shadow-2xl bg-white z-[9999] max-h-[90vh] overflow-y-auto">
          <div className="bg-emerald-600 p-6 text-white relative">
            <DialogTitle className="text-2xl font-black mb-1 flex items-center gap-2"><Banknote className="h-6 w-6"/> Disburse Payment</DialogTitle>
            <DialogDescription className="text-emerald-100 font-medium text-sm">Disburse installment payment for <span className="font-bold text-white">{selectedTanker?.vendor}</span>.</DialogDescription>
          </div>
          <div className="p-6 space-y-5 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 flex flex-col">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                  <span>Payment Date (B.S.)</span>
                  {payForm.payDateBS && (
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      AD: {getGregorianDateString(payForm.payDateBS)}
                    </span>
                  )}
                </label>
                <div className="h-12 w-full border border-slate-200 rounded-xl bg-white flex items-center focus-within:ring-2 focus-within:ring-emerald-500 transition-all relative z-[100]">
                  <NepaliDatePicker
                    inputClassName="w-full h-full px-3 py-2 bg-transparent border-0 outline-none font-bold text-sm text-slate-700 cursor-pointer"
                    value={payForm.payDateBS}
                    onChange={(value: string) => setPayForm(prev => ({ ...prev, payDateBS: value }))}
                    options={{ calenderLocale: 'en', valueLocale: 'en' }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Amount Paid (Rs)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">Rs</span>
                  <Input 
                    type="number" 
                    placeholder="e.g. 5000" 
                    value={payForm.amount} 
                    onChange={e => setPayForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="h-12 rounded-xl font-black text-sm pl-10 bg-slate-50 border-transparent focus-visible:border-emerald-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Payment Method</label>
              <div className="relative">
                <select
                  value={payForm.method}
                  onChange={e => setPayForm(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full h-12 px-3.5 rounded-xl font-bold bg-slate-50 border-transparent focus:border-slate-300 focus:ring-0 text-sm outline-none cursor-pointer text-slate-700"
                >
                  <option value="CASH">💵 Cash Payment</option>
                  <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                  <option value="ESEWA">🟢 eSewa Mobile Wallet</option>
                  <option value="KHALTI">🟣 Khalti Mobile Wallet</option>
                  <option value="OTHER">💳 Other Method</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Upload Receipt / Invoice</label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Upload className="w-5 h-5 text-slate-400 shrink-0"/>
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="text-xs font-bold text-slate-500 w-full cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-extrabold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
                />
              </div>
              {payForm.receipt && <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5"/> Document successfully loaded.</span>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Notes / Remarks</label>
              <Input 
                placeholder="Optional notes..." 
                value={payForm.remarks} 
                onChange={e => setPayForm(prev => ({ ...prev, remarks: e.target.value }))}
                className="h-12 rounded-xl font-bold bg-slate-50 border-transparent focus-visible:border-emerald-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              />
            </div>
          </div>
          <div className="p-6 pt-0 bg-white">
            <Button onClick={handleLogPayment} disabled={isSubmitting} className="w-full h-14 rounded-xl font-black text-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-md">
              {isSubmitting ? 'Recording...' : 'Disburse Installment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. Image/Receipt Viewer Dialog */}
      <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
        <DialogContent className="sm:max-w-xl rounded-[2rem] p-6 bg-white z-[99999] overflow-hidden flex flex-col max-h-[85vh]">
          <DialogHeader className="mb-2">
            <DialogTitle className="font-extrabold text-lg flex items-center gap-2"><Receipt className="h-5 w-5 text-blue-600"/> Payment Invoice/Receipt</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 border rounded-2xl p-2 relative min-h-[300px]">
            {selectedReceipt?.startsWith('data:application/pdf') ? (
              <iframe src={selectedReceipt} className="w-full h-[55vh] rounded-xl" />
            ) : (
              <img src={selectedReceipt || ''} alt="Receipt Document" className="max-w-full max-h-[55vh] object-contain rounded-xl shadow-md" />
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={() => setSelectedReceipt(null)} className="w-full rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700">Close Document</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}