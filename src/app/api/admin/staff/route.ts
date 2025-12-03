import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    // Fetch only users with the SECURITY role
    const staff = await User.find({ role: 'SECURITY' }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: staff });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    const { fullName, email, password, phoneNumber } = await request.json();

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = await User.create({
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      role: 'SECURITY', // ✅ Automatically assign Security role
      status: 'ACTIVE'
    });

    return NextResponse.json({ success: true, message: 'Staff member added successfully', data: newStaff });
  } catch (error) {
    console.error("Error creating staff:", error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}