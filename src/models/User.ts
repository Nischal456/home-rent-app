import { Schema, model, models, Model, Document } from 'mongoose';
import { IUser as IUserType } from '@/types';

type IUserDocument = IUserType & Document;

const UserSchema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['ADMIN', 'TENANT', 'SECURITY', 'ACCOUNTANT', 'CLEANER'], default: 'TENANT' },
  phoneNumber: String,
  roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
  leaseStartDate: { type: Date },
  leaseEndDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  profilePicture: { type: String }, // Native Base64 storage
  pushSubscriptions: { type: Array, default: [] }, // Array of Web-Push Subscription Objects
});

if (models.User) {
  delete models.User;
}
const User: Model<IUserDocument> = model<IUserDocument>('User', UserSchema);
export default User;