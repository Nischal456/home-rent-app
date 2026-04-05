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
        const { subscription } = body;

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ success: false, message: 'Invalid subscription object.' }, { status: 400 });
        }

        // Initialize array if it doesn't exist securely into Mongoose
        if (!user.pushSubscriptions) {
            user.pushSubscriptions = [];
        }

        // Check if this endpoint already exists to avoid duplicate arrays taking up MongoDB storage
        const exists = user.pushSubscriptions.some((sub: any) => sub.endpoint === subscription.endpoint);
        if (!exists) {
            user.pushSubscriptions.push(subscription);
            await user.save();
        }

        return NextResponse.json({ success: true, message: 'Push subscription successfully saved.' });

    } catch (error) {
        console.error('Error in /api/notifications/subscribe:', error);
        return NextResponse.json({ success: false, message: 'Server error while storing push subscription.' }, { status: 500 });
    }
}
