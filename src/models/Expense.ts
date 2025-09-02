import mongoose, { Schema, model, models, Document } from 'mongoose';
import { IExpense } from '@/types';

const ExpenseSchema = new Schema<IExpense>({
  type: { type: String, enum: ['INCOME', 'EXPENSE'], required: true },
  category: { 
    type: String, 
    enum: ['MAINTENANCE', 'SALARY', 'UTILITIES', 'RENT_INCOME', 'OTHER'], 
    required: true 
  },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
}, {
  timestamps: true,
});

const Expense = models.Expense || model<IExpense>('Expense', ExpenseSchema);

export default Expense;