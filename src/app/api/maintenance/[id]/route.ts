import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import MaintenanceRequest from '@/models/MaintenanceRequest';
import jwt from 'jsonwebtoken';
import { pusherServer } from '@/lib/pusher';
import { IUser } from '@/types'; // Import IUser for typing

interface TokenPayload { id: string; role: string; }

export async function PATCH(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  await dbConnect();
  try {
    // 1. Verify Auth (Security or Admin)
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    if (decoded.role !== 'ADMIN' && decoded.role !== 'SECURITY') {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // 2. Get New Status
    const { status } = await request.json(); // Expects 'IN_PROGRESS' or 'COMPLETED'

    // 3. Update the Request
    const updateData: any = { status };
    if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
    }

    const maintenanceRequest = await MaintenanceRequest.findByIdAndUpdate(
        params.requestId,
        { $set: updateData },
        { new: true }
    ).populate('tenantId', 'fullName');

    if (!maintenanceRequest) {
        return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 });
    }

    // 4. Notify Admin (if Guard updated it)
    if (decoded.role === 'SECURITY') {
        // ✅ FIX: Cast tenantId to 'any' or 'IUser' to access fullName
        // We use 'as any' here to safely bypass the TypeScript check since we know it's populated
        const tenantName = (maintenanceRequest.tenantId as any)?.fullName || 'Unknown Tenant';

        await pusherServer.trigger('admin-notifications', 'maintenance-update', {
            message: `Maintenance for ${tenantName} marked as ${status}`,
            requestId: maintenanceRequest._id
        });
    }

    return NextResponse.json({ success: true, message: 'Status updated', data: maintenanceRequest });

  } catch (error) {
    console.error("Error updating maintenance:", error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

// Delete API (Optional but good to have)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { requestId: string } }
) {
    await dbConnect();
    try {
        const token = request.cookies.get('token')?.value;
        if (!token) return NextResponse.json({ success: false }, { status: 401 });
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
        
        if (decoded.role !== 'ADMIN') {
             return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        await MaintenanceRequest.findByIdAndDelete(params.requestId);
        return NextResponse.json({ success: true, message: 'Request deleted' });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
    }
}