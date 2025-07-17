import { Schema, model, models, Model, Document } from 'mongoose';
import { IUtilityBill as IUtilityBillType } from '@/types';

type IUtilityBillDocument = IUtilityBillType & Document;

const UtilityBillSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  billingMonthBS: { type: String, required: true },
  billDateBS: { type: String, required: true },
  billDateAD: { type: Date, required: true },
  electricity: {
    previousReading: Number,
    currentReading: Number,
    unitsConsumed: Number,
    ratePerUnit: Number,
    amount: Number,
  },
  water: {
    previousReading: Number,
    currentReading: Number,
    unitsConsumed: Number,
    ratePerUnit: Number,
    amount: Number,
  },
  serviceCharge: Number,
  securityCharge: Number,
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['DUE', 'PAID'], default: 'DUE' },
  paidOnBS: String,
  remarks: String,
});

const UtilityBill: Model<IUtilityBillDocument> = models.UtilityBill || model<IUtilityBillDocument>('UtilityBill', UtilityBillSchema);
export default UtilityBill;
