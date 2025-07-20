import { Types, Schema } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId; // Corrected
  fullName: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'TENANT';
  phoneNumber?: string;
  roomId?: Types.ObjectId | IRoom; // Corrected
  leaseStartDate?: Date;
  leaseEndDate?: Date;
  createdAt: Date;
}

export interface IRoom {
  _id: Types.ObjectId; // Corrected
  roomNumber: string;
  floor: string;
  rentAmount: number;
  tenantId?: Types.ObjectId | IUser; // Corrected
}

export interface IRentBill {
    _id: Types.ObjectId; // Corrected
    tenantId: Types.ObjectId | IUser; // Corrected
    roomId: Types.ObjectId | IRoom; // Corrected
    billDateBS: string;
    billDateAD: Date;
    rentForPeriod: string;
    amount: number;
    status: 'DUE' | 'PAID' | 'OVERDUE';
    paidOnBS?: string;
    remarks?: string;
}

export interface IUtilityBill {
    _id: Types.ObjectId; // Corrected
    tenantId: Types.ObjectId | IUser; // Corrected
    roomId: Types.ObjectId | IRoom; // Corrected
    billingMonthBS: string;
    billDateBS: string;
    billDateAD: Date;
    electricity: { amount: number; previousReading: number; currentReading: number; unitsConsumed: number; };
    water: { amount: number; previousReading: number; currentReading: number; unitsConsumed: number; };
    serviceCharge: number;
    securityCharge: number;
    totalAmount: number;
    status: 'DUE' | 'PAID';
    paidOnBS?: string;
    remarks?: string;
}

export interface IMaintenanceRequest {
  _id: Types.ObjectId; // Corrected
  tenantId: Types.ObjectId | IUser; // Corrected
  roomId: Types.ObjectId | IRoom; // Corrected
  issue: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: Date;
  completedAt?: Date;
}

export interface IPayment {
    _id: Types.ObjectId; // Corrected
    tenantId: Types.ObjectId | IUser; // Corrected
    amount: number;
    status: 'PENDING' | 'VERIFIED';
    createdAt: Date;
}