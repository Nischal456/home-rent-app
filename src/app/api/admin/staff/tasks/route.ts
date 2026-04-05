import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DailyTask from '@/models/DailyTask';
import User from '@/models/User';
import { pusherServer } from '@/lib/pusher';
import { createNotification } from '@/lib/createNotification';
import { Types } from 'mongoose';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    const { title, description, priority, dateBS, assignedTo } = await request.json();

    if (!title || !dateBS || !assignedTo) {
        return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const newTask = await DailyTask.create({
        title,
        description,
        priority: priority || 'MEDIUM',
        dateBS,
        dateAD: new Date(),
        assignedTo
    });

    // Persistent Database entry for Employee's Notification Bell Dropdown
    await createNotification(
        new Types.ObjectId(assignedTo),
        "🎯 New Task Assigned",
        `You have been assigned: ${title}. Priority: ${priority || 'MEDIUM'}`,
        "/dashboard/staff-portal",
        "IMPORTANT"
    );

    try {
        await pusherServer.trigger(`staff-channel-${assignedTo}`, 'new-task', {
            message: title
        });
    } catch(pushError) {
        console.error("Staff Task Pusher Error:", pushError);
    }

    return NextResponse.json({ success: true, message: 'Task Assigned', data: newTask });
  } catch (error) {
    console.error("Staff Task POST Error:", error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
