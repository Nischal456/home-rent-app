import { NextResponse as AssignNextResponse } from 'next/server';
import dbConnectAssign from '@/lib/dbConnect';
import User from '@/models/User';
import RoomAssign from '@/models/Room';

export async function PATCH(request: Request, { params }: { params: { tenantId: string } }) {
  await dbConnectAssign();
  try {
    const { tenantId } = params;
    const { roomId } = await request.json();

    if (!roomId) {
      return AssignNextResponse.json({ success: false, message: 'Room ID is required.' }, { status: 400 });
    }

    const tenant = await User.findById(tenantId);
    if (!tenant) {
      return AssignNextResponse.json({ success: false, message: 'Tenant not found.' }, { status: 404 });
    }

    const newRoom = await RoomAssign.findById(roomId);
    if (!newRoom) {
      return AssignNextResponse.json({ success: false, message: 'Room not found.' }, { status: 404 });
    }
    if (newRoom.tenantId) {
      return AssignNextResponse.json({ success: false, message: 'Room is already occupied.' }, { status: 400 });
    }

    // If the tenant already has a room, unassign the old one
    if (tenant.roomId) {
      await RoomAssign.findByIdAndUpdate(tenant.roomId, { $unset: { tenantId: 1 } });
    }

    // Assign the new room (CORRECTED LINES)
    // We cast to 'any' to resolve the TypeScript type mismatch. Mongoose will handle the conversion.
    tenant.roomId = newRoom._id as any;
    newRoom.tenantId = tenant._id as any;

    await tenant.save();
    await newRoom.save();

    return AssignNextResponse.json({ success: true, message: 'Room assigned successfully.' });
  } catch (error) {
    console.error('Error assigning room:', error);
    return AssignNextResponse.json({ success: false, message: 'Error assigning room' }, { status: 500 });
  }
}
