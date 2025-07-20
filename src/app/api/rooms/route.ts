import { NextResponse as RoomNextResponse, NextRequest } from 'next/server';
import dbConnectRoom from '@/lib/dbConnect';
import RoomModel from '@/models/Room';
import UserModel from '@/models/User';

export async function GET(request: NextRequest) {
  await dbConnectRoom();
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const query: { tenantId?: null } = {};
    if (status === 'vacant') {
      query.tenantId = null;
    }

    // By importing UserModel above, Mongoose is aware of it.
    // This line is not needed.
    const rooms = await RoomModel.find(query).populate('tenantId', 'fullName');
    return RoomNextResponse.json({ success: true, data: rooms });
  } catch (error) {
    console.error("Error fetching rooms:", error); // Use the error variable
    return RoomNextResponse.json({ success: false, message: 'Error fetching rooms' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await dbConnectRoom();
  try {
    const { roomNumber, floor, rentAmount } = await request.json();
    if (!roomNumber || !floor || !rentAmount) {
      return RoomNextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    const newRoom = new RoomModel({ roomNumber, floor, rentAmount });
    await newRoom.save();
    return RoomNextResponse.json({ success: true, message: 'Room created successfully', data: newRoom }, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return RoomNextResponse.json({ success: false, message: 'Error creating room' }, { status: 500 });
  }
}