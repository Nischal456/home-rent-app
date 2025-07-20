import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import MaintenanceRequest from '@/models/MaintenanceRequest';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import '@/models/Room'; // Import for side-effects
import { createNotification } from '@/lib/createNotification'; // ✅ FIX: Import notification helper
import { Types } from 'mongoose'; // ✅ FIX: Import mongoose Types

interface TokenPayload {
  id: string;
  role: 'ADMIN' | 'TENANT';
  fullName?: string; // Add fullName to token payload for notifications
}

// GET function for admins remains unchanged
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

    if (tokenData.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    const requests = await MaintenanceRequest.find({})
      .populate('tenantId', 'fullName')
      .populate('roomId', 'roomNumber')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    let errorMessage = 'An unknown server error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("Error in GET /api/maintenance: ", errorMessage);
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}

// POST function is updated to send notifications
export async function POST(request: NextRequest) {
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

    const user = await User.findById(tokenData.id);
    if (!user || !user.roomId) {
      return NextResponse.json({ success: false, message: 'You must be assigned to a room to make a request.' }, { status: 400 });
    }

    const { issue, description } = await request.json();
    if (!issue || !description) {
      return NextResponse.json({ success: false, message: 'Issue and description are required.' }, { status: 400 });
    }

    const newRequest = new MaintenanceRequest({ tenantId: user._id, roomId: user.roomId, issue, description });
    await newRequest.save();

    // ✅ FIX: Find all admins and send them a notification
    const admins = await User.find({ role: 'ADMIN' });
    if (admins.length > 0) {
        const notificationPromises = admins.map(admin =>
            createNotification(
                admin._id as Types.ObjectId,
                'New Maintenance Request',
                `${user.fullName} submitted a request for: "${issue}"`,
                '/dashboard/maintenance' // Link directly to the new page
            )
        );
        await Promise.all(notificationPromises);
    }

    return NextResponse.json({ success: true, message: 'Maintenance request submitted successfully.', data: newRequest }, { status: 201 });
  } catch (error) {
    let errorMessage = 'An unknown server error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("Error in POST /api/maintenance: ", errorMessage);
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}