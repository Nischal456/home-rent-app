'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'react-hot-toast';
import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { IUser, IRoom } from '@/types';

type TenantForSelect = Pick<IUser, '_id' | 'fullName'> & { roomId?: Pick<IRoom, '_id' | 'roomNumber'> };

// ✅ FIX: Changed number and boolean schemas to resolve form errors
const formSchema = z.object({
  tenantId: z.string().min(1, 'Please select a tenant.'),
  billingMonthBS: z.string().min(3, 'Please specify the billing month.'),
  elecPrevReading: z.number().min(0),
  elecCurrReading: z.number().min(0),
  waterPrevReading: z.number().min(0),
  waterCurrReading: z.number().min(0),
  includeServiceCharge: z.boolean(),
  includeSecurityCharge: z.boolean(),
}).refine(data => data.elecCurrReading >= data.elecPrevReading, {
  message: "Current reading must be >= previous reading",
  path: ["elecCurrReading"],
}).refine(data => data.waterCurrReading >= data.waterPrevReading, {
  message: "Current reading must be >= previous reading",
  path: ["waterCurrReading"],
});

type UtilityBillFormValues = z.infer<typeof formSchema>;

const ELECTRICITY_RATE_PER_UNIT = 19;
const WATER_RATE_PER_UNIT = 0.40;
const SERVICE_CHARGE_AMOUNT = 500;
const SECURITY_CHARGE_AMOUNT = 1000;

