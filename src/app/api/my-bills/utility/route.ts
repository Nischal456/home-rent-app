import { NextRequest as UtilNextRequest, NextResponse as UtilNextResponse } from 'next/server';
import dbConnectUtil from '@/lib/dbConnect';
import UtilityBill from '@/models/UtilityBill';
import jwtUtil from 'jsonwebtoken';

interface UtilTokenPayload { id: string; role: string; }

export async function GET(request: UtilNextRequest) {
  try {
    await dbConnectUtil();
    const token = request.cookies.get('token')?.value || '';
    if (!token) {
        return UtilNextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Ensure the JWT secret is available
    if (!process.env.JWT_SECRET) {
      console.error("FATAL ERROR: JWT_SECRET is not defined.");
      return UtilNextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
    }

    const tokenData = jwtUtil.verify(token, process.env.JWT_SECRET) as UtilTokenPayload;

    if (!tokenData || tokenData.role !== 'TENANT') {
      return UtilNextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const utilityBills = await UtilityBill.find({ tenantId: tokenData.id }).sort({ billDateAD: -1 });
    return UtilNextResponse.json({ success: true, data: utilityBills });
  } catch (error) {
    let errorMessage = 'An unknown server error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("Error in GET /api/my-bills/utility: ", errorMessage);
    return UtilNextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}