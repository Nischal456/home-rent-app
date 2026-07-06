'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea"; // ✅ ADDED: Import Textarea
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from 'react-hot-toast';
import { useState, useEffect, useCallback } from 'react';
import { Loader2, Zap, Droplets, Wrench, User, ClipboardEdit } from 'lucide-react'; // ✅ ADDED: ClipboardEdit icon
import { Separator } from '@/components/ui/separator';
import { IUser, IRoom } from '@/types';

type TenantForSelect = Pick<IUser, '_id' | 'fullName' | 'hasThreePhaseMeter'> & { roomId?: Pick<IRoom, '_id' | 'roomNumber'> };

const formSchema = z.object({
  tenantId: z.string().min(1, 'Please select a tenant.'),
  billingMonthBS: z.string().min(3, 'Please specify the billing month.'),
  elecRate: z.number().min(0, "Rate must be positive"),
  elecPrevReading: z.number().min(0),
  elecCurrReading: z.number().min(0),
  threePhaseRate: z.number().min(0).optional(),
  threePhasePrevReading: z.number().min(0).optional(),
  threePhaseCurrReading: z.number().min(0).optional(),
  waterRate: z.number().min(0, "Rate must be positive"),
  waterPrevReading: z.number().min(0),
  waterCurrReading: z.number().min(0),
  includeServiceCharge: z.boolean(),
  includeSecurityCharge: z.boolean(),
  remarks: z.string().optional(),
}).refine(data => data.elecCurrReading >= data.elecPrevReading, {
  message: "Current must be >= previous",
  path: ["elecCurrReading"],
}).refine(data => {
  if (data.threePhaseCurrReading !== undefined && data.threePhasePrevReading !== undefined) {
    return data.threePhaseCurrReading >= data.threePhasePrevReading;
  }
  return true;
}, {
  message: "Current must be >= previous",
  path: ["threePhaseCurrReading"],
}).refine(data => data.waterCurrReading >= data.waterPrevReading, {
  message: "Current must be >= previous",
  path: ["waterCurrReading"],
});

type UtilityBillFormValues = z.infer<typeof formSchema>;

const SERVICE_CHARGE_AMOUNT = 500;
const SECURITY_CHARGE_AMOUNT = 1000;

