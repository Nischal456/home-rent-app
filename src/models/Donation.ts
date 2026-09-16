
import { Schema, model, models, Document, Model } from 'mongoose';

export interface IDonation extends Document {
  donorName: string;
  phone?: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  screenshot?: string;
  isAnonymous: boolean;
  message?: string;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  createdAt: Date;
}

const DonationSchema = new Schema<IDonation>({
  donorName: { type: String, required: true, trim: true },
  phone: { type: String, default: 'N/A', trim: true },
  amount: { type: Number, required: true, min: 1 },
  paymentMethod: { type: String, default: 'esewa' },
  transactionId: { type: String, required: true, trim: true },
  screenshot: { type: String },
  isAnonymous: { type: Boolean, default: false },
  message: { type: String, trim: true },
  status: { type: String, enum: ['VERIFIED', 'PENDING', 'REJECTED'], default: 'VERIFIED' },
  createdAt: { type: Date, default: Date.now },
});

const Donation: Model<IDonation> = models.Donation || model<IDonation>('Donation', DonationSchema);
export default Donation;
