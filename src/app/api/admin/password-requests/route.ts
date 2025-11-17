import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PasswordResetRequest from '@/models/PasswordResetRequest';
import User from '@/models/User';
import jwt from 'jsonwebtoken'; // ✅ Replaced 'next-auth/jwt' with 'jsonwebtoken'

export const dynamic = 'force-dynamic'; // Ensures data is always fresh

// Define the shape of your custom token payload
interface TokenPayload {
  id: string;
  role: 'ADMIN' | 'TENANT';
}

export async function GET(request: NextRequest) {
  try {
    // ✅ This is your app's correct authentication method
    const tokenCookie = request.cookies.get('token')?.value;
    if (!tokenCookie) {
      return NextResponse.json({ success: false, message: 'Unauthorized: No token' }, { status: 401 });
    }
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    const decoded = jwt.verify(tokenCookie, process.env.JWT_SECRET) as TokenPayload;
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden: Admin access required' }, { status: 403 });
    }
    // --- End of Auth Check ---

    await dbConnect();
    const requests = await PasswordResetRequest.find({ status: 'PENDING' })
      .populate('userId', 'fullName email') // Get tenant's name and email
      .sort({ createdAt: 'asc' });
      
    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    console.error("Error fetching password requests:", error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}