import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Room from '@/models/Room';

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
    
    // --- THE CORE FIX IS HERE ---
    // We use the `request.cookies` store to reliably get the token.
    const token = request.cookies.get('token')?.value || '';
    // --- END OF FIX ---

    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication token not found.' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
    
    const _ = Room; 
    
    const user = await User.findById(decoded.id)
      .select('-password')
      .populate('roomId');

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Error in /api/auth/me:', error.message);
    return NextResponse.json({ success: false, message: 'Invalid token or server error.' }, { status: 401 });
  }
}
