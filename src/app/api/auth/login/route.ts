import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  await dbConnect(); // Ensure database is connected

  try {
    const { email, password } = await request.json();

    // Find the user by email, and explicitly include the password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Compare the provided password with the stored hashed password
    const isPasswordCorrect = await bcrypt.compare(password, user.password!);

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create the JWT payload
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    // Sign the JWT, making it valid for 1 day
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'default_secret', {
      expiresIn: '1d',
    });

    const response = NextResponse.json(
        { success: true, message: 'Login successful', token },
        { status: 200 }
    );

    // Set the token as an HTTP-only cookie for security
    response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 1 // 1 day
    });

    return response;

  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json(
      { success: false, message: 'Error logging in' },
      { status: 500 }
    );
  }
}