export function AddUtilityBillForm({ onSuccess }: { onSuccess: () => void; }) {
  const [isLoading, setIsLoading] = useState(false);
  const [tenants, setTenants] = useState<TenantForSelect[]>([]);
  const [hasPreviousBill, setHasPreviousBill] = useState(false);
  const [calculatedTotals, setCalculatedTotals] = useState({
      elecUnits: 0, elecAmount: 0, waterUnits: 0, waterAmount: 0, totalAmount: 0
  });

  const form = useForm<UtilityBillFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tenantId: '',
      billingMonthBS: '',
      includeServiceCharge: false,
      includeSecurityCharge: false,
      elecPrevReading: undefined,
      elecCurrReading: undefined,
      waterPrevReading: undefined,
      waterCurrReading: undefined,
    },
  });

  const { watch, setValue } = form;

  const calculateTotals = useCallback((value: Partial<UtilityBillFormValues>) => {
      const elecUnits = Math.max(0, (value.elecCurrReading || 0) - (value.elecPrevReading || 0));
      const elecAmount = elecUnits * ELECTRICITY_RATE_PER_UNIT;
      const waterUnits = Math.max(0, (value.waterCurrReading || 0) - (value.waterPrevReading || 0));
      const waterAmount = waterUnits * WATER_RATE_PER_UNIT;
      const serviceCharge = value.includeServiceCharge ? SERVICE_CHARGE_AMOUNT : 0;
      const securityCharge = value.includeSecurityCharge ? SECURITY_CHARGE_AMOUNT : 0;
      const totalAmount = parseFloat((elecAmount + waterAmount + serviceCharge + securityCharge).toFixed(2));
      setCalculatedTotals({ elecUnits, elecAmount, waterUnits, waterAmount, totalAmount });
  }, []);

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'tenantId' && value.tenantId) {
        const fetchLastBill = async () => {
          try {
            const res = await fetch(`/api/tenants/${value.tenantId}/last-utility-bill`);
            const data = await res.json();
            if (data.success && data.data) {
              setValue('elecPrevReading', data.data.electricity.currentReading);
              setValue('waterPrevReading', data.data.water.currentReading);
              setHasPreviousBill(true);
              toast.success("Fetched previous meter readings.");
            } else {
              setValue('elecPrevReading', 0);
              setValue('waterPrevReading', 0);
              setHasPreviousBill(false);
            }
          } catch (error) {
            // ✅ FIX: Use the 'error' variable to fix the warning
            console.error("Failed to fetch last bill:", error);
            setValue('elecPrevReading', 0);
            setValue('waterPrevReading', 0);
            setHasPreviousBill(false);
          }
        };
        fetchLastBill();
      }
      calculateTotals(value);
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue, calculateTotals]);

  useEffect(() => {
    const fetchTenants = async () => {
        const res = await fetch('/api/tenants');
        const data = await res.json();
        if (data.success) setTenants(data.data);
    };
    fetchTenants();
  }, []);

  async function onSubmit(values: UtilityBillFormValues) {
    setIsLoading(true);
    const selectedTenant = tenants.find(t => t._id.toString() === values.tenantId);
    if (!selectedTenant?.roomId) {
        toast.error("Selected tenant is not assigned to a room.");
        setIsLoading(false);
        return;
    }
    
    const finalBillData = {
        tenantId: values.tenantId,
        roomId: selectedTenant.roomId._id,
        billingMonthBS: values.billingMonthBS,
        electricity: {
            previousReading: values.elecPrevReading,
            currentReading: values.elecCurrReading,
            unitsConsumed: calculatedTotals.elecUnits,
            amount: calculatedTotals.elecAmount,
        },
        water: {
            previousReading: values.waterPrevReading,
            currentReading: values.waterCurrReading,
            unitsConsumed: calculatedTotals.waterUnits,
            amount: calculatedTotals.waterAmount,
        },
        serviceCharge: values.includeServiceCharge ? SERVICE_CHARGE_AMOUNT : 0,
        securityCharge: values.includeSecurityCharge ? SECURITY_CHARGE_AMOUNT : 0,
        totalAmount: calculatedTotals.totalAmount,
    };
    
    try {
      const response = await fetch('/api/utility-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalBillData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create bill.');
      toast.success('Utility bill created successfully!');
      form.reset();
      onSuccess();
    } catch (error) {
      let errorMessage = "An unknown error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>, field: { onChange: (value: number | undefined) => void }) => {
    field.onChange(event.target.value === '' ? undefined : Number(event.target.value));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="tenantId" render={({ field }) => (
          <FormItem><FormLabel>Tenant</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a tenant" /></SelectTrigger></FormControl><SelectContent>{tenants.map(t => (
            <SelectItem key={t._id.toString()} value={t._id.toString()}>{t.fullName} ({t.roomId?.roomNumber || 'No Room'})</SelectItem>
          ))}</SelectContent></Select><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="billingMonthBS" render={({ field }) => (
            <FormItem><FormLabel>Billing Month (B.S.)</FormLabel><FormControl><Input placeholder="e.g., Ashadh 2081" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <Separator />
        <h4 className="font-medium">Electricity</h4>
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="elecPrevReading" render={({ field }) => (<FormItem><FormLabel>Prev. Reading</FormLabel><FormControl><Input type="number" step="any" {...field} readOnly={hasPreviousBill} className={hasPreviousBill ? "bg-gray-100" : ""} onChange={e => handleNumberChange(e, field)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="elecCurrReading" render={({ field }) => (<FormItem><FormLabel>Curr. Reading</FormLabel><FormControl><Input type="number" step="any" {...field} onChange={e => handleNumberChange(e, field)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <p className="text-sm text-muted-foreground">Units: {calculatedTotals.elecUnits}, Amount: Rs {calculatedTotals.elecAmount.toLocaleString('en-IN')}</p>
        <Separator />
        <h4 className="font-medium">Water</h4>
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="waterPrevReading" render={({ field }) => (<FormItem><FormLabel>Prev. Reading</FormLabel><FormControl><Input type="number" step="any" {...field} readOnly={hasPreviousBill} className={hasPreviousBill ? "bg-gray-100" : ""} onChange={e => handleNumberChange(e, field)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="waterCurrReading" render={({ field }) => (<FormItem><FormLabel>Curr. Reading</FormLabel><FormControl><Input type="number" step="any" {...field} onChange={e => handleNumberChange(e, field)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <p className="text-sm text-muted-foreground">Units: {calculatedTotals.waterUnits}, Amount: Rs {calculatedTotals.waterAmount.toLocaleString('en-IN')}</p>
        <Separator />
        <h4 className="font-medium">Additional Charges</h4>
        <div className="flex items-center space-x-4">
            <FormField control={form.control} name="includeServiceCharge" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Service Charge (Rs 500)</FormLabel></div></FormItem>)} />
            <FormField control={form.control} name="includeSecurityCharge" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Security Charge (Rs 1000)</FormLabel></div></FormItem>)} />
        </div>
        <Separator />
        <div className="text-xl font-bold text-right">Total: Rs {calculatedTotals.totalAmount.toLocaleString('en-IN')}</div>
        <Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Utility Bill</Button>
      </form>
    </Form>
  );
}