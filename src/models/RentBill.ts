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
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number },
  paymentHistory: [
    {
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      remarks: String
    }
  ],
  status: { type: String, enum: ['DUE', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'], default: 'DUE' },
  paidOnBS: String,
  paymentMethod: String,
  remarks: String,
});

RentBillSchema.pre('save', function (next) {
  if (this.amount != null) {
    const currentPaid = this.paidAmount || 0;
    this.remainingAmount = this.amount - currentPaid;
  }
  next();
});

const RentBill: Model<IRentBillDocument> = models.RentBill || model<IRentBillDocument>('RentBill', RentBillSchema);
export default RentBill;