import { Schema, model, models, Document, Model } from 'mongoose';
import { IMaintenanceRequest as IMaintenanceRequestType } from '@/types';

// This creates the Mongoose Document type using a type alias
type IMaintenanceRequestDocument = IMaintenanceRequestType & Document;

const MaintenanceRequestSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  issue: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
});

const MaintenanceRequest: Model<IMaintenanceRequestDocument> = models.MaintenanceRequest || model<IMaintenanceRequestDocument>('MaintenanceRequest', MaintenanceRequestSchema);
export default MaintenanceRequest;
