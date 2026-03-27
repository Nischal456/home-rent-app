import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DailyTask from '@/models/DailyTask';
import jwt from 'jsonwebtoken';
import { pusherServer } from '@/lib/pusher';
import User from '@/models/User';
import mongoose from 'mongoose';
import { createNotification } from '@/lib/createNotification';

// This handles the PATCH request to update a task's status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    await dbConnect();
    try {
        const token = request.cookies.get('token')?.value;
        if (!token) throw new Error("Unauthorized");

        // Verify user is logged in (both Admin and Security can update status)
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string, role: string };

        // Get the task ID from the URL
        const taskId = params.id;
        if (!taskId) throw new Error("Task ID is required");

        // Get the new status from the request body
        const body = await request.json();
        const { status } = body;

        if (!['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
            throw new Error("Invalid status update.");
        }

        // Update the task in the database
        const updatedTask = await DailyTask.findByIdAndUpdate(
            taskId,
            { status: status },
            { new: true } // Return the updated document
        );

        if (!updatedTask) {
            throw new Error("Task not found.");
        }

        // ✅ PREMIUM UPGRADE: Dynamic Real-time Notifications to Admin
        // Alerts the admin instantly when a guard starts OR finishes a task
        if (decoded.role === 'SECURITY') {
            let notifTitle = '';
            let notifMessage = '';

            if (status === 'IN_PROGRESS') {
                notifTitle = 'Task Started ⏳';
                notifMessage = `Security guard started working on: ${updatedTask.title}`;
            } else if (status === 'COMPLETED') {
                notifTitle = 'Task Completed ✅';
                notifMessage = `Security guard successfully finished: ${updatedTask.title}`;
            }

            if (notifTitle) {
                await pusherServer.trigger('admin-channel', 'task-update', {
                    title: notifTitle,
                    message: notifMessage,
                    taskId: updatedTask._id,
                    status: status
                });

                // ✅ DB persistence for Admins
                const admins = await User.find({ role: 'ADMIN' });
                if (admins.length > 0) {
                    const notificationPromises = admins.map(admin => 
                        createNotification(
                            admin._id as mongoose.Types.ObjectId,
                            notifTitle,
                            notifMessage,
                            '/dashboard/security-management'
                        )
                    );
                    await Promise.all(notificationPromises);
                }
            }
        }

        return NextResponse.json({ success: true, data: updatedTask });

    } catch (error: any) {
        console.error("Task Update Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}