import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Room from '@/models/Room'; // <-- The critical import to register the Room schema

export async function GET() {
  await dbConnect();
  try {
    // This line pre-loads the Room model, making it available for populate
    const _ = Room; 
    const tenants = await User.find({ role: 'TENANT' })
      .populate('roomId', 'roomNumber floor')
      .select('-password');

    return NextResponse.json({ success: true, data: tenants });
  } catch (error: any) {
    console.error('Error fetching tenants:', error.message);
    return NextResponse.json(
      { success: false, message: 'Error fetching tenants' },
      { status: 500 }
    );
  }
}