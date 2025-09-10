import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Submission from '@/models/Submission';
import { pusherServer } from '@/lib/pusher';
// import { getToken } from 'next-auth/jwt'; // You can uncomment this to secure the GET route

export async function GET(request: NextRequest) {
  // Add admin auth check here
  await dbConnect();
  try {
    // Fetch submissions and unread count concurrently for performance
    const [submissions, unreadCount] = await Promise.all([
        Submission.find({}).sort({ createdAt: -1 }).lean(),
        Submission.countDocuments({ status: 'UNREAD' })
    ]);
    return NextResponse.json({ success: true, data: { submissions, unreadCount } });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}


// ✅ THE FIX: This is the POST function that was missing.
// It handles submissions from your public "Report an Issue" page.
export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    const { name, contact, subject, message } = await request.json();
    if (!name || !contact || !subject || !message) {
      return NextResponse.json({ success: false, message: 'All fields are required.' }, { status: 400 });
    }

    const newSubmission = await Submission.create({ name, contact, subject, message, status: 'UNREAD' });

    // Trigger a real-time notification to the admin dashboard
    await pusherServer.trigger('admin-notifications', 'new-submission', {
      subject: newSubmission.subject,
      name: newSubmission.name,
    });

    return NextResponse.json({ success: true, message: 'Your message has been sent successfully!' }, { status: 201 });
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}