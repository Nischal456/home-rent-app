import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DailyTask from '@/models/DailyTask';
import jwt from 'jsonwebtoken';
import NepaliDate from 'nepali-date-converter';
import { pusherServer } from '@/lib/pusher'; // ✅ Premium real-time notifications
import User from '@/models/User';
import { createNotification } from '@/lib/createNotification';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
    await dbConnect();
    try {
        const token = request.cookies.get('token')?.value;
        if (!token) throw new Error("Unauthorized");
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string, role: string };

        if (decoded.role !== 'ADMIN') throw new Error("Forbidden");

        const body = await request.json();

        // Convert Nepali Date string to AD Date for internal sorting
        const dateAD = new NepaliDate(body.dateBS).toJsDate();

        const newTask = await DailyTask.create({
            title: body.title,
            description: body.description,
            location: body.location,
            priority: body.priority,
            dateBS: body.dateBS,
            dateAD: dateAD,
            assignedBy: decoded.id,
            status: 'PENDING'
        });

        // ✅ Real-time Notification to Security Staff
        await pusherServer.trigger('security-channel', 'new-task', {
            title: 'New Task Assigned',
            message: `${body.title} - ${body.priority} Priority`,
            taskId: newTask._id
        });

        const guard = await User.findOne({ role: 'SECURITY' });
        if (guard) {
            await createNotification(
                guard._id as mongoose.Types.ObjectId,
                'New Task Assigned',
                `Admin assigned a new task: ${body.title} (${body.priority} Priority)`,
                '/dashboard/security'
            );
        }

        return NextResponse.json({ success: true, data: newTask });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}