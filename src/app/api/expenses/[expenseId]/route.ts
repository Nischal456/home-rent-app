import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Expense from '@/models/Expense';
// import { checkAdminAuth } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: { expenseId: string } }) {
  // await checkAdminAuth(request);
  await dbConnect();
  try {
    const body = await request.json();
    const updatedExpense = await Expense.findByIdAndUpdate(params.expenseId, body, { new: true });
    if (!updatedExpense) return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: updatedExpense });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update record.' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { expenseId: string } }) {
  // await checkAdminAuth(request);
  await dbConnect();
  try {
    const deletedExpense = await Expense.findByIdAndDelete(params.expenseId);
    if (!deletedExpense) return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Record deleted.' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to delete record.' }, { status: 500 });
  }
}