import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { createNotification } from '@/lib/createNotification';
import { pusherServer } from '@/lib/pusher';

interface TokenPayload {
  id: string;
  role: string;
}

export async function POST(request: NextRequest) {
  if (!process.env.JWT_SECRET) {
    return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
  }

  try {
    // 1. Verify Admin Auth
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
    await dbConnect();
    
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json({ success: false, message: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // 2. Parse Body Data
    const body = await request.json();
    const { targetGroup, targetUserId, title, message, type } = body;

    if (!title || !message || !type) {
        return NextResponse.json({ success: false, message: 'Title, message, and type are required.' }, { status: 400 });
    }

    // 3. Resolve Targets
    let usersToNotify = [];
    if (targetGroup === 'SPECIFIC' && targetUserId) {
        const specificUser = await User.findById(targetUserId);
        if (specificUser) usersToNotify.push(specificUser);
    } else if (targetGroup === 'TENANTS') {
        usersToNotify = await User.find({ role: 'TENANT' });
    } else if (targetGroup === 'SECURITY') {
        usersToNotify = await User.find({ role: 'SECURITY' });
    } else if (targetGroup === 'ALL') {
        usersToNotify = await User.find({ _id: { $ne: adminUser._id } }); // All users except admin
    } else {
        return NextResponse.json({ success: false, message: 'Invalid target selection.' }, { status: 400 });
    }

    if (usersToNotify.length === 0) {
        return NextResponse.json({ success: false, message: 'No users found in targeted group.' }, { status: 404 });
    }

    // 4. Create Notifications & Trigger Pusher
    for (const user of usersToNotify) {
        await createNotification(user._id, title, message, undefined, type);

        // Real-time publish (assuming pusher channel config matches standard in layout 'user-notifications')
        try {
            await pusherServer.trigger('user-notifications', 'new-notification', {
                userId: user._id.toString(),
                title,
                message,
                type,
                createdAt: new Date().toISOString()
            });
        } catch (pusherError) {
            console.error("Pusher error (non-fatal):", pusherError);
        }
    }

    return NextResponse.json({ 
        success: true, 
        message: `Successfully sent notification to ${usersToNotify.length} user(s).` 
    });

  } catch (error) {
    console.error('Error in /api/notifications/push:', error);
    return NextResponse.json({ success: false, message: 'Server error while sending push notification.' }, { status: 500 });
  }
}
