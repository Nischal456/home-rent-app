import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PasswordResetRequest from '@/models/PasswordResetRequest';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // ✅ Replaced 'next-auth/jwt' with 'jsonwebtoken'

// Define the shape of your custom token payload
interface TokenPayload {
  id: string;
  role: 'ADMIN' | 'TENANT';
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    // ✅ This is your app's correct authentication method
    const tokenCookie = request.cookies.get('token')?.value;
    if (!tokenCookie) {
      return NextResponse.json({ success: false, message: 'Unauthorized: No token' }, { status: 401 });
    }
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    const decoded = jwt.verify(tokenCookie, process.env.JWT_SECRET) as TokenPayload;
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden: Admin access required' }, { status: 403 });
    }
    // --- End of Auth Check ---

    await dbConnect();
    const { newPassword } = await request.json();
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const requestDoc = await PasswordResetRequest.findById(params.requestId);
    if (!requestDoc || requestDoc.status === 'COMPLETED') {
      return NextResponse.json({ success: false, message: 'Request not found or already completed.' }, { status: 404 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await User.findByIdAndUpdate(requestDoc.userId, {
      $set: { password: hashedPassword }
    });

    // Mark the request as completed
    requestDoc.status = 'COMPLETED';
    await requestDoc.save();

    // (Optional) Send a notification or email to the tenant
    // await createNotification(requestDoc.userId, 'Password Reset', 'Your password has been reset by the admin.');

    return NextResponse.json({ success: true, message: 'Password has been reset successfully.' });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    console.error("Error resetting password:", error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}