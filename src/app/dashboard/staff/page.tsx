'use client';
import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner'; // Upgraded from react-hot-toast for premium feel
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ShieldCheck, Phone, Mail, UserPlus, FileText, Lock, Users, Sparkles, CreditCard, Banknote, Trash2, X, Calendar as CalendarIcon } from 'lucide-react';
import { IUser, IStaffPayment } from '@/types';
import NepaliDate from 'nepali-date-converter';
import { cn } from '@/lib/utils';
import { NepaliDatePicker } from 'nepali-datepicker-reactjs';
import 'nepali-datepicker-reactjs/dist/index.css';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function StaffPage() {
  const { data: staffData, isLoading: loadingStaff, mutate: mutateStaff } = useSWR('/api/admin/staff', fetcher);
  const { data: payrollData, isLoading: loadingPayroll, mutate: mutatePayroll } = useSWR('/api/admin/staff/payroll', fetcher);
  
  const staffList: IUser[] = staffData?.data || [];
  const payrollList: any[] = payrollData?.data || []; // Using any internally due to populated staffId
  
  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  
  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<IUser | null>(null);
  
  // Forms
  const [addForm, setAddForm] = useState({ fullName: '', email: '', password: '', phoneNumber: '', role: 'SECURITY' });
  const [payForm, setPayForm] = useState({ type: 'SALARY', amount: '', month: '', remarks: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', dateBS: new NepaliDate().format('YYYY-MM-DD') });

  const getRoleBadge = (role: string) => {
      switch(role) {
          case 'SECURITY': return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold"><ShieldCheck className="w-3.5 h-3.5 mr-1" /> Security Guard</Badge>;
          case 'ACCOUNTANT': return <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold"><FileText className="w-3.5 h-3.5 mr-1" /> Accountant</Badge>;
          case 'CLEANER': return <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold"><Sparkles className="w-3.5 h-3.5 mr-1" /> Cleaner</Badge>;
          default: return <Badge>{role}</Badge>;
      }
  };

  const handleAddStaff = async () => {
    if(!addForm.fullName || !addForm.email || !addForm.password) return toast.error("Please fill all required fields.");
    
    setIsSubmitting(true);
    try {
        const res = await fetch('/api/admin/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(addForm)
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.message);
        
        toast.success(`${addForm.role} added successfully!`, { icon: '🎉' });
        setIsAddOpen(false);
        setAddForm({ fullName: '', email: '', password: '', phoneNumber: '', role: 'SECURITY' });
        mutateStaff();
    } catch (e: any) {
        toast.error(e.message || "Failed to add staff");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleRunPayroll = async () => {
    if(!selectedStaff) return;
    if(!payForm.amount || !payForm.month) return toast.error("Amount and Salary Month are required.");

    setIsSubmitting(true);
    try {
        const res = await fetch('/api/admin/staff/payroll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                staffId: selectedStaff._id,
                type: payForm.type,
                amount: Number(payForm.amount),
                month: payForm.month,
                remarks: payForm.remarks,
                date: new Date()
            })
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.message);
        
        toast.success(`Payroll recorded for ${selectedStaff.fullName}!`, { icon: '💰' });
        setIsPayOpen(false);
        setPayForm({ type: 'SALARY', amount: '', month: '', remarks: '' });
        mutatePayroll();
    } catch (e: any) {
        toast.error(e.message || "Failed to log payroll");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleAssignTask = async () => {
    if(!selectedStaff) return;
    if(!taskForm.title || !taskForm.dateBS) return toast.error("Title and Date are required.");

    setIsSubmitting(true);
    try {
        const res = await fetch('/api/admin/staff/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                assignedTo: selectedStaff._id,
                title: taskForm.title,
                description: taskForm.description,
                priority: taskForm.priority,
                dateBS: taskForm.dateBS
            })
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.message);
        
        toast.success(`Task assigned to ${selectedStaff.fullName}!`, { icon: '🎯' });
        setIsTaskOpen(false);
        setTaskForm({ title: '', description: '', priority: 'MEDIUM', dateBS: new NepaliDate().format('YYYY-MM-DD') });
    } catch (e: any) {
        toast.error(e.message || "Failed to assign task");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loadingStaff || loadingPayroll) return <div className="p-8 flex justify-center mt-20"><Loader2 className="animate-spin h-8 w-8 text-[#0B2863]"/></div>;

  return (
    <>
      <Toaster position="top-center" richColors theme="light" style={{ marginTop: 'calc(env(safe-area-inset-top, 60px) + 50px)', zIndex: 99999 }} />
      <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-32 md:pb-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100">
              <div>
                  <h1 className="text-3xl font-black text-[#0B2863] flex items-center gap-3">
                      <Users className="h-8 w-8 text-blue-500"/> Team & Staff
                  </h1>
                  <p className="text-slate-500 font-medium mt-1">Manage personnel credentials and execute monthly payrolls.</p>
              </div>
              <Button onClick={() => setIsAddOpen(true)} size="lg" className="h-12 rounded-2xl bg-[#0B2863] hover:bg-blue-800 text-white shadow-lg active:scale-95 transition-all text-base font-bold px-6">
                  <UserPlus className="mr-2 h-5 w-5"/> Hire New Staff
              </Button>
          </div>

          <Tabs defaultValue="directory" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 h-14 p-1 bg-slate-100 rounded-2xl mb-8 border border-slate-200">
              <TabsTrigger value="directory" className="rounded-xl font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-[#0B2863] data-[state=active]:shadow-sm transition-all focus:ring-0">Directory</TabsTrigger>
              <TabsTrigger value="payroll" className="rounded-xl font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-[#0B2863] data-[state=active]:shadow-sm transition-all focus:ring-0">Payroll Ledger</TabsTrigger>
            </TabsList>

            <TabsContent value="directory" className="mt-0 focus-visible:outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                      {staffList.length === 0 ? (
                          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100">
                              <div className="bg-slate-50 p-4 rounded-full mb-4.5 shadow-sm border border-slate-100"><Users className="h-10 w-10 text-slate-400"/></div>
                              <h3 className="text-xl font-black text-slate-700">No Staff Residing Yet</h3>
                              <p className="text-slate-500 font-medium mb-6">Start building your internal team roster.</p>
                          </div>
                      ) : (
                          staffList.map((staff, i) => (
                              <motion.div key={staff._id.toString()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                                  <Card className="overflow-hidden hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] transition-all duration-300 group rounded-[2rem] border-slate-100">
                                      <div className={cn("w-full h-2", staff.role === 'SECURITY' ? 'bg-emerald-500' : staff.role === 'ACCOUNTANT' ? 'bg-purple-500' : 'bg-blue-500')}></div>
                                      <CardContent className="p-6">
                                          <div className="flex items-start gap-4 mb-5">
                                              <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                                                  <AvatarImage src={staff.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${staff.fullName}`} className="object-cover" />
                                                  <AvatarFallback className="bg-slate-100 text-[#0B2863] text-xl font-black">{staff.fullName.charAt(0)}</AvatarFallback>
                                              </Avatar>
                                              <div className="pt-1 overflow-hidden">
                                                  <Link href={`/dashboard/staff/${staff._id}`}>
                                                      <h3 className="font-extrabold text-xl text-slate-900 hover:text-blue-600 transition-colors truncate">{staff.fullName}</h3>
                                                  </Link>
                                                  <div className="mt-1">{getRoleBadge(staff.role)}</div>
                                              </div>
                                          </div>
                                          
                                          <div className="space-y-2 mb-6">
                                              <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-2xl">
                                                  <Phone className="h-4 w-4 text-slate-400 shrink-0"/> 
                                                  <span className="font-semibold text-sm">{staff.phoneNumber || 'N/A'}</span>
                                              </div>
                                              <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-2xl">
                                                  <Mail className="h-4 w-4 text-slate-400 shrink-0"/> 
                                                  <span className="font-semibold text-sm truncate">{staff.email}</span>
                                              </div>
                                          </div>

                                          <div className="grid grid-cols-2 gap-2">
                                              <Button onClick={() => { setSelectedStaff(staff); setIsTaskOpen(true); }} className="w-full h-12 bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 font-bold rounded-xl border border-purple-200">
                                                  <FileText className="w-4 h-4 mr-2" /> Assign Task
                                              </Button>
                                              <Button onClick={() => { setSelectedStaff(staff); setIsPayOpen(true); }} className="w-full h-12 bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800 font-bold rounded-xl border border-green-200">
                                                  <Banknote className="w-4 h-4 mr-2" /> Log Pay
                                              </Button>
                                          </div>
                                      </CardContent>
                                  </Card>
                              </motion.div>
                          ))
                      )}
                  </AnimatePresence>
              </div>
            </TabsContent>

            <TabsContent value="payroll" className="mt-0 focus-visible:outline-none">
                <Card className="rounded-[2rem] border-slate-100 shadow-sm overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-[#f8fafc] text-xs uppercase text-slate-500 font-black border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-5 whitespace-nowrap">Date Paid</th>
                                    <th className="px-6 py-5">Staff Member</th>
                                    <th className="px-6 py-5">Compensation</th>
                                    <th className="px-6 py-5 whitespace-nowrap">Salary Month</th>
                                    <th className="px-6 py-5">Categorization</th>
                                    <th className="px-6 py-5 hidden md:table-cell">Remarks / Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {payrollList.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-10 text-center font-bold text-slate-400">No payroll records logged yet.</td></tr>
                                ) : payrollList.map((p) => {
                                    const jsDate = new Date(p.date || p.createdAt);
                                    let nepaliDate = '';
                                    try { nepaliDate = new NepaliDate(jsDate).format('MMMM DD, YYYY'); } catch(e){}
                                    
                                    return (
                                        <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5 font-bold text-slate-700 whitespace-nowrap">{nepaliDate || jsDate.toDateString()}</td>
                                            <td className="px-6 py-5">
                                                <div className="font-extrabold text-[#0B2863]">{p.staffId?.fullName || 'Unknown User'}</div>
                                                <div className="text-[10px] uppercase font-black text-slate-400 mt-0.5">{p.staffId?.role}</div>
                                            </td>
                                            <td className="px-6 py-5 font-black text-green-600 whitespace-nowrap">NPR {p.amount.toLocaleString()}</td>
                                            <td className="px-6 py-5 font-semibold text-slate-600 whitespace-nowrap">{p.month || '-'}</td>
                                            <td className="px-6 py-5">
                                                <Badge variant="outline" className={cn("font-bold text-[10px]", p.type === 'SALARY' ? 'border-green-200 text-green-700 bg-green-50' : p.type === 'ADVANCE' ? 'border-orange-200 text-orange-700 bg-orange-50' : 'border-purple-200 text-purple-700 bg-purple-50')}>
                                                    {p.type}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-5 hidden md:table-cell text-sm text-slate-500 font-medium max-w-[200px] truncate">{p.remarks || '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </TabsContent>
          </Tabs>

          {/* Hire Staff Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden border-0 shadow-2xl">
                  <div className="bg-[#0B2863] p-6 text-white relative">
                      <div className="absolute top-0 right-0 p-4"><Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-white/50 hover:text-white hover:bg-white/10" onClick={()=>setIsAddOpen(false)}><X className="h-5 w-5"/></Button></div>
                      <DialogTitle className="text-2xl font-black mb-1">Onboard Staff</DialogTitle>
                      <DialogDescription className="text-blue-200 font-medium text-sm">Assign an internal role and credentials.</DialogDescription>
                  </div>
                  <div className="p-6 space-y-5 bg-white">
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Assigned Role</label>
                          <Select value={addForm.role} onValueChange={(v) => setAddForm({...addForm, role: v})}>
                              <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                              <SelectContent className="rounded-xl">
                                  <SelectItem value="SECURITY" className="font-bold"><span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500"/> Security</span></SelectItem>
                                  <SelectItem value="ACCOUNTANT" className="font-bold"><span className="flex items-center gap-2"><FileText className="w-4 h-4 text-purple-500"/> Accountant</span></SelectItem>
                                  <SelectItem value="CLEANER" className="font-bold"><span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-blue-500"/> Cleaner</span></SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                          <Input placeholder="e.g. John Doe" value={addForm.fullName} onChange={e => setAddForm({...addForm, fullName: e.target.value})} className="h-12 rounded-xl font-bold bg-slate-50 border-transparent focus-visible:border-slate-300 focus-visible:ring-0" />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Email ID (Login)</label>
                          <Input placeholder="user@company.com" type="email" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} className="h-12 rounded-xl font-bold bg-slate-50 border-transparent focus-visible:border-slate-300 focus-visible:ring-0" />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                          <Input placeholder="e.g. 9800000000" type="tel" value={addForm.phoneNumber} onChange={e => setAddForm({...addForm, phoneNumber: e.target.value})} className="h-12 rounded-xl font-bold bg-slate-50 border-transparent focus-visible:border-slate-300 focus-visible:ring-0" />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Secure Password</label>
                          <Input placeholder="******" type="password" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} className="h-12 rounded-xl font-bold bg-slate-50 border-transparent focus-visible:border-slate-300 focus-visible:ring-0" />
                      </div>
                  </div>
                  <div className="p-6 pt-0 bg-white">
                      <Button onClick={handleAddStaff} disabled={isSubmitting} className="w-full h-14 rounded-xl font-black text-lg bg-[#0B2863] text-white hover:bg-blue-800 shadow-md">
                          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin"/> : 'Create Profile'}
                      </Button>
                  </div>
              </DialogContent>
          </Dialog>

          {/* Pay Staff Dialog */}
          <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
              <DialogContent className="sm:max-w-md rounded-[2rem] p-0 border-0 shadow-2xl [&>button]:hidden bg-transparent">
                  <div className="bg-emerald-600 p-6 text-white relative rounded-t-[2rem]">
                      <div className="absolute top-0 right-0 p-4"><Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-white/50 hover:text-white hover:bg-white/10" onClick={()=>setIsPayOpen(false)}><X className="h-5 w-5"/></Button></div>
                      <DialogTitle className="text-2xl font-black mb-1 flex items-center gap-2"><Banknote className="h-6 w-6"/> Log Payroll</DialogTitle>
                      <DialogDescription className="text-emerald-100 font-medium text-sm">Disburse compensation for <span className="font-black text-white">{selectedStaff?.fullName}</span></DialogDescription>
                  </div>
                  <div className="p-6 space-y-5 bg-white">
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Payment Category</label>
                          <Select value={payForm.type} onValueChange={(v: 'SALARY'|'BONUS'|'ADVANCE') => setPayForm({...payForm, type: v})}>
                              <SelectTrigger className="h-14 rounded-2xl font-bold text-emerald-900 border-2 border-emerald-100 focus:ring-0"><SelectValue /></SelectTrigger>
                              <SelectContent className="rounded-2xl">
                                  <SelectItem value="SALARY" className="font-bold text-base py-3 focus:bg-emerald-50"><span className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-emerald-600"/> Standard Salary</span></SelectItem>
                                  <SelectItem value="BONUS" className="font-bold text-base py-3 focus:bg-emerald-50"><span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500"/> Performance Bonus</span></SelectItem>
                                  <SelectItem value="ADVANCE" className="font-bold text-base py-3 focus:bg-emerald-50"><span className="flex items-center gap-2"><Banknote className="w-4 h-4 text-blue-500"/> Advance Draw</span></SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-500 uppercase">Disbursed Amount</label>
                              <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">NPR</span>
                                  <Input type="number" placeholder="15000" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} className="h-14 rounded-2xl font-black text-lg pl-14 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500" />
                              </div>
                          </div>
                          <div className="space-y-1.5 flex flex-col">
                              <label className="text-xs font-bold text-slate-500 uppercase">Applied Month/Date</label>
                              <NepaliDatePicker
                                  inputClassName="h-14 w-full rounded-2xl font-black text-slate-700 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 px-4"
                                  value={payForm.month}
                                  onChange={(value: string) => setPayForm({...payForm, month: value})}
                                  options={{ calenderLocale: 'ne', valueLocale: 'en' }}
                              />
                          </div>
                      </div>

                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Notices / Notes (Optional)</label>
                          <Input placeholder="Bonus for great performance..." value={payForm.remarks} onChange={e => setPayForm({...payForm, remarks: e.target.value})} className="h-14 rounded-2xl font-semibold text-slate-700 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500" />
                      </div>
                  </div>
                  <div className="p-6 pt-0 bg-white rounded-b-[2rem]">
                      <Button onClick={handleRunPayroll} disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black text-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-md active:scale-95 transition-all">
                          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin"/> : 'Confirm Record'}
                      </Button>
                  </div>
              </DialogContent>
          </Dialog>

          {/* Assign Task Dialog */}
          <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
              <DialogContent className="sm:max-w-md rounded-[2rem] p-0 border-0 shadow-2xl [&>button]:hidden bg-transparent">
                  <div className="bg-purple-900 p-6 text-white relative rounded-t-[2rem]">
                      <div className="absolute top-0 right-0 p-4"><Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-white/50 hover:text-white hover:bg-white/10" onClick={()=>setIsTaskOpen(false)}><X className="h-5 w-5"/></Button></div>
                      <DialogTitle className="text-2xl font-black mb-1 flex items-center gap-2"><FileText className="h-6 w-6 text-purple-300"/> Assign Task</DialogTitle>
                      <DialogDescription className="text-purple-200 font-medium text-sm">Targeted explicitly for <span className="font-black text-white">{selectedStaff?.fullName}</span> ({selectedStaff?.role})</DialogDescription>
                  </div>
                  <div className="p-6 space-y-5 bg-white">
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Task Title</label>
                          <Input placeholder="E.g. Clean the Lobby Area..." value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} className="h-12 rounded-xl font-bold bg-slate-50 border-transparent focus-visible:border-slate-300 focus-visible:ring-0" />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase">Instructions / Details</label>
                          <Input placeholder="Extra notes for the employee..." value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} className="h-12 rounded-xl font-semibold bg-slate-50 border-transparent focus-visible:border-slate-300 focus-visible:ring-0" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-500 uppercase">Priority</label>
                              <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({...taskForm, priority: v})}>
                                  <SelectTrigger className="h-12 rounded-xl font-bold border-transparent bg-slate-50"><SelectValue /></SelectTrigger>
                                  <SelectContent className="rounded-xl">
                                      <SelectItem value="MEDIUM" className="font-bold text-blue-600">Medium</SelectItem>
                                      <SelectItem value="HIGH" className="font-bold text-orange-500">High</SelectItem>
                                      <SelectItem value="URGENT" className="font-bold text-red-500">Urgent</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-1.5 flex flex-col">
                              <label className="text-xs font-bold text-slate-500 uppercase">Issue Date (BS)</label>
                              <NepaliDatePicker
                                  inputClassName="h-12 w-full rounded-xl font-bold text-slate-700 bg-slate-50 border border-transparent focus:outline-none focus:border-slate-300 focus:ring-0 px-4"
                                  value={taskForm.dateBS}
                                  onChange={(value: string) => setTaskForm({...taskForm, dateBS: value})}
                                  options={{ calenderLocale: 'ne', valueLocale: 'en' }}
                              />
                          </div>
                      </div>
                  </div>
                  <div className="p-6 pt-0 bg-white rounded-b-[2rem]">
                      <Button onClick={handleAssignTask} disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black text-lg bg-purple-900 text-white hover:bg-purple-950 shadow-md active:scale-95 transition-all">
                          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin"/> : 'Delegate Duty'}
                      </Button>
                  </div>
              </DialogContent>
          </Dialog>

      </div>
    </>
  );
}