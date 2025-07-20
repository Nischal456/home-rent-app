import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import RentBill from '@/models/RentBill';
import jwt from 'jsonwebtoken';

interface TokenPayload { id: string; role: string; }

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
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

    if (!tokenData || tokenData.role !== 'TENANT') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const rentBills = await RentBill.find({ tenantId: tokenData.id }).sort({ billDateAD: -1 });
    return NextResponse.json({ success: true, data: rentBills });
  } catch (error) {
    let errorMessage = 'An unknown server error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("Error in GET /api/my-bills/rent: ", errorMessage);
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}