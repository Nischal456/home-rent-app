import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Notification from '@/models/Notification';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
}

export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    const token = request.cookies.get('token')?.value || '';
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) {
      console.error("FATAL ERROR: JWT_SECRET is not defined.");
      return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
    }
    
    const tokenData = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;

    if (!tokenData) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // ✅ **1. Calculate the date from 7 days ago.**
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // ✅ **2. Add the date filter to the database query.**
    const notifications = await Notification.find({ 
      userId: tokenData.id,
      createdAt: { $gte: sevenDaysAgo } // Only find notifications created on or after this date
    }).sort({ createdAt: -1 }).limit(20);
    
    return NextResponse.json({ success: true, data: notifications });

  } catch (error) {
    let errorMessage = 'An unknown server error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("Error in GET /api/notifications: ", errorMessage);
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
    await dbConnect();
    try {
        const token = request.cookies.get('token')?.value || '';
        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (!process.env.JWT_SECRET) {
          console.error("FATAL ERROR: JWT_SECRET is not defined.");
          return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
        }

        const tokenData = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;

        if (!tokenData) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        // This logic remains correct for marking notifications as read.
        await Notification.updateMany({ userId: tokenData.id, isRead: false }, { $set: { isRead: true } });
        return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        let errorMessage = 'An unknown server error occurred.';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        console.error("Error in PATCH /api/notifications: ", errorMessage);
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}