import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function GET() {
  await dbConnect();
  try {
    const guards = await User.find({ role: 'SECURITY' }).select('fullName email phoneNumber');
    return NextResponse.json({ success: true, data: guards });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Default Error Structure' }, { status: 500 });
  }
}
