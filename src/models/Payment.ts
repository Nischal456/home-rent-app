import { Schema, model, models, Document, Model } from 'mongoose';
import { IUser } from '@/types';

export interface IPayment extends Document {
  tenantId: Schema.Types.ObjectId | IUser;
  amount: number;
  status: 'PENDING' | 'VERIFIED';
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'VERIFIED'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now },
});

const Payment: Model<IPayment> = models.Payment || model<IPayment>('Payment', PaymentSchema);
export default Payment;