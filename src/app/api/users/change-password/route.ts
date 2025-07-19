import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

interface TokenPayload { id: string; }

export async function PATCH(request: NextRequest) {
  await dbConnect();
  try {
    const { oldPassword, newPassword } = await request.json();
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ success: false, message: 'Old and new passwords are required.' }, { status: 400 });
    }

    const token = cookies().get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const tokenData = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    const user = await User.findById(tokenData.id).select('+password');
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password!);
    if (!isPasswordCorrect) {
      return NextResponse.json({ success: false, message: 'Incorrect old password.' }, { status: 403 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    return NextResponse.json({ success: true, message: 'Password changed successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}