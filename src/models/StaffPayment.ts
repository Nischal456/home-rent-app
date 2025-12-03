import mongoose, { Schema, model, models } from 'mongoose';

const StaffPaymentSchema = new Schema({
  staffId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['SALARY', 'BONUS', 'ADVANCE'], required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  remarks: { type: String },
  month: { type: String }, // For salary context
}, { timestamps: true });

export default models.StaffPayment || model('StaffPayment', StaffPaymentSchema);