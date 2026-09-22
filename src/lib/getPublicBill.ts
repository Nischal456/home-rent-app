import dbConnect from '@/lib/dbConnect';
import RentBill from '@/models/RentBill';
import UtilityBill from '@/models/UtilityBill';
import '@/models/User';
import '@/models/Room';
import { IRentBill, IUtilityBill } from '@/types';

export interface PublicBillData {
  _id: string;
  type: 'Rent' | 'Utility';
  tenantId: any;
  roomId: any;
  billingMonthBS?: string;
  rentForPeriod?: string;
  billDateBS: string;
  billDateAD: string | Date;
  status: 'DUE' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  totalAmount: number; // Normalized for both Rent (amount) and Utility (totalAmount)
  paidAmount: number;
  remainingAmount: number;
  totalOutstandingDue: number; // All unpaid dues of tenant altogether
  paidOnBS?: string;
  remarks?: string;
  electricity?: {
    previousReading?: number;
    currentReading?: number;
    unitsConsumed?: number;
    ratePerUnit?: number;
    rate?: number;
    amount?: number;
  };
  water?: {
    previousReading?: number;
    currentReading?: number;
    unitsConsumed?: number;
    ratePerUnit?: number;
    rate?: number;
    amount?: number;
  };
  threePhase?: {
    previousReading?: number;
    currentReading?: number;
    unitsConsumed?: number;
    ratePerUnit?: number;
    rate?: number;
    amount?: number;
  };
  serviceCharge?: number;
  securityCharge?: number;
  paymentHistory?: any[];
  [key: string]: any;
}

export async function getPublicBill(billId: string): Promise<PublicBillData | null> {
  if (!billId) return null;

  await dbConnect();

  // Run RentBill and UtilityBill lookups in parallel for maximum speed
  const [rentDoc, utilityDoc] = await Promise.all([
    RentBill.findById(billId)
      .populate('tenantId', 'fullName email phone phoneNumber')
      .populate('roomId', 'roomNumber floor rentAmount')
      .lean(),
    UtilityBill.findById(billId)
      .populate('tenantId', 'fullName email phone phoneNumber')
      .populate('roomId', 'roomNumber floor rentAmount')
      .lean(),
  ]);

  const rawBill: any = rentDoc || utilityDoc;
  if (!rawBill) return null;

  const type: 'Rent' | 'Utility' = rentDoc ? 'Rent' : 'Utility';
  const totalAmount = type === 'Rent' ? Number(rawBill.amount || 0) : Number(rawBill.totalAmount || 0);
  const paidAmount = Number(rawBill.paidAmount || 0);

  let remainingAmount = 0;
  if (rawBill.status === 'PAID') {
    remainingAmount = 0;
  } else if (rawBill.remainingAmount != null && !isNaN(Number(rawBill.remainingAmount))) {
    remainingAmount = Math.max(0, Number(rawBill.remainingAmount));
  } else {
    remainingAmount = Math.max(0, totalAmount - paidAmount);
  }

  // Calculate Total Outstanding Balance (all unpaid bills of tenant combined)
  let totalOutstandingDue = 0;
  const tenantId = rawBill.tenantId?._id;

  if (tenantId) {
    try {
      const [otherRentBills, otherUtilityBills] = await Promise.all([
        RentBill.find({
          tenantId,
          _id: { $ne: rawBill._id },
          status: { $in: ['DUE', 'OVERDUE', 'PARTIALLY_PAID'] },
        })
          .select('amount paidAmount remainingAmount status')
          .lean(),
        UtilityBill.find({
          tenantId,
          _id: { $ne: rawBill._id },
          status: { $in: ['DUE', 'OVERDUE', 'PARTIALLY_PAID'] },
        })
          .select('totalAmount paidAmount remainingAmount status')
          .lean(),
      ]);

      otherRentBills.forEach((b: any) => {
        if (b.status === 'PAID') return;
        const rem = b.remainingAmount != null ? Number(b.remainingAmount) : Math.max(0, Number(b.amount || 0) - Number(b.paidAmount || 0));
        totalOutstandingDue += Math.max(0, rem);
      });

      otherUtilityBills.forEach((b: any) => {
        if (b.status === 'PAID') return;
        const rem = b.remainingAmount != null ? Number(b.remainingAmount) : Math.max(0, Number(b.totalAmount || 0) - Number(b.paidAmount || 0));
        totalOutstandingDue += Math.max(0, rem);
      });

      if (rawBill.status !== 'PAID') {
        totalOutstandingDue += remainingAmount;
      }
    } catch (err) {
      console.error('Error calculating total outstanding due:', err);
      totalOutstandingDue = remainingAmount;
    }
  } else {
    totalOutstandingDue = remainingAmount;
  }

  return {
    ...rawBill,
    _id: rawBill._id.toString(),
    type,
    totalAmount,
    paidAmount,
    remainingAmount,
    totalOutstandingDue: Math.round(totalOutstandingDue * 100) / 100,
  };
}
