'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

type TenantForSelect = {
  _id: string;
  fullName: string;
  roomId?: { _id: string; roomNumber: string; };
};

const formSchema = z.object({
  tenantId: z.string().min(1, { message: 'Please select a tenant.' }),
  rentForPeriod: z.string().min(3, { message: 'Please specify the billing period.' }),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0.'),
  remarks: z.string().optional(),
});

type RentBillFormValues = z.infer<typeof formSchema>;

interface AddRentBillFormProps {
  onSuccess: () => void;
}

export function AddRentBillForm({ onSuccess }: AddRentBillFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [tenants, setTenants] = useState<TenantForSelect[]>([]);

  useEffect(() => {
    const fetchTenants = async () => {
      const res = await fetch('/api/tenants');
      const data = await res.json();
      if (data.success) setTenants(data.data);
    };
    fetchTenants();
  }, []);

  const form = useForm<RentBillFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        tenantId: '',
        rentForPeriod: '',
        amount: 0,
        remarks: ''
    }
  });

  async function onSubmit(values: RentBillFormValues) {
    setIsLoading(true);
    const selectedTenant = tenants.find(t => t._id === values.tenantId);
    if (!selectedTenant || !selectedTenant.roomId) {
        toast.error("Selected tenant is not assigned to a room.");
        setIsLoading(false);
        return;
    }
    try {
      const response = await fetch('/api/rent-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, roomId: selectedTenant.roomId._id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create bill.');
      toast.success('Rent bill created successfully!');
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="tenantId" render={({ field }) => (
          <FormItem>
            <FormLabel>Tenant</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select a tenant" /></SelectTrigger></FormControl>
              <SelectContent>{tenants.map(t => <SelectItem key={t._id} value={t._id}>{t.fullName} ({t.roomId?.roomNumber || 'No Room'})</SelectItem>)}</SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="amount" render={({ field }) => (
          <FormItem><FormLabel>Amount (Rs)</FormLabel><FormControl><Input type="number" placeholder="15000" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="rentForPeriod" render={({ field }) => (
            <FormItem><FormLabel>Rent For Period</FormLabel><FormControl><Input placeholder="e.g., Ashadh 2081" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="remarks" render={({ field }) => (
            <FormItem><FormLabel>Remarks (Optional)</FormLabel><FormControl><Input placeholder="Advance for 3 months" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Bill</Button>
      </form>
    </Form>
  );
}