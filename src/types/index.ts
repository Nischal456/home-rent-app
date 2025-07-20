import { Types } from 'mongoose'; // ✅ FIX: Removed the unused 'Schema' import

export interface IUser {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'TENANT';
  phoneNumber?: string;
  roomId?: Types.ObjectId | IRoom;
  leaseStartDate?: Date;
  leaseEndDate?: Date;
  createdAt: Date;
}

export interface IRoom {
  _id: Types.ObjectId;
  roomNumber: string;
  floor: string;
  rentAmount: number;
  tenantId?: Types.ObjectId | IUser;
}

export interface IRentBill {
    _id: Types.ObjectId;
    tenantId: Types.ObjectId | IUser;
    roomId: Types.ObjectId | IRoom;
    billDateBS: string;
    billDateAD: Date;
    rentForPeriod: string;
    amount: number;
    status: 'DUE' | 'PAID' | 'OVERDUE';
    paidOnBS?: string;
    remarks?: string;
}

export interface IUtilityBill {
    _id: Types.ObjectId;
    tenantId: Types.ObjectId | IUser;
    roomId: Types.ObjectId | IRoom;
    billingMonthBS: string;
    billDateBS: string;
    billDateAD: Date;
    electricity: { amount: number; previousReading: number; currentReading: number; unitsConsumed: number; };
    water: { amount: number; previousReading: number; currentReading: number; unitsConsumed: number; };
    serviceCharge: number;
    securityCharge: number;
    totalAmount: number;
    status: 'DUE' | 'PAID' | 'OVERDUE';
    paidOnBS?: string;
    remarks?: string;
}

export interface IMaintenanceRequest {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId | IUser;
  roomId: Types.ObjectId | IRoom;
  issue: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: Date;
  completedAt?: Date;
}

export interface IPayment {
    _id: Types.ObjectId;
    tenantId: Types.ObjectId | IUser;
    amount: number;
    status: 'PENDING' | 'VERIFIED';
    createdAt: Date;
}