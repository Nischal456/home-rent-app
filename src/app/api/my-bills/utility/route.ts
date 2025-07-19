import { NextRequest as UtilNextRequest, NextResponse as UtilNextResponse } from 'next/server';
import dbConnectUtil from '@/lib/dbConnect';
import UtilityBill from '@/models/UtilityBill';
import jwtUtil from 'jsonwebtoken';

interface UtilTokenPayload { id: string; role: string; }

export async function GET(request: UtilNextRequest) {
  try {
    await dbConnectUtil();
    const token = request.cookies.get('token')?.value || '';
    if (!token) return UtilNextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const tokenData = jwtUtil.verify(token, process.env.JWT_SECRET!) as UtilTokenPayload;

    if (!tokenData || tokenData.role !== 'TENANT') {
      return UtilNextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const utilityBills = await UtilityBill.find({ tenantId: tokenData.id }).sort({ billDateAD: -1 });
    return UtilNextResponse.json({ success: true, data: utilityBills });
  } catch (error: any) {
    return UtilNextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}