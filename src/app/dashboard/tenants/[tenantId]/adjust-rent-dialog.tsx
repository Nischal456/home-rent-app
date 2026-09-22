'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Receipt, Building, Check, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AdjustRentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantName: string;
  roomNumber?: string;
  currentRent: number;
  onSuccess: () => void;
}

export function AdjustRentDialog({
  isOpen,
  onClose,
  tenantId,
  tenantName,
  roomNumber,
  currentRent,
  onSuccess,
}: AdjustRentDialogProps) {
  const [newRent, setNewRent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewRent(currentRent > 0 ? String(currentRent) : '');
    }
  }, [isOpen, currentRent]);

  const handlePercentageAdjust = (percent: number) => {
    const base = currentRent > 0 ? currentRent : 0;
    const adjusted = Math.round(base * (1 + percent / 100));
    setNewRent(String(adjusted));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(newRent);

    if (isNaN(parsed) || parsed < 0) {
      toast.error('Please enter a valid rent amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentAmount: parsed }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to adjust rent amount.');
      }

      toast.success(`Monthly rent updated to Rs ${parsed.toLocaleString('en-IN')}!`, {
        icon: '✅',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while updating rent.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedNewRent = parseFloat(newRent);
  const difference = !isNaN(parsedNewRent) && currentRent > 0 ? parsedNewRent - currentRent : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] p-6 border-0 shadow-2xl bg-white">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
                Adjust Monthly Rent
              </DialogTitle>
              <DialogDescription className="text-xs font-semibold text-slate-500 mt-0.5">
                {tenantName} • Unit {roomNumber || 'N/A'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Current vs New Rent Overview Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Current Monthly Rent
              </span>
              <span className="text-base font-extrabold text-slate-700">
                Rs {currentRent > 0 ? currentRent.toLocaleString('en-IN') : '0'}
              </span>
            </div>
            {difference !== 0 && !isNaN(parsedNewRent) && (
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Change
                </span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full inline-block ${
                  difference > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {difference > 0 ? `+Rs ${difference.toLocaleString('en-IN')}` : `-Rs ${Math.abs(difference).toLocaleString('en-IN')}`}
                </span>
              </div>
            )}
          </div>

          {/* New Rent Input Field */}
          <div className="space-y-2">
            <Label htmlFor="rentAmount" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              New Monthly Rent (Rs)
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
                Rs
              </span>
              <Input
                id="rentAmount"
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 20000"
                value={newRent}
                onChange={(e) => setNewRent(e.target.value)}
                autoFocus
                className="pl-12 h-14 rounded-2xl font-black text-slate-900 text-lg border-slate-200 focus-visible:ring-indigo-500 shadow-xs"
              />
            </div>
          </div>

          {/* Quick Adjustment Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400">Quick Adjustments:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handlePercentageAdjust(5)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors border border-transparent hover:border-indigo-200"
              >
                +5%
              </button>
              <button
                type="button"
                onClick={() => handlePercentageAdjust(10)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors border border-transparent hover:border-indigo-200"
              >
                +10%
              </button>
              <button
                type="button"
                onClick={() => handlePercentageAdjust(15)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors border border-transparent hover:border-indigo-200"
              >
                +15%
              </button>
              <button
                type="button"
                onClick={() => setNewRent(String(currentRent))}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors ml-auto"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Context Note */}
          <div className="p-3 bg-indigo-50/60 border border-indigo-100/80 rounded-xl text-[11px] text-indigo-900 leading-relaxed font-medium">
            💡 Future rent bills created for this tenant will automatically default to this new monthly rate. Existing past bills remain unaffected.
          </div>

          {/* Action Buttons */}
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-12 font-bold border-slate-200 text-slate-600 hover:bg-slate-50 flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !newRent || Number(newRent) === currentRent}
              className="rounded-xl h-12 px-6 font-bold bg-[#0B2863] hover:bg-[#0B2863]/90 text-white shadow-md flex-1 sm:flex-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save New Rent</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
