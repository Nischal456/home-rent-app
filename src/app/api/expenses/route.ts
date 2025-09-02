import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Expense from '@/models/Expense';

// ✅ ADD THE SAME FIX HERE
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // await checkAdminAuth(request);
  await dbConnect();
  try {
    const expenses = await Expense.find({}).sort({ date: -1 });
    return NextResponse.json({ success: true, data: expenses });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // await checkAdminAuth(request);
  await dbConnect();
  try {
    const body = await request.json();
    const expense = await Expense.create(body);
    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to create record.' }, { status: 400 });
  }
}