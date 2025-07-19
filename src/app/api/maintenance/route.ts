import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import MaintenanceRequest from '@/models/MaintenanceRequest';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
}

export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    // --- THE CORE FIX IS HERE ---
    const token = request.cookies.get('token')?.value || '';
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const tokenData = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    // --- END OF FIX ---

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
