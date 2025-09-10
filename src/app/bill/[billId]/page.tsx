'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { IUser, IRoom, IRentBill, IUtilityBill } from '@/types';
import NepaliDate from 'nepali-date-converter';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PopulatedRentBill = IRentBill & { type: 'Rent'; tenantId: IUser; roomId: IRoom; };
type PopulatedUtilityBill = IUtilityBill & { type: 'Utility'; tenantId: IUser; roomId: IRoom; };
type BillData = PopulatedRentBill | PopulatedUtilityBill;

const DetailRow = ({ label, value, isBold = false }: { label: string, value: string | number, isBold?: boolean }) => (
  <div className={`flex justify-between items-center py-1.5 border-b print:py-0.5 ${isBold ? 'font-bold' : ''}`}>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className={`font-semibold text-sm ${isBold ? 'print:text-base' : ''}`}>{value}</p>
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
        if (!res.ok) throw new Error('Bill not found or an error occurred.');
        const result = await res.json();
        if (result.success) setBill(result.data);
        else throw new Error(result.message);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchBill();
  }, [billId]);

  useEffect(() => {
    if (!loading && bill && searchParams.get('print') === 'true') {
      setTimeout(() => window.print(), 500);
    }
  }, [loading, bill, searchParams]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50 p-8"><Skeleton className="h-[80vh] w-full max-w-2xl" /></div>;
  }

  if (error || !bill) {
    return <div className="p-8"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error || 'Could not load bill details.'}</AlertDescription></Alert></div>;
  }

  const isUtility = bill.type === 'Utility';
  const billPeriod = isUtility ? bill.billingMonthBS : bill.rentForPeriod;

  return (
    <>
      {/* ✅ THIS IS THE FIX: Professional print styles to guarantee a single page */}
      <style jsx global>{`
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          html, body {
            width: 210mm;
            height: 297mm;
            font-size: 10pt;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-container {
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }
          .print-card {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          .print-header {
            padding: 1.5cm 1.5cm 1cm 1.5cm !important;
          }
          .print-content {
            flex-grow: 1; /* Allow content to take up space */
            padding: 1cm 1.5cm !important;
            space-y-2 !important;
          }
          .print-title { font-size: 1.5rem !important; }
          .print-total { font-size: 1.25rem !important; }
          .print-hidden { display: none !important; }
          .print-footer {
             padding: 1cm 1.5cm 1.5cm 1.5cm !important;
             margin-top: auto; /* Push footer to the bottom */
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-center justify-center print-container">
        <Card className="w-full max-w-2xl mx-auto shadow-lg print-card">
          <CardHeader className="text-center bg-muted/50 p-6 rounded-t-lg print-header">
            <CardTitle className="text-2xl print-title">Bill Receipt</CardTitle>
            <CardDescription>STG Tower Management</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6 print-content">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><h3 className="font-semibold mb-1">Billed To:</h3><p>{bill.tenantId.fullName}</p><p>Room: {bill.roomId.roomNumber}</p></div>
              <div className="text-right"><h3 className="font-semibold mb-1">Bill Details:</h3><p>Date: {new NepaliDate(new Date(bill.billDateAD)).format('YYYY MMMM DD')}</p><p>For: {billPeriod}</p></div>
            </div>
            
            {/* Utility Breakdown */}
            {isUtility && (
              <div>
                  <h3 className="font-semibold mb-2 text-center">Utility Breakdown</h3>
                  <div className="p-4 rounded-lg bg-gray-50 border space-y-2">
                      <div>
                          <h4 className="font-medium">Electricity</h4>
                          <DetailRow label="Previous Reading" value={bill.electricity.previousReading} /><DetailRow label="Current Reading" value={bill.electricity.currentReading} /><DetailRow label="Units Consumed" value={bill.electricity.unitsConsumed} /><DetailRow label="Amount" value={`Rs ${bill.electricity.amount.toLocaleString()}`} isBold={true} />
                      </div>
                      <div className="pt-2">
                          <h4 className="font-medium">Water</h4>
                          <DetailRow label="Previous Reading" value={bill.water.previousReading} /><DetailRow label="Current Reading" value={bill.water.currentReading} /><DetailRow label="Units Consumed" value={bill.water.unitsConsumed} /><DetailRow label="Amount" value={`Rs ${bill.water.amount.toLocaleString()}`} isBold={true} />
                      </div>
                  </div>
              </div>
            )}

            {/* Payment Summary */}
            <div>
              <h3 className="font-semibold mb-2 text-center">Payment Summary</h3>
              <div className="p-4 rounded-lg bg-gray-50 border">
                {isUtility ? (
                  <>
                    <DetailRow label="Total Utility Charges" value={`Rs ${(bill.electricity.amount + bill.water.amount).toLocaleString()}`} />
                    <DetailRow label="Service Charge" value={`Rs ${bill.serviceCharge.toLocaleString()}`} />
                    <DetailRow label="Security Charge" value={`Rs ${bill.securityCharge.toLocaleString()}`} />
                  </>
                ) : (
                  <DetailRow label="Rent Amount" value={`Rs ${bill.amount.toLocaleString()}`} />
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 p-6 rounded-b-lg flex justify-between items-center print-footer">
            <Badge variant={bill.status === 'PAID' ? 'default' : 'destructive'}>{bill.status}</Badge>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold text-primary print-total">Rs {(isUtility ? bill.totalAmount : bill.amount).toLocaleString()}</p>
            </div>
          </CardFooter>
        </Card>
        <div className="text-center my-4 print-hidden">
          <Button onClick={() => window.print()}>Print Bill</Button>
        </div>
      </div>
    </>
  );
}