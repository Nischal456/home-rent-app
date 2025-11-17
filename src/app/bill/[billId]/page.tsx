'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { IUser, IRoom, IRentBill, IUtilityBill } from '@/types';
import NepaliDate from 'nepali-date-converter';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

// ✅ "BEST OF BEST" ICONS: Added CheckCircle for the new 'Paid' status
import { 
    AlertCircle, Printer, Zap, Droplets, Banknote, Calendar, Home, User, Scale, 
    Shield, Wrench, FileText, CheckCircle 
} from 'lucide-react';

type BillData = (IRentBill | IUtilityBill) & { 
  type: 'Rent' | 'Utility',
  tenantId: IUser,
  roomId: IRoom,
  totalOutstandingDue: number 
};

// --- Professional, Reusable Detail Row ---
const DetailRow = ({ label, value, isBold = false, isTotal = false }: { label: string, value: string | number | ReactNode, isBold?: boolean, isTotal?: boolean }) => (
  <div className={cn(
    "flex justify-between items-center py-2.5 border-b print:py-1.5", 
    isTotal && "border-t-2 border-dashed mt-2 pt-3"
  )}>
    <p className={cn(
      "text-sm text-muted-foreground", 
      isTotal && "text-base font-bold text-gray-800" // Label is bold for Total
    )}>
      {label}
    </p>
    <p className={cn(
      "font-semibold text-sm text-gray-900", 
      isBold && "font-bold", 
      isTotal && "text-2xl font-bold text-primary" // Value is extra large for Total
    )}>
      {value}
    </p>
  </div>
);

// --- Professional Loading Skeleton ---
const BillSkeleton = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  </div>
);

export default function PublicBillPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const billId = params.billId as string;
  const [bill, setBill] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!billId) return;
    const fetchBill = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/public/bills/${billId}`);
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.message || 'Bill not found or an error occurred.');
        setBill(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchBill();
  }, [billId]);

  // Auto-print logic
  useEffect(() => {
    if (!loading && bill && searchParams.get('print') === 'true') {
      setTimeout(() => window.print(), 500);
    }
  }, [loading, bill, searchParams]);

  if (loading) {
    return <BillSkeleton />;
  }

  if (error || !bill) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error || 'Could not load bill details.'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isUtility = bill.type === 'Utility';
  const billPeriod = isUtility ? (bill as IUtilityBill).billingMonthBS : (bill as IRentBill).rentForPeriod;
  const billAmount = isUtility ? (bill as IUtilityBill).totalAmount : (bill as IRentBill).amount;

  return (
    <>
      {/* --- "Best of Best" Print Styles --- */}
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

      {/* --- Animated Background --- */}
      <div className="fixed inset-0 -z-10 bg-white">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-purple-200 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="min-h-screen p-4 sm:p-8 flex flex-col items-center justify-center print-container">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} className="w-full max-w-2xl mx-auto">
          <Card className="w-full bg-white/70 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/50 print-card">
            <CardHeader className="p-6 print-header">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Image src="/home.png" alt="Logo" width={48} height={48} className="full" />
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900 print-title">STG Tower</CardTitle>
                    <CardDescription>Bill Receipt</CardDescription>
                  </div>
                </div>
                <Badge variant={bill.status === 'PAID' ? 'default' : 'destructive'} className="h-8 text-sm">{bill.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6 print-content">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1"><h3 className="font-semibold text-gray-500">BILLED TO</h3><p className="font-medium text-gray-900">{bill.tenantId.fullName}</p><p className="text-gray-700">Room: {bill.roomId.roomNumber}</p></div>
                <div className="text-right space-y-1"><h3 className="font-semibold text-gray-500">BILL DETAILS</h3><p className="font-medium text-gray-900">Date: {new NepaliDate(new Date(bill.billDateAD)).format('YYYY MMMM DD')}</p><p className="text-gray-700">For: {billPeriod}</p></div>
              </div>
              
              <Separator />

              {isUtility && (
                <div className="space-y-4 page-break-avoid">
                  <h3 className="font-semibold text-center text-gray-800">Utility Breakdown</h3>
                  <div className="p-4 rounded-lg bg-gray-50 border print-utility-box">
                    <h4 className="font-medium text-gray-700">Electricity (Rate: Rs 19 / unit)</h4>
                    <DetailRow label="Previous Reading" value={(bill as IUtilityBill).electricity.previousReading} />
                    <DetailRow label="Current Reading" value={(bill as IUtilityBill).electricity.currentReading} />
                    <DetailRow label="Units Consumed" value={(bill as IUtilityBill).electricity.unitsConsumed} />
                    <DetailRow label="Electricity Total" value={`Rs ${(bill as IUtilityBill).electricity.amount.toLocaleString()}`} isBold={true} />
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 border print-utility-box">
                    <h4 className="font-medium text-gray-700">Water (Rate: Rs 0.30 / Litre)</h4>
                    <DetailRow label="Previous Reading" value={(bill as IUtilityBill).water.previousReading} />
                    <DetailRow label="Current Reading" value={(bill as IUtilityBill).water.currentReading} />
                    <DetailRow label="Litres Consumed" value={(bill as IUtilityBill).water.unitsConsumed} />
                    <DetailRow label="Water Total" value={`Rs ${(bill as IUtilityBill).water.amount.toLocaleString()}`} isBold={true} />
                  </div>
                </div>
              )}
              
            </CardContent>

            {/* ✅ "BEST OF BEST" FOOTER with Animated Status */}
            <CardFooter className="bg-muted/50 p-6 rounded-b-2xl flex flex-col gap-4 print-footer">
              <AnimatePresence mode="wait">
                {isUtility ? (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="w-full"
                  >
                    <DetailRow label="Utility Charges" value={`Rs ${((bill as IUtilityBill).electricity.amount + (bill as IUtilityBill).water.amount).toLocaleString()}`} />
                    <DetailRow label="Service Charge" value={`Rs ${(bill as IUtilityBill).serviceCharge.toLocaleString()}`} />
                    <DetailRow label="Security Charge" value={`Rs ${(bill as IUtilityBill).securityCharge.toLocaleString()}`} />
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="w-full"
                  >
                    <DetailRow label="Rent Amount" value={`Rs ${(bill as IRentBill).amount.toLocaleString()}`} />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="w-full">
                <DetailRow 
                  label="Bill Total" 
                  value={`Rs ${billAmount.toLocaleString()}`} 
                  isTotal={true} 
                />
              </div>
              
              {/* ✅ "Next Level" Total Outstanding / Paid Status Section */}
              <AnimatePresence mode="wait">
                {bill.status !== 'PAID' ? (
                  <motion.div 
                    key="unpaid"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 rounded-lg bg-red-100/50 border border-red-200 text-center w-full mt-4"
                  >
                    <p className="font-semibold text-red-800">Total Outstanding Balance (All Bills)</p>
                    <p className="text-xl font-bold text-red-600">Rs {bill.totalOutstandingDue.toLocaleString()}</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="paid"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 rounded-lg bg-green-100/50 border border-green-200 text-center w-full mt-4 flex items-center justify-center gap-3"
                  >
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div className="text-left">
                      <p className="font-semibold text-green-800">Paid in Full</p>
                      {bill.paidOnBS && (
                        <p className="text-xs text-green-700">Paid on: {bill.paidOnBS}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardFooter>
          </Card>
           <div className="text-center my-4 print-hidden">
            <Button onClick={() => window.print()} className="shadow-lg"><Printer className="mr-2 h-4 w-4"/> Print Bill</Button>
          </div>
        </motion.div>
      </div>
    </>
  );
}