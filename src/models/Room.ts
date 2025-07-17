import { Schema, model, models, Model, Document } from 'mongoose';
import { IRoom as IRoomType } from '@/types';

type IRoomDocument = IRoomType & Document;

const RoomSchema = new Schema({
  roomNumber: { type: String, required: true, unique: true, trim: true },
  floor: { type: String, required: true },
  rentAmount: { type: Number, required: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
});

const Room: Model<IRoomDocument> = models.Room || model<IRoomDocument>('Room', RoomSchema);
export default Room;