export function AddUtilityBillForm({ onSuccess, preselectedTenantId }: { onSuccess: () => void; preselectedTenantId?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [tenants, setTenants] = useState<TenantForSelect[]>([]);
  const [lastBilledMonth, setLastBilledMonth] = useState<string | null>(null);
  const [calculatedTotals, setCalculatedTotals] = useState({
    elecUnits: 0, elecAmount: 0, tpUnits: 0, tpAmount: 0, waterUnits: 0, waterAmount: 0, totalAmount: 0
  });

  const form = useForm<UtilityBillFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tenantId: preselectedTenantId || '',
      billingMonthBS: '',
      includeServiceCharge: true,
      includeSecurityCharge: false,
      elecRate: 19,
      elecPrevReading: undefined,
      elecCurrReading: undefined,
      threePhaseRate: 19,
      threePhasePrevReading: undefined,
      threePhaseCurrReading: undefined,
      waterRate: 0.30,
      waterPrevReading: undefined,
      waterCurrReading: undefined,
      remarks: '',
    },
  });

  const { watch, setValue } = form;

  const [hasThreePhase, setHasThreePhase] = useState(false);
  const selectedTenantId = watch('tenantId');
  useEffect(() => {
    if (selectedTenantId) {
      const selected = tenants.find(t => t._id.toString() === selectedTenantId);
      setHasThreePhase(!!selected?.hasThreePhaseMeter);
    } else {
      setHasThreePhase(false);
    }
  }, [selectedTenantId, tenants]);

  const calculateTotals = useCallback((value: Partial<UtilityBillFormValues>) => {
    const elecUnits = Math.max(0, (value.elecCurrReading || 0) - (value.elecPrevReading || 0));
    const elecAmount = elecUnits * (value.elecRate || 0);

    const hasThreePhaseMeter = value.tenantId ? !!tenants.find(t => t._id.toString() === value.tenantId)?.hasThreePhaseMeter : false;
    let tpUnits = 0;
    let tpAmount = 0;
    if (hasThreePhaseMeter) {
      tpUnits = Math.max(0, (value.threePhaseCurrReading || 0) - (value.threePhasePrevReading || 0));
      tpAmount = tpUnits * (value.threePhaseRate || 0);
    }

    const waterUnits = Math.max(0, (value.waterCurrReading || 0) - (value.waterPrevReading || 0));
    const waterAmount = waterUnits * (value.waterRate || 0);
    const serviceCharge = value.includeServiceCharge ? SERVICE_CHARGE_AMOUNT : 0;
    const securityCharge = value.includeSecurityCharge ? SECURITY_CHARGE_AMOUNT : 0;
    const totalAmount = parseFloat((elecAmount + tpAmount + waterAmount + serviceCharge + securityCharge).toFixed(2));
    setCalculatedTotals({ elecUnits, elecAmount, tpUnits, tpAmount, waterUnits, waterAmount, totalAmount });
  }, [tenants]);

  useEffect(() => {
    if (!selectedTenantId) return;

    const fetchLastBill = async () => {
      try {
        const res = await fetch(`/api/tenants/${selectedTenantId}/last-utility-bill`);
        const data = await res.json();
        if (data.success && data.data) {
          setValue('elecPrevReading', data.data.electricity.currentReading);
          setValue('waterPrevReading', data.data.water.currentReading);
          if (data.data.threePhase) {
            setValue('threePhasePrevReading', data.data.threePhase.currentReading);
          } else {
            setValue('threePhasePrevReading', 0);
          }
          if (data.data.remarks) {
            setValue('remarks', data.data.remarks);
          } else {
            setValue('remarks', '');
          }
          setLastBilledMonth(data.data.billingMonthBS || null);
          toast.success("Fetched previous meter readings.");
        } else {
          setValue('elecPrevReading', 0);
          setValue('waterPrevReading', 0);
          setValue('threePhasePrevReading', 0);
          setValue('remarks', '');
          setLastBilledMonth(null);
        }
      } catch (error) {
        console.error("Failed to fetch last bill:", error);
        setValue('elecPrevReading', 0);
        setValue('waterPrevReading', 0);
        setValue('threePhasePrevReading', 0);
        setValue('remarks', '');
        setLastBilledMonth(null);
      }
    };
    fetchLastBill();
  }, [selectedTenantId, setValue]);

  useEffect(() => {
    const subscription = watch((value) => {
      calculateTotals(value);
    });
    return () => subscription.unsubscribe();
  }, [watch, calculateTotals]);

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
        ratePerUnit: values.elecRate,
        amount: calculatedTotals.elecAmount,
      },
      threePhase: selectedTenant.hasThreePhaseMeter ? {
        previousReading: values.threePhasePrevReading || 0,
        currentReading: values.threePhaseCurrReading || 0,
        unitsConsumed: calculatedTotals.tpUnits,
        ratePerUnit: values.threePhaseRate || 19,
        amount: calculatedTotals.tpAmount,
      } : undefined,
      water: {
        previousReading: values.waterPrevReading,
        currentReading: values.waterCurrReading,
        unitsConsumed: calculatedTotals.waterUnits,
        ratePerUnit: values.waterRate,
        amount: calculatedTotals.waterAmount,
      },
      serviceCharge: values.includeServiceCharge ? SERVICE_CHARGE_AMOUNT : 0,
      securityCharge: values.includeSecurityCharge ? SECURITY_CHARGE_AMOUNT : 0,
      totalAmount: calculatedTotals.totalAmount,
      remarks: values.remarks,
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
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>, field: { onChange: (value: number | undefined) => void }) => {
    field.onChange(event.target.value === '' ? undefined : Number(event.target.value));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[80vh]">
        {/* ✅ POLISH: Added p-4 for mobile, sm:p-6 for desktop */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><User className="h-4 w-4" /> Core Details</h3>
            <div className="space-y-4 rounded-lg border p-4">
              {preselectedTenantId ? (
                <FormItem>
                  <FormLabel>Tenant</FormLabel>
                  <Input value={tenants.find(t => t._id.toString() === preselectedTenantId)?.fullName || 'Loading...'} disabled />
                </FormItem>
              ) : (
                <FormField control={form.control} name="tenantId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenant</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        {/* ✅ FIX: Added truncate class to prevent overflow */}
                        <SelectTrigger className="truncate">
                          <SelectValue placeholder="Select a tenant" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tenants.map(t => (
                          // ✅ FIX: Added truncate class to items as well
                          <SelectItem key={t._id.toString()} value={t._id.toString()} className="truncate">
                            {t.fullName} ({t.roomId?.roomNumber || 'No Room'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              <FormField control={form.control} name="billingMonthBS" render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing Month (B.S.)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Ashadh 2081" {...field} />
                  </FormControl>
                  {lastBilledMonth && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last billed month: <span className="font-semibold text-primary">{lastBilledMonth}</span>
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Zap className="h-4 w-4" /> Electricity</h3>
            <div className="space-y-4 rounded-lg border p-4">
              <FormField control={form.control} name="elecRate" render={({ field }) => (<FormItem><FormLabel>Rate (per Unit)</FormLabel><FormControl><Input type="number" step="any" {...field} onChange={e => handleNumberChange(e, field)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="elecPrevReading" render={({ field }) => (<FormItem><FormLabel>Prev. Reading</FormLabel><FormControl><Input type="number" step="any" {...field} onChange={e => handleNumberChange(e, field)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="elecCurrReading" render={({ field }) => (<FormItem><FormLabel>Curr. Reading</FormLabel><FormControl><Input type="number" step="any" {...field} onChange={e => handleNumberChange(e, field)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <p className="text-sm text-muted-foreground text-center pt-2">Units: <span className="font-bold text-foreground">{calculatedTotals.elecUnits}</span>, Amount: <span className="font-bold text-foreground">Rs {calculatedTotals.elecAmount.toLocaleString('en-IN')}</span></p>
            </div>
          </div>

          {hasThreePhase && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-yellow-600"><Zap className="h-4 w-4" /> Three Phase Meter</h3>
              <div className="space-y-4 rounded-lg border border-yellow-200 bg-yellow-50/20 p-4">
                <FormField control={form.control} name="threePhaseRate" render={({ field }) => (<FormItem><FormLabel>Rate (per Unit)</FormLabel><FormControl><Input type="number" step="any" {...field} onChange={e => handleNumberChange(e, field)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="threePhasePrevReading" render={({ field }) => (<FormItem><FormLabel>Prev. Reading</FormLabel><FormControl><Input type="number" step="any" {...field} onChange={e => handleNumberChange(e, field)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="threePhaseCurrReading" render={({ field }) => (<FormItem><FormLabel>Curr. Reading</FormLabel><FormControl><Input type="number" step="any" {...field} onChange={e => handleNumberChange(e, field)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <p className="text-sm text-yellow-800 text-center pt-2">Units: <span className="font-bold">{calculatedTotals.tpUnits}</span>, Amount: <span className="font-bold">Rs {calculatedTotals.tpAmount.toLocaleString('en-IN')}</span></p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Droplets className="h-4 w-4" /> Water</h3>
            <div className="space-y-4 rounded-lg border p-4">
              <FormField control={form.control} name="waterRate" render={({ field }) => (<FormItem><FormLabel>Rate (per Unit)</FormLabel><FormControl><Input type="number" step="any" {...field} onChange={e => handleNumberChange(e, field)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="waterPrevReading" render={({ field }) => (<FormItem><FormLabel>Prev. Reading</FormLabel><FormControl><Input type="number" step="any" {...field} onChange={e => handleNumberChange(e, field)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="waterCurrReading" render={({ field }) => (<FormItem><FormLabel>Curr. Reading</FormLabel><FormControl><Input type="number" step="any" {...field} onChange={e => handleNumberChange(e, field)} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <p className="text-sm text-muted-foreground text-center pt-2">Units: <span className="font-bold text-foreground">{calculatedTotals.waterUnits}</span>, Amount: <span className="font-bold text-foreground">Rs {calculatedTotals.waterAmount.toLocaleString('en-IN')}</span></p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Wrench className="h-4 w-4" /> Additional Charges</h3>
            <div className="space-y-3 rounded-lg border p-4">
              <FormField control={form.control} name="includeServiceCharge" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between"><FormLabel>Service Charge (Rs 500)</FormLabel><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
              <Separator />
              <FormField control={form.control} name="includeSecurityCharge" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between"><FormLabel>Security Charge (Rs 1000)</FormLabel><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
            </div>
          </div>

          {/* ✅ ADDED: New Remarks Section */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><ClipboardEdit className="h-4 w-4" /> Remarks</h3>
            <div className="rounded-lg border p-4">
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Optional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Meter was replaced, partial payment..."
                        className="resize-none" // ✅ POLISH: Prevents user from resizing textarea
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* ✅ POLISH: Added p-4 for mobile, sm:p-6 for desktop */}
        <DialogFooter className="p-4 sm:p-6 border-t bg-background flex-shrink-0 flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="text-center sm:text-left">
            <p className="text-xs text-muted-foreground">Total Bill Amount</p>
            <p className="text-2xl font-bold text-primary">Rs {calculatedTotals.totalAmount.toLocaleString('en-IN')}</p>
          </div>
          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Bill</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}