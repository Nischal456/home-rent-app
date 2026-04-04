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
import { toast } from 'react-hot-toast';

// ✅ "BEST OF BEST" ICONS
import { 
    AlertCircle, Printer, Zap, Droplets, Banknote, Calendar, Home, User, Scale, 
    Shield, Wrench, FileText, CheckCircle, Share2
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
      isTotal && "text-base font-bold text-gray-800"
    )}>
      {label}
    </p>
    <p className={cn(
      "font-semibold text-sm text-gray-900", 
      isBold && "font-bold", 
      isTotal && "text-2xl font-bold text-primary"
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

  const handleShare = async () => {
    if (!bill) return;
    const billUrl = window.location.href; 
    const isUtility = bill.type === 'Utility';
    
    // Explicit typing 
    const utilityBill = bill as unknown as IUtilityBill;
    const rentBill = bill as unknown as IRentBill;
    
    const tenantName = bill.tenantId?.fullName || 'Tenant';
    const total = isUtility ? utilityBill.totalAmount : rentBill.amount;
    const period = isUtility ? utilityBill.billingMonthBS : rentBill.rentForPeriod;

    let ratesStr = '';
    if (isUtility) {
      const eRate = utilityBill.electricity?.ratePerUnit || utilityBill.electricity?.rate || 19;
      const wRate = utilityBill.water?.ratePerUnit || utilityBill.water?.rate || 0.30;
      ratesStr = `Rates: Elec Rs ${eRate}/unit, Water Rs ${wRate}/Litre.\n`;
    }

    const remarksData = bill.remarks?.trim() || '';

    const shareText = `${bill.type} Bill for ${tenantName} (${period}). ` +
      `Total: Rs ${total.toLocaleString('en-IN')}. ` +
      `Status: ${bill.status}.\n` +
      ratesStr +
      (remarksData ? `Remarks: ${remarksData}\n\n` : `\n`) + 
      `View Full Details Here:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `STG Tower ${bill.type} Bill`,
          text: shareText,
          url: billUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error("Share failed:", err);
          toast.error("Could not open native share.");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(billUrl);
        toast.success('Bill link copied to clipboard!');
      } catch (err) {
        toast.error('Could not copy link.');
      }
    }
  };

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
  // ✅ FIX: Explicit type casting to access properties safely
  const utilityBill = bill as unknown as IUtilityBill;
  const rentBill = bill as unknown as IRentBill;

  const billPeriod = isUtility ? utilityBill.billingMonthBS : rentBill.rentForPeriod;
  const billAmount = isUtility ? utilityBill.totalAmount : rentBill.amount;

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
                  <Image src="/home.png" alt="Logo" width={48} height={48} className="rounded" />
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
                    <h4 className="font-medium text-gray-700">Electricity (Rate: Rs {utilityBill.electricity.ratePerUnit || utilityBill.electricity.rate || 19} / unit)</h4>
                    <DetailRow label="Previous Reading" value={utilityBill.electricity.previousReading} />
                    <DetailRow label="Current Reading" value={utilityBill.electricity.currentReading} />
                    <DetailRow label="Units Consumed" value={utilityBill.electricity.unitsConsumed} />
                    <DetailRow label="Electricity Total" value={`Rs ${utilityBill.electricity.amount.toLocaleString()}`} isBold={true} />
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 border print-utility-box">
                    <h4 className="font-medium text-gray-700">Water (Rate: Rs {utilityBill.water.ratePerUnit || utilityBill.water.rate || 0.3} / Litre)</h4>
                    <DetailRow label="Previous Reading" value={utilityBill.water.previousReading} />
                    <DetailRow label="Current Reading" value={utilityBill.water.currentReading} />
                    <DetailRow label="Litres Consumed" value={utilityBill.water.unitsConsumed} />
                    <DetailRow label="Water Total" value={`Rs ${utilityBill.water.amount.toLocaleString()}`} isBold={true} />
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              <div className="page-break-avoid">
                <h3 className="font-semibold mb-2 text-center text-gray-800">Payment Summary</h3>
                <div className="p-4 rounded-lg bg-gray-50 border print-utility-box">
                  {isUtility ? (
                    <>
                      {/* ✅ FIX: Correctly accessing properties from 'utilityBill' */}
                      <DetailRow label="Total Utility Charges" value={`Rs ${(utilityBill.electricity.amount + utilityBill.water.amount).toLocaleString()}`} />
                      <DetailRow label="Service Charge" value={`Rs ${utilityBill.serviceCharge.toLocaleString()}`} />
                      <DetailRow label="Security Charge" value={`Rs ${utilityBill.securityCharge.toLocaleString()}`} />
                    </>
                  ) : (
                    /* ✅ FIX: Correctly accessing properties from 'rentBill' */
                    <DetailRow label="Rent Amount" value={`Rs ${rentBill.amount.toLocaleString()}`} />
                  )}
                </div>
              </div>
              {/* Extras & Remarks */}
              {bill.remarks?.trim() && (
                <div className="page-break-avoid w-full">
                  <h3 className="flex items-center justify-center gap-2 font-semibold mb-2 text-center text-gray-800"><FileText className="w-4 h-4 text-gray-500" /> Remarks</h3>
                  <div className="p-4 rounded-xl bg-yellow-50/60 border border-yellow-200 text-sm text-yellow-800 italic text-center leading-relaxed">
                    "{bill.remarks.trim()}"
                  </div>
                </div>
              )}
            </CardContent>

            {/* Footer */}
            <CardFooter className="bg-muted/50 p-6 rounded-b-2xl flex flex-col gap-5 print-footer">
              <div className="w-full">
                <DetailRow 
                  label="Bill Total" 
                  value={`Rs ${billAmount.toLocaleString()}`} 
                  isTotal={true} 
                />
                {(parseFloat(bill.paidAmount as any) > 0 || bill.status === 'PARTIALLY_PAID') && (
                    <DetailRow 
                      label="Paid Amount" 
                      value={<span className="text-green-600">Rs {(bill.paidAmount || 0).toLocaleString()}</span>} 
                      isBold={true} 
                    />
                )}
                <div className="flex justify-between items-center py-2.5">
                    <p className="text-base font-bold text-gray-800 uppercase tracking-wider">Remaining Due</p>
                    <p className="text-2xl font-black text-red-600">Rs {(bill.remainingAmount ?? billAmount).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="w-full space-y-3">
                  <AnimatePresence mode="wait">
                    {/* Status of THIS specific bill */}
                    {bill.status === 'PAID' ? (
                      <motion.div 
                        key="paid"
                        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                        className="w-full p-4 rounded-xl bg-green-100/60 border border-green-200 text-green-800 flex items-center justify-center gap-3"
                      >
                        <CheckCircle className="h-6 w-6" />
                        <div className="text-left">
                            <p className="font-bold text-lg">Fully Paid</p>
                            {bill.paidOnBS && <p className="text-xs opacity-80 font-medium">Clearance Date: {bill.paidOnBS}</p>}
                        </div>
                      </motion.div>
                    ) : bill.status === 'PARTIALLY_PAID' ? (
                      <motion.div 
                        key="partial"
                        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                        className="w-full p-4 rounded-xl bg-blue-50 border border-blue-200 text-center"
                      >
                        <p className="text-sm font-bold text-blue-800 mb-1 tracking-wider uppercase">This Bill Status</p>
                        <p className="text-xl font-black text-blue-600">PARTIALLY PAID</p>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="due"
                        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                        className="w-full p-4 rounded-xl bg-orange-50 border border-orange-200 text-center"
                      >
                        <p className="text-sm font-bold text-orange-800 mb-1 tracking-wider uppercase">This Bill Status</p>
                        <p className="text-xl font-black text-orange-600">DUE</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Comprehensive Outstanding Balance Summary for entire Tenant Account */}
                  <AnimatePresence mode="wait">
                    {bill.totalOutstandingDue > 0 ? (
                      <motion.div 
                          key="outstanding"
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className="w-full p-4 mt-2 rounded-xl bg-red-50 border-2 border-red-200 text-center shadow-sm"
                      >
                        <p className="text-xs font-bold text-red-800/80 mb-1 uppercase tracking-widest">Total Outstanding Balance</p>
                        <p className="text-sm font-medium text-red-800/80 mb-2">(Including all pending rent & utility bills)</p>
                        <p className="text-3xl font-extrabold text-red-600">Rs {bill.totalOutstandingDue.toLocaleString()}</p>
                      </motion.div>
                    ) : (
                      <motion.div 
                          key="cleared"
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className="w-full p-4 mt-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center flex flex-col items-center justify-center gap-1 shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                           <Shield className="h-5 w-5" />
                           <p className="font-extrabold text-lg">All Cleared!</p>
                        </div>
                        <p className="text-sm font-medium opacity-80">You have no pending outstanding balances.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </div>
            </CardFooter>
          </Card>
          
          <div className="text-center mt-10 mb-12 print-hidden">
            <Button 
                onClick={handleShare} 
                className="shadow-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-full px-10 py-7 text-lg font-bold transition-all hover:-translate-y-1 hover:shadow-indigo-500/50 active:scale-95 flex items-center justify-center mx-auto"
            >
                <Share2 className="mr-3 h-6 w-6" /> Share This Bill
            </Button>
            <p className="mt-4 text-xs tracking-wide text-gray-500 font-semibold uppercase">Quick share via WhatsApp or Messenger</p>
          </div>
        </motion.div>
      </div>
    </>
  );
}