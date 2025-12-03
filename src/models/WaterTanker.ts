import mongoose, { Schema, model, models } from 'mongoose';

const WaterTankerSchema = new Schema({
  entryDate: { type: Date, default: Date.now },
  volumeLiters: { type: Number, required: true },
  cost: { type: Number, required: true },
  addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default models.WaterTanker || model('WaterTanker', WaterTankerSchema);