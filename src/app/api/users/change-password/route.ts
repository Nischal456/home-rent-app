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

    // ✅ FIX: Added 'await' here
    const token = (await cookies()).get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) {
        console.error("FATAL ERROR: JWT_SECRET is not defined.");
        return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
    }
    
    const tokenData = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;

    const user = await User.findById(tokenData.id).select('+password');
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    // The user.password could be undefined if a user was created without one.
    if (!user.password) {
        return NextResponse.json({ success: false, message: 'User does not have a password set.' }, { status: 400 });
    }

    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({ success: false, message: 'Incorrect old password.' }, { status: 403 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    return NextResponse.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    console.error("Error changing password:", errorMessage);
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}