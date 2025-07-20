import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Room from '@/models/Room'; // Keep this import, it's used by Mongoose populate

interface TokenPayload {
  id: string;
}

export async function GET(request: NextRequest) {
  if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in .env.local");
    return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
  }

  try {
    await dbConnect();
    
    const token = request.cookies.get('token')?.value || '';

    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication token not found.' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
    
    // The 'Room' model is needed for the .populate('roomId') to work correctly
    const user = await User.findById(decoded.id)
      .select('-password')
      .populate('roomId');

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    // Check if the error is an instance of Error to safely access .message
    if (error instanceof Error) {
        console.error('Error in /api/auth/me:', error.message);
    } else {
        console.error('An unknown error occurred in /api/auth/me:', error);
    }
    return NextResponse.json({ success: false, message: 'Invalid token or server error.' }, { status: 401 });
  }
}