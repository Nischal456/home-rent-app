import { NextRequest as MaintNextRequest, NextResponse as MaintNextResponse } from 'next/server';
import dbConnectMaint from '@/lib/dbConnect';
import MaintenanceRequest from '@/models/MaintenanceRequest';
import jwtMaint from 'jsonwebtoken';

interface MaintTokenPayload { id: string; }

export async function GET(request: MaintNextRequest) {
  await dbConnectMaint();
  try {
    const token = request.cookies.get('token')?.value || '';
    if (!token) return MaintNextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const tokenData = jwtMaint.verify(token, process.env.JWT_SECRET!) as MaintTokenPayload;

    const requests = await MaintenanceRequest.find({ tenantId: tokenData.id }).sort({ createdAt: -1 });
    return MaintNextResponse.json({ success: true, data: requests });
  } catch (error: any) {
    return MaintNextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
