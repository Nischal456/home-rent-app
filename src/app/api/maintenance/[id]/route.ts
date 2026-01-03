import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import MaintenanceRequest from '@/models/MaintenanceRequest';
import User from '@/models/User'; // ✅ Import to ensure schema is registered
import jwt from 'jsonwebtoken';
import { pusherServer } from '@/lib/pusher';

interface TokenPayload { id: string; role: string; }

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } } // ✅ FIX: Changed requestId to id to match folder [id]
) {
  await dbConnect();
  
  // Ensure User model is registered
  const _u = User;

  try {
    // 1. Verify Auth (Security or Admin)
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    if (decoded.role !== 'ADMIN' && decoded.role !== 'SECURITY') {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // 2. Get Data
    const body = await request.json();
    const { status, priority } = body;

    const updateData: any = {};
    if (status) {
        updateData.status = status;
        if (status === 'COMPLETED') {
            updateData.completedAt = new Date();
        }
    }
    if (priority) {
        updateData.priority = priority;
    }

    // 3. Update the Request
    // ✅ FIX: Using params.id
    const maintenanceRequest = await MaintenanceRequest.findByIdAndUpdate(
        params.id,
        { $set: updateData },
        { new: true }
    ).populate('tenantId', 'fullName');

    if (!maintenanceRequest) {
        return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 });
    }

    // 4. Notify Admin (if Guard updated it)
    if (decoded.role === 'SECURITY' && status) {
        // Safe check for tenant name
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
    { params }: { params: { id: string } } // ✅ FIX: Changed requestId to id
) {
    await dbConnect();
    try {
        const token = request.cookies.get('token')?.value;
        if (!token) return NextResponse.json({ success: false }, { status: 401 });
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
        
        if (decoded.role !== 'ADMIN') {
             return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        // ✅ FIX: Using params.id
        const deleted = await MaintenanceRequest.findByIdAndDelete(params.id);
        
        if (!deleted) {
             return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Request deleted' });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
    }
}