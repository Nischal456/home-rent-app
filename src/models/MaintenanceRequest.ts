import { Schema, model, models, Document, Model } from 'mongoose';
import { IUser, IRoom } from '@/types';

export interface IMaintenanceRequest extends Document {
  _id: string;
  tenantId: Schema.Types.ObjectId | IUser;
  roomId: Schema.Types.ObjectId | IRoom;
  issue: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: Date;
  completedAt?: Date;
}

const MaintenanceRequestSchema = new Schema<IMaintenanceRequest>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  issue: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
});

const MaintenanceRequest: Model<IMaintenanceRequest> = models.MaintenanceRequest || model<IMaintenanceRequest>('MaintenanceRequest', MaintenanceRequestSchema);
export default MaintenanceRequest;