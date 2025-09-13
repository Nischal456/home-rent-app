'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { IUser, IRoom } from '@/types';

// Define the shape of the form's state
interface FormState {
  tenantId: string;
  rentForPeriod: string;
  amount: string; // Amount is a string to match the input field
  remarks: string;
}

interface TenantForSelect extends Pick<IUser, '_id' | 'fullName'> {
  roomId?: Pick<IRoom, '_id' | 'roomNumber'>;
}

export function AddRentBillForm({ onSuccess }: { onSuccess: () => void; }) {
  const [formState, setFormState] = useState<FormState>({
    tenantId: '',
    rentForPeriod: '',
    amount: '',
    remarks: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenants, setTenants] = useState<TenantForSelect[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // Fetch the list of tenants when the component mounts
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await fetch('/api/tenants');
        const data = await res.json();
        if (data.success) {
          setTenants(data.data);
        }
      } catch (error) {
        toast.error("Failed to load tenants list.");
      }
    };
    fetchTenants();
  }, []);

  // ✅ THIS IS THE NEW "SMART" FEATURE:
  // This effect runs whenever a new tenant is selected.
  useEffect(() => {
    if (!formState.tenantId) return;

    const fetchLastBillInfo = async () => {
      try {
        const res = await fetch(`/api/tenants/${formState.tenantId}/last-rent-bill`);
        const data = await res.json();

        if (data.success) {
          const { lastBill, defaultRentAmount } = data.data;
          
          // Use a functional update to avoid stale state issues
          setFormState(prev => ({
            ...prev,
            amount: defaultRentAmount > 0 ? String(defaultRentAmount) : prev.amount,
            rentForPeriod: lastBill ? lastBill.rentForPeriod : prev.rentForPeriod,
          }));

          if (lastBill) {
            toast.success("Loaded previous bill period.");
          }
        }
      } catch (error) {
        console.error("Failed to fetch last bill:", error);
        toast.error("Could not fetch previous bill data.");
      }
    };

    fetchLastBillInfo();
  }, [formState.tenantId]); // Dependency array ensures this runs only when tenantId changes

  // Simple, manual validation function
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!formState.tenantId) {
      newErrors.tenantId = 'Please select a tenant.';
    }
    if (!formState.rentForPeriod || formState.rentForPeriod.length < 3) {
      newErrors.rentForPeriod = 'Please specify a valid period.';
    }
    const amountNum = parseFloat(formState.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Please enter a valid positive amount.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form.');
      return;
    }

    setIsSubmitting(true);
    const selectedTenant = tenants.find(t => t._id.toString() === formState.tenantId);
    if (!selectedTenant || !selectedTenant.roomId) {
        toast.error("Selected tenant is not assigned to a room.");
        setIsSubmitting(false);
        return;
    }

    const finalBillData = {
      ...formState,
      amount: parseFloat(formState.amount),
      roomId: selectedTenant.roomId._id,
    };

    try {
      const response = await fetch('/api/rent-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalBillData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create bill.');
      toast.success('Rent bill created successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[70vh]">
      {/* This is the scrollable area for the form content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tenantId">Tenant</Label>
          <Select value={formState.tenantId} onValueChange={(value) => handleChange('tenantId', value)}>
            <SelectTrigger id="tenantId">
              <SelectValue placeholder="Select a tenant" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map(t => (
                <SelectItem key={t._id.toString()} value={t._id.toString()}>
                  {t.fullName} ({t.roomId?.roomNumber || 'No Room'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tenantId && <p className="text-sm font-medium text-destructive">{errors.tenantId}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="rentForPeriod">Rent For Period</Label>
          <Input id="rentForPeriod" placeholder="e.g., Ashadh 2081" value={formState.rentForPeriod} onChange={(e) => handleChange('rentForPeriod', e.target.value)} />
          {errors.rentForPeriod && <p className="text-sm font-medium text-destructive">{errors.rentForPeriod}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (Rs)</Label>
          <Input id="amount" type="number" placeholder="15000" value={formState.amount} onChange={(e) => handleChange('amount', e.target.value)} />
          {errors.amount && <p className="text-sm font-medium text-destructive">{errors.amount}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="remarks">Remarks (Optional)</Label>
          <Input id="remarks" placeholder="e.g., Advance payment" value={formState.remarks} onChange={(e) => handleChange('remarks', e.target.value)} />
        </div>
      </div>

      {/* This is the professional, non-sticky footer */}
      <DialogFooter className="p-6 pt-4 border-t bg-background flex-shrink-0">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Bill
        </Button>
      </DialogFooter>
    </form>
  );
}