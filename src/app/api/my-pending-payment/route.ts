import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/Payment';
import jwt from 'jsonwebtoken';

interface TokenPayload { id: string; }

export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    const token = request.cookies.get('token')?.value || '';
    if (!token) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    // Ensure the JWT secret is available
    if (!process.env.JWT_SECRET) {
      console.error("FATAL ERROR: JWT_SECRET is not defined.");
      return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
    }

    const tokenData = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;

    const pendingPayment = await Payment.findOne({ tenantId: tokenData.id, status: 'PENDING' });
    
    return NextResponse.json({ success: true, hasPendingPayment: !!pendingPayment });
  } catch (error) {
    let errorMessage = 'An unknown server error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("Error in GET /api/my-pending-payment: ", errorMessage);
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}