'use client';

// --- Core React & Next.js Imports ---
import React from 'react';

// --- UI Components from shadcn/ui ---
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// --- Icons from lucide-react ---
import { 
  Printer, Receipt, Zap, Droplets, User, Building, CalendarDays, 
  CheckCircle, Hourglass, AlertTriangle, Shield, Settings, Info 
} from 'lucide-react';

// --- Utilities & Types ---
import { IRentBill, IUtilityBill, IUser, IRoom } from '@/types';
import { printBill } from '@/lib/printBill';
import { cn } from '@/lib/utils';

// --- Type Definitions ---
type CombinedBill = (IRentBill | IUtilityBill) & { type: 'Rent' | 'Utility' };
type Status = 'DUE' | 'PAID' | 'OVERDUE' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

// --- Helper Functions ---
const isTenantPopulated = (tenant: any): tenant is IUser => {
  return tenant && typeof tenant === 'object' && 'fullName' in tenant;
};
const isRoomPopulated = (room: any): room is IRoom => {
  return room && typeof room === 'object' && 'roomNumber' in room;
};

// --- Reusable Sub-Component for Status ---
const StatusBadge = ({ status }: { status: Status }) => {
  const statusConfig = {
    PAID: { text: "Paid", icon: <CheckCircle className="h-3.5 w-3.5" />, className: "bg-emerald-100/80 text-emerald-700 border-emerald-200" },
    DUE: { text: "Due", icon: <Hourglass className="h-3.5 w-3.5" />, className: "bg-amber-100/80 text-amber-700 border-amber-200" },
    PENDING: { text: "Pending", icon: <Hourglass className="h-3.5 w-3.5 animate-spin-slow" />, className: "bg-blue-100/80 text-blue-700 border-blue-200" },
    OVERDUE: { text: "Overdue", icon: <AlertTriangle className="h-3.5 w-3.5" />, className: "bg-red-100/80 text-red-700 border-red-200 animate-pulse" },
  };
  const config = statusConfig[status as keyof typeof statusConfig] || { text: status, icon: null, className: "bg-slate-100/80 text-slate-700" };
  return (
    <Badge variant="outline" className={cn("inline-flex items-center gap-1.5 font-bold tracking-wide rounded-full px-3 py-1 backdrop-blur-md shadow-sm", config.className)}>
      {config.icon}<span>{config.text}</span>
    </Badge>
  );
};

// --- Main Dialog Component ---
interface BillDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bill: CombinedBill | null;
  user?: IUser | null;
}

