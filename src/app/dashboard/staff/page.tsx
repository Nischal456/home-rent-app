'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
    Card, CardContent
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, Phone, Mail, UserPlus, Trash2, Lock } from 'lucide-react';
import { IUser } from '@/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function StaffPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/admin/staff', fetcher);
  const staffList: IUser[] = data?.data || [];
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', phoneNumber: '' });

  const handleAddStaff = async () => {
    if(!formData.fullName || !formData.email || !formData.password) return toast.error("Please fill all fields");
    
    setIsSubmitting(true);
    try {
        const res = await fetch('/api/admin/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await res.json();
        
        if(!res.ok) throw new Error(data.message);
        
        toast.success("Security Guard Added!");
        setIsAddOpen(false);
        setFormData({ fullName: '', email: '', password: '', phoneNumber: '' });
        mutate(); // Refresh list
    } catch (e: any) {
        toast.error(e.message || "Failed to add staff");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Are you sure you want to remove this staff member?")) return;
      try {
          await fetch(`/api/admin/staff?id=${id}`, { method: 'DELETE' }); // You might need to update the API to handle DELETE if not already done
          toast.success("Staff removed");
          mutate();
      } catch(e) { toast.error("Failed to remove"); }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;

  return (
    <div className="p-6 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-800">
                    <ShieldCheck className="h-8 w-8 text-primary"/> Security Staff
                </h1>
                <p className="text-muted-foreground">Manage access and accounts for your security team.</p>
            </div>
            <Button onClick={() => setIsAddOpen(true)} size="lg" className="shadow-lg bg-primary hover:bg-primary/90">
                <UserPlus className="mr-2 h-5 w-5"/> Hire New Guard
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
                {staffList.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl bg-slate-50/50">
                        <div className="bg-slate-100 p-4 rounded-full mb-4">
                            <ShieldCheck className="h-10 w-10 text-slate-400"/>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700">No Security Staff Found</h3>
                        <p className="text-muted-foreground mb-6">Add your first security guard to get started.</p>
                        <Button variant="outline" onClick={() => setIsAddOpen(true)}>Add Staff</Button>
                    </div>
                ) : (
                    staffList.map((staff, i) => (
                        <motion.div 
                            key={staff._id.toString()}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group border-t-4 border-t-primary">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                                                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                                                    {staff.fullName.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800">{staff.fullName}</h3>
                                                <Badge variant="secondary" className="mt-1 font-normal text-xs bg-blue-50 text-blue-700 hover:bg-blue-100">Security Guard</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3 text-sm mt-6">
                                        <div className="flex items-center gap-3 text-slate-600 p-2.5 rounded-lg bg-slate-50 group-hover:bg-blue-50/50 transition-colors">
                                            <Mail className="h-4 w-4 text-primary"/> 
                                            <span className="truncate font-medium">{staff.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600 p-2.5 rounded-lg bg-slate-50 group-hover:bg-blue-50/50 transition-colors">
                                            <Phone className="h-4 w-4 text-primary"/> 
                                            <span className="font-medium">{staff.phoneNumber || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600 p-2.5 rounded-lg bg-slate-50 group-hover:bg-blue-50/50 transition-colors">
                                            <Lock className="h-4 w-4 text-primary"/> 
                                            <span className="font-medium">Password Hidden</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                )}
            </AnimatePresence>
        </div>

        {/* Add Staff Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Security Staff</DialogTitle>
                    <DialogDescription>Create a login account for your new security guard. They can use these credentials to log in.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Full Name</label>
                        <Input placeholder="e.g. Ram Bahadur" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Email (Login ID)</label>
                        <Input placeholder="guard@stg.com" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Phone Number</label>
                        <Input placeholder="9800000000" type="tel" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Password</label>
                        <Input type="password" placeholder="******" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleAddStaff} disabled={isSubmitting} className="w-full">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Create Account
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}