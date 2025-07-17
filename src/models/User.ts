import { Schema, model, models, Model, Document } from 'mongoose';
import { IUser as IUserType } from '@/types';

type IUserDocument = IUserType & Document;

const UserSchema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['ADMIN', 'TENANT'], default: 'TENANT' },
  phoneNumber: String,
  roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
  leaseStartDate: { type: Date },
  leaseEndDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const User: Model<IUserDocument> = models.User || model<IUserDocument>('User', UserSchema);
export default User;