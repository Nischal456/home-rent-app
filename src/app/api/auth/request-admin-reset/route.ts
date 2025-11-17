import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import PasswordResetRequest from '@/models/PasswordResetRequest';
import { pusherServer } from '@/lib/pusher'; // Make sure your pusher.ts file exists
import { IRoom } from '@/types';

export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    const { email } = await request.json();
    const user = await User.findOne({ email, role: 'TENANT' }).populate('roomId');
    
    if (!user) {
      // For security, we don't tell them if the email exists
      return NextResponse.json({ success: true, message: 'Request sent. Admin will be notified.' });
    }

    // Check if a request is already pending
    const existingRequest = await PasswordResetRequest.findOne({ userId: user._id, status: 'PENDING' });
    if (existingRequest) {
      return NextResponse.json({ success: false, message: 'A reset request is already pending for this user.' }, { status: 400 });
    }

    // Create the new password reset request
    const newRequest = await PasswordResetRequest.create({
      userId: user._id,
      email: user.email,
      name: user.fullName,
      room: (user.roomId as IRoom)?.roomNumber || 'N/A',
    });

    // Notify the admin dashboard in real-time
    await pusherServer.trigger('admin-notifications', 'new-password-request', {
      name: newRequest.name,
      room: newRequest.room,
      requestId: newRequest._id,
    });

    return NextResponse.json({ success: true, message: 'Request sent. Admin will be notified.' });

  } catch (error) {
    console.error("Error requesting password reset:", error);
    return NextResponse.json({ success: false, message: 'An internal error occurred.' }, { status: 500 });
  }
}