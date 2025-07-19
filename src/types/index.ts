import { Schema } from 'mongoose';

export interface IUser {
  _id: string;
  fullName: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'TENANT';
  phoneNumber?: string;
  permanentAddress?: string;
  idProofUrl?: string;
  roomId?: Schema.Types.ObjectId | IRoom;
  leaseStartDate?: Date;
  leaseEndDate?: Date;
  createdAt: Date;
}

export interface IRoom {
  _id: string;
  roomNumber: string;
  floor: string;
  rentAmount: number;
  tenantId?: Schema.Types.ObjectId | IUser;
}

export interface IRentBill {
    _id: string;
    tenantId: Schema.Types.ObjectId | IUser;
    roomId: Schema.Types.ObjectId | IRoom;
    billDateBS: string;
    billDateAD: Date;
    rentForPeriod: string;
    amount: number;
    status: 'DUE' | 'PAID' | 'OVERDUE';
    paidOnBS?: string;
    remarks?: string;
}

export interface IUtilityBill {
    _id: string;
    tenantId: Schema.Types.ObjectId | IUser;
    roomId: Schema.Types.ObjectId | IRoom;
    billingMonthBS: string;
    billDateBS: string;
    billDateAD: Date;
    electricity: {
        previousReading: number;
        currentReading: number;
        unitsConsumed: number;
        ratePerUnit: number;
        amount: number;
    };
    water: {
        previousReading: number;
        currentReading: number;
        unitsConsumed: number;
        ratePerUnit: number;
        amount: number;
    };
    serviceCharge: number;
    securityCharge: number;
    totalAmount: number;
    status: 'DUE' | 'PAID';
    paidOnBS?: string;
    remarks?: string;
}

export interface IMaintenanceRequest {
  _id: string;
  tenantId: Schema.Types.ObjectId | IUser;
  roomId: Schema.Types.ObjectId | IRoom;
  issue: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: Date;
  completedAt?: Date;
}

export interface IPayment {
    _id: string;
    tenantId: Schema.Types.ObjectId | IUser;
    amount: number;
    status: 'PENDING' | 'VERIFIED';
    createdAt: Date;
}