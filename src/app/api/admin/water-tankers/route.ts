import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import WaterTanker from '@/models/WaterTanker';
import User from '@/models/User'; // To populate who added it

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    // Fetch all records, sorted by newest first
    const tankers = await WaterTanker.find({})
      .populate('addedBy', 'fullName') // Show the name of the guard who added it
      .sort({ entryDate: -1 });

    return NextResponse.json({ success: true, data: tankers });
  } catch (error) {
    console.error("Error fetching water tankers:", error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}