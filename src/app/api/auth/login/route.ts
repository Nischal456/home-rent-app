import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { email, password } = await request.json();
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password!);
    if (!isPasswordCorrect) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    // --- THE CORE FIX FOR THE "UNDEFINED" BUG ---
    // We now include the user's fullName in the token payload.
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName, // <-- THIS LINE IS THE FIX
    };
    // --- END OF FIX ---

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: '1d' });
    const response = NextResponse.json({ success: true, message: 'Login successful', token }, { status: 200 });
    response.cookies.set('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 60 * 60 * 24 });
    return response;
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ success: false, message: 'Error logging in' }, { status: 500 });
  }
}