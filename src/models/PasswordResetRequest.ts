import mongoose, { Schema, model, models, Document } from 'mongoose';
import { IUser } from '@/types'; // Assumes you have IUser in your types

export interface IPasswordResetRequest extends Document {
  userId: mongoose.Types.ObjectId | IUser;
  email: string;
  name: string;
  room: string;
  status: 'PENDING' | 'COMPLETED';
  createdAt: Date;
}

const PasswordResetRequestSchema = new Schema<IPasswordResetRequest>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  room: { type: String, default: 'N/A' },
  status: { type: String, enum: ['PENDING', 'COMPLETED'], default: 'PENDING' },
}, {
  timestamps: true,
});

const PasswordResetRequest = models.PasswordResetRequest || model<IPasswordResetRequest>('PasswordResetRequest', PasswordResetRequestSchema);

export default PasswordResetRequest;