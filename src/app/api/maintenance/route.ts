import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import MaintenanceRequest from '@/models/MaintenanceRequest';
import { getTokenData } from '@/lib/getTokenData';
import User from '@/models/User';

export async function POST(request: Request) {
  await dbConnect();
  try {
    const tokenData = getTokenData(request);
    if (!tokenData) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = await User.findById(tokenData.id);
    if (!user || !user.roomId) return NextResponse.json({ success: false, message: 'You must be assigned to a room to make a request.' }, { status: 400 });

    const { issue, description } = await request.json();
    if (!issue || !description) return NextResponse.json({ success: false, message: 'Issue and description are required.' }, { status: 400 });

    const newRequest = new MaintenanceRequest({ tenantId: user._id, roomId: user.roomId, issue, description });
    await newRequest.save();
    return NextResponse.json({ success: true, message: 'Maintenance request submitted successfully.', data: newRequest }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
