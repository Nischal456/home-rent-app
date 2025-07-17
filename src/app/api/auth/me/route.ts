import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

// Define a type for the decoded token payload for better type safety
interface DecodedToken {
  id: string;
  email: string;
  role: string;
}

export async function GET(request: NextRequest) {
  // First, check if the JWT_SECRET is even available. If not, the app is misconfigured.
  if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in .env.local");
    return NextResponse.json(
      { success: false, message: 'Server configuration error: Missing JWT secret.' },
      { status: 500 }
    );
  }

  try {
    await dbConnect();

    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication token not found.' }, { status: 401 });
    }

    // Decode the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as DecodedToken;

    // Find the user from the database using the ID from the token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    // If everything is successful, return the user's data
    return NextResponse.json({ success: true, user });

  } catch (error: any) {
    // This block will catch errors from jwt.verify (e.g., invalid token)
    // or database errors.
    console.error('Error in /api/auth/me:', error.message);
    return NextResponse.json(
      { success: false, message: 'Invalid token or server error.', error: error.message },
      { status: 401 } // Use 401 for authentication-related failures
    );
  }
}