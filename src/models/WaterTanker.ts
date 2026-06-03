import mongoose, { Schema, model, models } from 'mongoose';

const PaymentHistorySchema = new Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  remarks: { type: String, default: '' },
  receipt: { type: String }, // Base64 string for file upload
  method: { type: String, enum: ['CASH', 'BANK_TRANSFER', 'ESEWA', 'KHALTI', 'OTHER'], default: 'CASH' }
});

const WaterTankerSchema = new Schema({
  entryDate: { type: Date, default: Date.now },
  volumeLiters: { type: Number, default: 0 },
  cost: { type: Number, required: true },
  vendor: { type: String, default: 'General Vendor' },
  remarks: { type: String, default: '' },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number },
  status: { type: String, enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERPAID'], default: 'UNPAID' },
  paymentHistory: { type: [PaymentHistorySchema], default: [] },
  addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

WaterTankerSchema.pre('save', function (next) {
  const currentPaid = this.paidAmount || 0;
  this.remainingAmount = this.cost - currentPaid;

  if (currentPaid === 0) {
    this.status = 'UNPAID';
  } else if (currentPaid < this.cost) {
    this.status = 'PARTIALLY_PAID';
  } else if (currentPaid === this.cost) {
    this.status = 'PAID';
  } else {
    this.status = 'OVERPAID';
  }
  next();
});

export default models.WaterTanker || model('WaterTanker', WaterTankerSchema);