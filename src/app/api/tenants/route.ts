import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import '@/models/Room'; // ✅ FIX: Import for side-effects to register schema

export async function GET() {
  await dbConnect();
  try {
    const tenants = await User.find({ role: 'TENANT' })
      .populate('roomId', 'roomNumber floor')
      .select('-password');

    return NextResponse.json({ success: true, data: tenants });
  } catch (error) {
    let errorMessage = "An unknown error occurred while fetching tenants.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('Error fetching tenants:', errorMessage);
    return NextResponse.json(
      { success: false, message: 'Error fetching tenants' },
      { status: 500 }
    );
  }
}