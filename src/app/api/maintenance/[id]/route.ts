import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import MaintenanceRequest from '@/models/MaintenanceRequest';
import { createNotification } from '@/lib/createNotification';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

// Define the shape of the token payload
interface TokenPayload {
  id: string;
  role: 'ADMIN' | 'TENANT';
}

// Define the valid statuses for a maintenance request
const VALID_STATUSES: string[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  try {
    // 1. Verify Admin Authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized: No token provided' }, { status: 401 });
    }
    
    if (!process.env.JWT_SECRET) {
      console.error("FATAL ERROR: JWT_SECRET is not defined.");
      return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 2. Get Request ID and New Status
    const requestId = params.id;
    const { status } = await request.json();

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status provided.' }, { status: 400 });
    }

    // 3. Update the Maintenance Request in the Database
    const updatedRequest = await MaintenanceRequest.findByIdAndUpdate(
      requestId,
      { status: status, ...(status === 'COMPLETED' && { completedAt: new Date() }) }, // Set completion date if status is 'COMPLETED'
      { new: true }
    );

    if (!updatedRequest) {
      return NextResponse.json({ success: false, message: 'Maintenance request not found.' }, { status: 404 });
    }

    // 4. Notify the Tenant about the Status Update
    await createNotification(
      updatedRequest.tenantId as Types.ObjectId,
      'Maintenance Request Updated',
      `Your request for "${updatedRequest.issue}" is now marked as ${status}.`,
      '/dashboard' // Link the tenant to their dashboard
    );

    return NextResponse.json({ success: true, message: 'Status updated successfully.', data: updatedRequest });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
    console.error(`Error in PATCH /api/maintenance/${params.id}:`, errorMessage);
    return NextResponse.json({ success: false, message: 'An error occurred while updating the request.' }, { status: 500 });
  }
}