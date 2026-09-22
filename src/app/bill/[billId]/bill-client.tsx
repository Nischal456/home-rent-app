'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import NepaliDate from 'nepali-date-converter';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-hot-toast';
import { shareBill, formatBillShare } from '@/lib/formatBillShare';
import { PublicBillData } from '@/lib/getPublicBill';

import {
  AlertCircle, Zap, Shield, FileText, CheckCircle, Share2, Copy
} from 'lucide-react';

const DetailRow = ({ label, value, isBold = false, isTotal = false }: { label: string; value: string | number | ReactNode; isBold?: boolean; isTotal?: boolean }) => (
  <div className={cn(
    "flex justify-between items-center py-2.5 border-b print:py-1.5",
    isTotal && "border-t-2 border-dashed mt-2 pt-3"
  )}>
    <p className={cn(
      "text-sm text-muted-foreground",
      isTotal && "text-base font-bold text-gray-800"
    )}>
      {label}
    </p>
    <div className={cn(
      "font-semibold text-sm text-gray-900",
      isBold && "font-bold",
      isTotal && "text-2xl font-bold text-primary"
    )}>
      {value}
    </div>
  </div>
);

interface PublicBillClientProps {
  initialBill: PublicBillData | null;
  billId: string;
}

export default function PublicBillClient({ initialBill, billId }: PublicBillClientProps) {
  const searchParams = useSearchParams();
  const [bill, setBill] = useState<PublicBillData | null>(initialBill);
  const [loading, setLoading] = useState(!initialBill);
  const [error, setError] = useState<string | null>(initialBill ? null : 'Bill not found');

  // Fallback client fetch if initialBill was somehow null
  useEffect(() => {
    if (initialBill) return;
    const fetchBill = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/public/bills/${billId}`);
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.message || 'Bill not found or an error occurred.');
        setBill(result.data);
        setError(null);
      } catch (err: any) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchBill();
  }, [billId, initialBill]);

  // Auto-print logic
  useEffect(() => {
    if (!loading && bill && searchParams?.get('print') === 'true') {
      setTimeout(() => window.print(), 500);
    }
  }, [loading, bill, searchParams]);

  const handleShare = async () => {
    if (!bill) return;

    const res = await shareBill({
      billId: bill._id,
      type: bill.type,
      tenantName: bill.tenantId?.fullName,
      roomNumber: bill.roomId?.roomNumber,
      billingPeriod: bill.type === 'Utility' ? bill.billingMonthBS : bill.rentForPeriod,
      billDateBS: bill.billDateBS,
      totalAmount: bill.totalAmount,
      remainingAmount: bill.remainingAmount,
      totalOutstandingDue: bill.totalOutstandingDue,
      status: bill.status,
      electricity: bill.electricity,
      water: bill.water,
      threePhase: bill.threePhase,
      serviceCharge: bill.serviceCharge,
      securityCharge: bill.securityCharge,
      remarks: bill.remarks,
    });

    if (res.method === 'clipboard' && res.success) {
      toast.success('Bill breakdown & link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
        <div className="w-full max-w-2xl mx-auto space-y-4 animate-pulse">
          <div className="h-32 bg-slate-200 rounded-2xl w-full" />
          <div className="h-48 bg-slate-200 rounded-2xl w-full" />
          <div className="h-24 bg-slate-200 rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Bill Error</AlertTitle>
          <AlertDescription>{error || 'Could not load bill details.'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isUtility = bill.type === 'Utility';
  const billPeriod = isUtility ? bill.billingMonthBS : bill.rentForPeriod;
  const billAmount = bill.totalAmount;
  const thisBillRemaining = bill.remainingAmount;
  const totalOutstanding = bill.totalOutstandingDue;

  return (
    <>
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 1cm; }
          body { background: white !important; color: black !important; font-size: 10pt; }
          .no-print { display: none !important; }
          .print-container { padding: 0 !important; margin: 0 !important; min-height: 0 !important; background: white !important; }
          .print-card { box-shadow: none !important; border: 1px solid #ccc !important; }
          .print-header, .print-footer { background-color: transparent !important; }
          .print-content { padding: 1.5rem !important; }
          .print-title { font-size: 1.5rem !important; }
          .print-total { font-size: 1.25rem !important; }
          .print-utility-box { background: #f8f9fa !important; border: 1px solid #dee2e6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          h3, h4 { page-break-after: avoid; }
          .page-break-avoid { page-break-inside: avoid; }
        }
      `}</style>

      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 bg-slate-50">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100/70 rounded-full filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-purple-100/70 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100/70 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
      </div>

      <div className="min-h-screen p-4 sm:p-8 flex flex-col items-center justify-center print-container">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full max-w-2xl mx-auto">
          <Card className="w-full bg-white shadow-2xl rounded-3xl border border-slate-200/80 overflow-hidden print-card">
            
            {/* Header */}
            <CardHeader className="p-6 sm:p-8 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 print-header">
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                    🏢
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black text-slate-900 tracking-tight print-title">STG Tower</CardTitle>
                    <CardDescription className="font-semibold text-slate-500">Official {bill.type} Bill Receipt</CardDescription>
                  </div>
                </div>
                <Badge
                  variant={bill.status === 'PAID' ? 'default' : bill.status === 'PARTIALLY_PAID' ? 'secondary' : 'destructive'}
                  className={cn(
                    "h-8 px-3.5 text-xs font-black uppercase tracking-wider rounded-xl shadow-xs",
                    bill.status === 'PAID' ? "bg-emerald-600 hover:bg-emerald-700" : bill.status === 'PARTIALLY_PAID' ? "bg-amber-600 text-white" : "bg-red-600 text-white"
                  )}
                >
                  {bill.status}
                </Badge>
              </div>
            </CardHeader>

            {/* Content */}
            <CardContent className="p-6 sm:p-8 space-y-6 print-content">
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">BILLED TO</h3>
                  <p className="font-black text-slate-900 text-base">{bill.tenantId?.fullName || 'Tenant'}</p>
                  <p className="text-slate-600 font-medium">Room: {bill.roomId?.roomNumber || 'Apartment'}</p>
                </div>
                <div className="text-right space-y-1">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">BILL DETAILS</h3>
                  <p className="font-bold text-slate-900">Period: <span className="text-blue-600">{billPeriod}</span></p>
                  <p className="text-slate-600 text-xs">Date: {bill.billDateBS || new NepaliDate(new Date(bill.billDateAD)).format('YYYY MMMM DD')}</p>
                </div>
              </div>

              <Separator />

              {/* Utility Breakdown */}
              {isUtility && (
                <div className="space-y-4 page-break-avoid">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Utility Consumption Breakdown</h3>
                  
                  {/* Electricity */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 print-utility-box">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-1">
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                        Electricity
                      </h4>
                      <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        Rate: Rs {bill.electricity?.ratePerUnit || bill.electricity?.rate || 19}/unit
                      </span>
                    </div>
                    <DetailRow label="Previous Reading" value={bill.electricity?.previousReading || 0} />
                    <DetailRow label="Current Reading" value={bill.electricity?.currentReading || 0} />
                    <DetailRow label="Units Consumed" value={`${bill.electricity?.unitsConsumed || 0} Units`} isBold={true} />
                    <DetailRow label="Electricity Total" value={`Rs ${(bill.electricity?.amount || 0).toLocaleString('en-IN')}`} isBold={true} />
                  </div>

                  {/* Three Phase */}
                  {bill.threePhase && (bill.threePhase.amount || 0) > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 print-utility-box">
                      <div className="flex items-center justify-between pb-2 border-b border-amber-200/60 mb-1">
                        <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-amber-600 fill-amber-600" />
                          Three Phase Meter
                        </h4>
                        <span className="text-xs font-bold text-amber-800 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                          Rate: Rs {bill.threePhase.ratePerUnit || bill.threePhase.rate || 19}/unit
                        </span>
                      </div>
                      <DetailRow label="Previous Reading" value={bill.threePhase.previousReading || 0} />
                      <DetailRow label="Current Reading" value={bill.threePhase.currentReading || 0} />
                      <DetailRow label="Units Consumed" value={`${bill.threePhase.unitsConsumed || 0} Units`} isBold={true} />
                      <DetailRow label="Three Phase Total" value={`Rs ${(bill.threePhase.amount || 0).toLocaleString('en-IN')}`} isBold={true} />
                    </div>
                  )}

                  {/* Water */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 print-utility-box">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-1">
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                        💧 Water
                      </h4>
                      <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        Rate: Rs {bill.water?.ratePerUnit || bill.water?.rate || 0.3}/Litre
                      </span>
                    </div>
                    <DetailRow label="Previous Reading" value={bill.water?.previousReading || 0} />
                    <DetailRow label="Current Reading" value={bill.water?.currentReading || 0} />
                    <DetailRow label="Litres Consumed" value={`${(bill.water?.unitsConsumed || 0).toLocaleString('en-IN')} L`} isBold={true} />
                    <DetailRow label="Water Total" value={`Rs ${(bill.water?.amount || 0).toLocaleString('en-IN')}`} isBold={true} />
                  </div>
                </div>
              )}

              {/* Payment Breakdown / Summary */}
              <div className="page-break-avoid space-y-2">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Charges Summary</h3>
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 print-utility-box">
                  {isUtility ? (
                    <>
                      <DetailRow
                        label="Utility Usage (Elec + Water)"
                        value={`Rs ${((bill.electricity?.amount || 0) + (bill.water?.amount || 0) + (bill.threePhase?.amount || 0)).toLocaleString('en-IN')}`}
                      />
                      {(bill.serviceCharge || 0) > 0 && (
                        <DetailRow label="Service Charge" value={`Rs ${(bill.serviceCharge || 0).toLocaleString('en-IN')}`} />
                      )}
                      {(bill.securityCharge || 0) > 0 && (
                        <DetailRow label="Security Charge" value={`Rs ${(bill.securityCharge || 0).toLocaleString('en-IN')}`} />
                      )}
                    </>
                  ) : (
                    <DetailRow label="Monthly Rent Amount" value={`Rs ${(bill.totalAmount || 0).toLocaleString('en-IN')}`} isBold={true} />
                  )}
                </div>
              </div>

              {/* Remarks */}
              {bill.remarks?.trim() && (
                <div className="page-break-avoid w-full">
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-sm text-amber-900 flex items-start gap-2.5">
                    <FileText className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-xs uppercase tracking-wider text-amber-800">Remarks</span>
                      <p className="mt-0.5 font-medium">{bill.remarks.trim()}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Footer with Balance Breakdown */}
            <CardFooter className="bg-slate-50/90 p-6 sm:p-8 rounded-b-3xl border-t border-slate-200/70 flex flex-col gap-5 print-footer">
              <div className="w-full space-y-2">
                <div className="flex justify-between items-center py-2">
                  <span className="text-base font-extrabold text-slate-800">Bill Total Amount</span>
                  <span className="text-2xl font-black text-slate-900">Rs {billAmount.toLocaleString('en-IN')}</span>
                </div>

                {bill.paidAmount > 0 && (
                  <div className="flex justify-between items-center py-2 text-emerald-700">
                    <span className="text-sm font-bold">Paid Amount</span>
                    <span className="text-lg font-black">Rs {bill.paidAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* This Bill Remaining */}
                <div className="flex justify-between items-center p-3.5 bg-orange-50/80 border border-orange-200 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-orange-800 uppercase tracking-wider block">This Bill Remaining</span>
                    <span className="text-[11px] text-orange-600 font-medium">
                      {bill.status === 'PAID' ? 'Fully settled' : 'Pending for this month'}
                    </span>
                  </div>
                  <span className="text-xl font-black text-orange-700">
                    Rs {thisBillRemaining.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Total Remaining Balance (Altogether) */}
                <div className={cn(
                  "p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs",
                  totalOutstanding > 0 ? "bg-red-50/90 border-red-200 text-red-900" : "bg-emerald-50/90 border-emerald-200 text-emerald-900"
                )}>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider block flex items-center gap-1.5">
                      {totalOutstanding > 0 ? (
                        <>🔴 Total Remaining Balance (Altogether)</>
                      ) : (
                        <>🟢 Total Remaining Balance (Altogether)</>
                      )}
                    </span>
                    <span className="text-xs font-medium opacity-80">
                      {totalOutstanding > 0 ? 'Includes all pending rent and utility bills combined' : 'All rent & utility bills are completely cleared!'}
                    </span>
                  </div>
                  <span className={cn(
                    "text-2xl sm:text-3xl font-black tracking-tight",
                    totalOutstanding > 0 ? "text-red-600" : "text-emerald-700"
                  )}>
                    Rs {totalOutstanding.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full pt-2 flex flex-col sm:flex-row gap-3 print-hidden">
                <Button
                  onClick={handleShare}
                  className="flex-1 h-12 shadow-md bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" /> Share Full Bill on WhatsApp
                </Button>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
