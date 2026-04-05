import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

interface TokenPayload {
  id: string;
}

export async function PATCH(request: NextRequest) {
  if (!process.env.JWT_SECRET) {
    return NextResponse.json({ success: false, message: 'Server misconfiguration: missing JWT_SECRET.' }, { status: 500 });
  }

  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
    
    const body = await request.json();
    if (!body.profilePicture) {
        return NextResponse.json({ success: false, message: 'Profile picture data is required.' }, { status: 400 });
    }

    // Optional: Validate base64 length to prevent massive payloads (e.g. 5MB limit roughly 6.6M chars)
    if (body.profilePicture.length > 7000000) {
        return NextResponse.json({ success: false, message: 'Image size is too large. Please compress manually.' }, { status: 413 });
    }

    await dbConnect();
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    user.profilePicture = body.profilePicture;
    await user.save();

    return NextResponse.json({ success: true, message: 'Profile picture updated successfully.' });

  } catch (error) {
    console.error('Error updating profile picture:', error);
    return NextResponse.json({ success: false, message: 'Failed to update profile picture.' }, { status: 500 });
  }
}
