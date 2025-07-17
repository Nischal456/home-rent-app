import { Schema, model, models, Model, Document } from 'mongoose';
import { IRentBill as IRentBillType } from '@/types';

type IRentBillDocument = IRentBillType & Document;

const RentBillSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  billDateBS: { type: String, required: true },
  billDateAD: { type: Date, required: true },
  rentForPeriod: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['DUE', 'PAID', 'OVERDUE'], default: 'DUE' },
  paidOnBS: String,
  paymentMethod: String,
  remarks: String,
});

const RentBill: Model<IRentBillDocument> = models.RentBill || model<IRentBillDocument>('RentBill', RentBillSchema);
export default RentBill;