import { NextResponse as MaintNextResponse } from 'next/server';
import dbConnectMaint from '@/lib/dbConnect';
import MaintenanceRequest from '@/models/MaintenanceRequest';
import { getTokenData as getMaintTokenData } from '@/lib/getTokenData';

export async function GET(request: Request) {
  await dbConnectMaint();
  try {
    const tokenData = getMaintTokenData(request);
    if (!tokenData) return MaintNextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const requests = await MaintenanceRequest.find({ tenantId: tokenData.id }).sort({ createdAt: -1 });
    return MaintNextResponse.json({ success: true, data: requests });
  } catch (error: any) {
    return MaintNextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}