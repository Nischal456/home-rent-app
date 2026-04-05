import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    if (!process.env.JWT_SECRET) {
        return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
    }

    try {
        const token = cookies().get('token')?.value;
        if (!token) return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
        await dbConnect();
        
        const user = await User.findById(decoded.id);
        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
        }

        const body = await request.json();
        const { endpoint } = body;

        if (!endpoint) {
            return NextResponse.json({ success: false, message: 'Endpoint is required to unsubscribe.' }, { status: 400 });
        }

        if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
            // Filter out the subscription that matches the endpoint strictly
            user.pushSubscriptions = user.pushSubscriptions.filter((sub: any) => sub.endpoint !== endpoint);
            user.markModified('pushSubscriptions'); // Explicitly mark Mixed Array as modified
            await user.save();
        }

        return NextResponse.json({ success: true, message: 'Push subscription successfully removed.' });

    } catch (error) {
        console.error('Error in /api/notifications/unsubscribe:', error);
        return NextResponse.json({ success: false, message: 'Server error while removing push subscription.' }, { status: 500 });
    }
}
