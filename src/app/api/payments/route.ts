import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/Payment';
import jwt from 'jsonwebtoken';

// This is the shape of the token payload
interface TokenPayload {
  id: string;
  role: 'ADMIN' | 'TENANT';
}

export async function GET(request: NextRequest) {
  try {
    // 1. Get token from cookies
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized: No token provided' }, { status: 401 });
    }
    
    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not set in environment variables");
        return NextResponse.json({ success: false, message: "Server configuration error." }, { status: 500 });
    }

    // 2. Verify token and check for admin role
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized: Admin access required' }, { status: 403 });
    }
    
    // 3. Connect to the database
    await dbConnect();

    // 4. Fetch all payments with 'PENDING' status
    const pendingPayments = await Payment.find({ status: 'PENDING' })
      .populate('tenantId', 'fullName') // Also get the tenant's name
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: pendingPayments });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
    console.error('Error in GET /api/payments:', errorMessage);
    // Return a generic error to the client for security
    return NextResponse.json({ success: false, message: 'An error occurred while fetching payments.' }, { status: 500 });
  }
}