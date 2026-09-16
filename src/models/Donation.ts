import mongoose, { Schema, model, models } from 'mongoose';
import { IDonation } from '@/types';

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

const Donation = models.Donation || model<IDonation>('Donation', DonationSchema);

export default Donation;