export function BillDetailsDialog({ isOpen, onClose, bill, user }: BillDetailsDialogProps) {
  if (!bill) return null;

  const isRentBill = bill.type === 'Rent';
  const totalAmount = isRentBill ? (bill as IRentBill).amount : (bill as IUtilityBill).totalAmount;

  // Safely get tenant and room details
  const tenant = isTenantPopulated(bill.tenantId) ? bill.tenantId : user;
  const room = isRoomPopulated(bill.roomId) 
    ? bill.roomId 
    : (user && isRoomPopulated(user.roomId) ? user.roomId : null);
  
  const roomNumber = room ? room.roomNumber : 'N/A';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-xl p-0 border-0 rounded-[2rem] shadow-2xl bg-[#f8fafc] overflow-hidden flex flex-col max-h-[90dvh]">
        
        {/* --- Header Section --- */}
        <div className="relative p-6 md:p-8 bg-white border-b border-slate-100">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-orange-400"></div>
          <DialogHeader className="flex flex-row items-center gap-4 space-y-0 text-left">
            <div className={cn("shrink-0 p-4 rounded-2xl shadow-inner", isRentBill ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600")}>
              {isRentBill ? <Receipt className="w-8 h-8" /> : <Zap className="w-8 h-8" />}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                {bill.type} Bill
              </DialogTitle>
              <DialogDescription className="font-bold text-slate-400 mt-1">
                Detailed breakdown & charges
              </DialogDescription>
            </div>
          </DialogHeader>
        </div>

        {/* --- Scrollable Body Content --- */}
        <div className="flex-1 overflow-y-auto styled-scrollbar p-6 md:p-8 space-y-6">
          
          {/* Top Meta Info Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <User className="w-4 h-4" />
                <span className="text-xs font-extrabold uppercase tracking-wider">Tenant</span>
              </div>
              <span className="font-bold text-slate-800 line-clamp-1">{tenant?.fullName ?? 'N/A'}</span>
            </div>
            
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Building className="w-4 h-4" />
                <span className="text-xs font-extrabold uppercase tracking-wider">Room</span>
              </div>
              <span className="font-bold text-[#0B2863] text-lg leading-none">{roomNumber}</span>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <CalendarDays className="w-4 h-4" />
                <span className="text-xs font-extrabold uppercase tracking-wider">Date (B.S)</span>
              </div>
              <span className="font-bold text-slate-800">{bill.billDateBS ?? 'N/A'}</span>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-start">
               <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Info className="w-4 h-4" />
                <span className="text-xs font-extrabold uppercase tracking-wider">Status</span>
              </div>
              <StatusBadge status={bill.status as Status} />
            </div>
          </div>

          <Separator className="bg-slate-200/60" />

          {/* Charges Breakdown */}
          <div>
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
               <Receipt className="w-5 h-5 text-slate-400" /> Charges Summary
            </h3>
            
            {isRentBill ? (
               // --- Rent Bill Specific Layout ---
               <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                     <p className="text-xs font-extrabold text-blue-400 uppercase tracking-wider mb-1">Period</p>
                     <p className="font-bold text-slate-800 text-lg">{(bill as IRentBill).rentForPeriod}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-xs font-extrabold text-blue-400 uppercase tracking-wider mb-1">Amount</p>
                     <p className="font-black text-[#0B2863] text-xl">Rs {(bill as IRentBill).amount.toLocaleString('en-IN')}</p>
                  </div>
               </div>
            ) : (
              // --- Utility Bill Specific Layout ---
              <div className="space-y-4">
                  {/* Electricity Card */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-50 text-yellow-600 rounded-xl"><Zap className="w-5 h-5" /></div>
                          <h4 className="font-extrabold text-slate-800 text-base">Electricity</h4>
                        </div>
                        <span className="font-black text-slate-900 text-lg">Rs {(bill as IUtilityBill).electricity.amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3 text-center">
                         <div>
                           <p className="text-[10px] font-extrabold text-slate-400 uppercase">Previous</p>
                           <p className="font-bold text-slate-700 mt-0.5">{(bill as IUtilityBill).electricity.previousReading}</p>
                         </div>
                         <div className="border-x border-slate-200">
                           <p className="text-[10px] font-extrabold text-slate-400 uppercase">Current</p>
                           <p className="font-bold text-slate-700 mt-0.5">{(bill as IUtilityBill).electricity.currentReading}</p>
                         </div>
                         <div>
                           <p className="text-[10px] font-extrabold text-yellow-500 uppercase">Units</p>
                           <p className="font-black text-slate-900 mt-0.5">{(bill as IUtilityBill).electricity.unitsConsumed}</p>
                         </div>
                      </div>
                  </div>

                  {/* Water Card */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Droplets className="w-5 h-5" /></div>
                          <h4 className="font-extrabold text-slate-800 text-base">Water</h4>
                        </div>
                        <span className="font-black text-slate-900 text-lg">Rs {(bill as IUtilityBill).water.amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3 text-center">
                         <div>
                           <p className="text-[10px] font-extrabold text-slate-400 uppercase">Previous</p>
                           <p className="font-bold text-slate-700 mt-0.5">{(bill as IUtilityBill).water.previousReading}</p>
                         </div>
                         <div className="border-x border-slate-200">
                           <p className="text-[10px] font-extrabold text-slate-400 uppercase">Current</p>
                           <p className="font-bold text-slate-700 mt-0.5">{(bill as IUtilityBill).water.currentReading}</p>
                         </div>
                         <div>
                           <p className="text-[10px] font-extrabold text-blue-500 uppercase">Units</p>
                           <p className="font-black text-slate-900 mt-0.5">{(bill as IUtilityBill).water.unitsConsumed}</p>
                         </div>
                      </div>
                  </div>

                  {/* Additional Charges */}
                  {((bill as IUtilityBill).serviceCharge > 0 || (bill as IUtilityBill).securityCharge > 0) && (
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                       {(bill as IUtilityBill).serviceCharge > 0 && (
                         <div className="flex justify-between items-center">
                           <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                             <Settings className="w-4 h-4 text-slate-400" /> Service Charge
                           </div>
                           <span className="font-extrabold text-slate-800">Rs {(bill as IUtilityBill).serviceCharge.toLocaleString('en-IN')}</span>
                         </div>
                       )}
                       {(bill as IUtilityBill).serviceCharge > 0 && (bill as IUtilityBill).securityCharge > 0 && <Separator className="bg-slate-100" />}
                       {(bill as IUtilityBill).securityCharge > 0 && (
                         <div className="flex justify-between items-center">
                           <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                             <Shield className="w-4 h-4 text-slate-400" /> Security Charge
                           </div>
                           <span className="font-extrabold text-slate-800">Rs {(bill as IUtilityBill).securityCharge.toLocaleString('en-IN')}</span>
                         </div>
                       )}
                    </div>
                  )}
              </div>
            )}
            
            {/* Remarks Section */}
            {!isRentBill && (bill as IUtilityBill).remarks && (
              <div className="mt-4 bg-orange-50/50 border border-orange-100 rounded-2xl p-4">
                <h4 className="font-extrabold text-orange-800 text-sm mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Note from Admin
                </h4>
                <p className="text-sm font-medium text-orange-900/80 whitespace-pre-wrap leading-relaxed">
                  {(bill as IUtilityBill).remarks}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* --- Fixed Sticky Footer --- */}
        <div className="bg-white border-t border-slate-100 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.04)] z-10 flex flex-col sm:flex-row gap-4 items-center justify-between mt-auto shrink-0">
            <div className="flex flex-col items-center sm:items-start w-full sm:w-auto">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">Total Payable</span>
              <span className="text-3xl font-black text-[#0B2863] tracking-tight">
                Rs {totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            
            <Button 
               size="lg"
               onClick={() => printBill(bill)}
               className="w-full sm:w-auto bg-[#0B2863] hover:bg-blue-800 text-white rounded-xl shadow-lg shadow-blue-900/20 font-bold h-14 px-8 transform-gpu active:scale-95 transition-all duration-200 flex items-center gap-3"
            >
                <Printer className="h-5 w-5" />
                <span className="tracking-wide">Print Invoice</span>
            </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}