import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Notification from '@/models/Notification';
import { getTokenData } from '@/lib/getTokenData';

export async function GET(request: Request) {
  await dbConnect();
  try {
    const tokenData = getTokenData(request);
    if (!tokenData) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const notifications = await Notification.find({ userId: tokenData.id }).sort({ createdAt: -1 }).limit(20);
    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
    await dbConnect();
    try {
        const tokenData = getTokenData(request);
        if (!tokenData) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        await Notification.updateMany({ userId: tokenData.id, isRead: false }, { $set: { isRead: true } });
        return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
