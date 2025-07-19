import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/Payment';
import jwt from 'jsonwebtoken';

interface TokenPayload { id: string; }

export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    const token = request.cookies.get('token')?.value || '';
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const tokenData = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    const pendingPayment = await Payment.findOne({ tenantId: tokenData.id, status: 'PENDING' });
    
    return NextResponse.json({ success: true, hasPendingPayment: !!pendingPayment });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
