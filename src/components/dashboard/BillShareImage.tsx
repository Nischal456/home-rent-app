'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { IRentBill, IUtilityBill, IUser, IRoom } from '@/types';
import { Building, Receipt, Zap } from 'lucide-react';
import Image from 'next/image';

type StatementEntry = (IRentBill & { type: 'Rent' }) | (IUtilityBill & { type: 'Utility' });

const DetailRow = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-medium text-xs text-slate-700">{value}</p>
    </div>
);

export const BillShareImage = React.forwardRef<HTMLDivElement, { bill: StatementEntry | null }>(({ bill }, ref) => {
    if (!bill) return null;

    const tenant = bill.tenantId as IUser;
    const room = bill.roomId as IRoom;
    const isRentBill = bill.type === 'Rent';

    return (
        <div ref={ref} className="fixed top-0 left-0 opacity-0 z-[-10] p-6 w-[450px] bg-gradient-to-br from-slate-50 to-slate-200 font-sans"> 
            <div className="bg-white rounded-xl shadow-lg p-6">
                <header className="flex items-center gap-3 pb-4 border-b border-slate-200">
                    <Image src="/logo.png" alt="Logo" width={48} height={48} className="rounded-full" />
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">STG Tower</h1>
                        <p className="text-sm text-slate-500">{isRentBill ? 'Rent Bill' : 'Utility Bill'} Receipt</p>
                    </div>
                </header>

                <section className="grid grid-cols-2 gap-4 text-xs text-slate-600 my-4">
                    <div>
                        <p className="font-bold text-slate-700">BILLED TO</p>
                        <p>{tenant?.fullName}</p>
                        <p>Room: {room?.roomNumber}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-slate-700">BILL DATE</p>
                        <p>{bill.billDateBS}</p>
                        <p className="font-bold text-slate-700 mt-1">STATUS</p>
                        <Badge variant={bill.status === 'PAID' ? 'default' : 'destructive'} className="mt-1 text-xs">{bill.status}</Badge>
                    </div>
                </section>

                <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-slate-700 text-center bg-slate-100 p-2 rounded-md">
                        Bill for {isRentBill ? bill.rentForPeriod : bill.billingMonthBS}
                    </h2>
                    
                    {isRentBill ? (
                        <DetailRow label="Rent Amount" value={`Rs ${bill.amount.toLocaleString()}`} />
                    ) : (
                        <>
                            <DetailRow label="Electricity" value={`Rs ${bill.electricity.amount.toLocaleString()}`} />
                            <DetailRow label="Water" value={`Rs ${bill.water.amount.toLocaleString()}`} />
                            <DetailRow label="Service Charge" value={`Rs ${bill.serviceCharge.toLocaleString()}`} />
                            <DetailRow label="Security Charge" value={`Rs ${bill.securityCharge.toLocaleString()}`} />
                        </>
                    )}
                </section>

                <footer className="mt-4 pt-4 border-t-2 border-dashed border-slate-300">
                    <div className="flex justify-between items-center text-slate-800">
                        <span className="text-md font-medium">Total Amount</span>
                        <span className="text-2xl font-bold text-primary">Rs {(isRentBill ? bill.amount : bill.totalAmount).toLocaleString()}</span>
                    </div>
                </footer>
            </div>
            <div className="text-center mt-4 text-xs text-slate-400"><p>Thank you for your tenancy.</p></div>
        </div>
    );
});

BillShareImage.displayName = 'BillShareImage';