import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Explicitly register models
import User from '@/models/User';
import Room from '@/models/Room';
import WaterTanker from '@/models/WaterTanker';
import StaffPayment from '@/models/StaffPayment';
import MaintenanceRequest from '@/models/MaintenanceRequest';
import Expense from '@/models/Expense';

export const dynamic = 'force-dynamic';

interface TokenPayload { id: string; role: string; }

export async function GET(request: NextRequest) {
  await dbConnect();
  
  // Force model registration to prevent population errors
  const _models = { User, Room, WaterTanker, StaffPayment, MaintenanceRequest, Expense };

  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false }, { status: 401 });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    
    // 1. Fetch Water Logs (Last 10) - Visible to everyone
    const recentWater = await WaterTanker.find({})
      .populate({ path: 'addedBy', model: User, select: 'fullName' })
      .sort({ entryDate: -1 })
      .limit(10)
      .lean();
    
    // 2. Fetch Finance History (The Logic Fix)
    let finances;
    let netBalance = 0;

    if (decoded.role === 'ADMIN') {
        // ✅ ADMIN VIEW: See ALL payments to ALL staff
        finances = await StaffPayment.find({})
            .populate({ path: 'staffId', model: User, select: 'fullName' })
            .sort({ date: -1 })
            .lean();
            
        // For Admin, calculate total advances given vs salary paid across all staff
         let totalEarned = 0; 
         let totalTaken = 0; 
         finances.forEach((record: any) => {
             if (record.type === 'ADVANCE') totalTaken += record.amount;
             else totalEarned += record.amount;
         });
         netBalance = totalEarned - totalTaken;

    } else {
        // ✅ GUARD VIEW: See only MY payments
        finances = await StaffPayment.find({ staffId: decoded.id }).sort({ date: -1 }).lean();
        
        let totalEarned = 0; 
        let totalTaken = 0; 
        finances.forEach((record: any) => {
            if (record.type === 'ADVANCE') totalTaken += record.amount;
            else totalEarned += record.amount;
        });
        netBalance = totalEarned - totalTaken;
    }

    // 3. Fetch Active Maintenance
    const activeMaintenance = await MaintenanceRequest.find({ status: { $ne: 'COMPLETED' } })
        .populate({ path: 'tenantId', model: User, select: 'fullName' })
        .populate({ path: 'roomId', model: Room, select: 'roomNumber' })
        .sort({ createdAt: -1 })
        .lean();

    return NextResponse.json({
      success: true,
      data: {
        recentWater,
        finances,
        netBalance,
        activeMaintenance,
        userRole: decoded.role // Send role back so UI can adapt if needed
      }
    });
  } catch (error: any) {
    console.error("Security Dashboard GET Error:", error);
    return NextResponse.json({ success: false, message: error.message || 'Server Error' }, { status: 500 });
  }
}

// ... POST function remains the same (it was working fine) ...
export async function POST(request: NextRequest) {
  await dbConnect();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const token = request.cookies.get('token')?.value;
    if (!token) throw new Error("Unauthorized");
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    const { cost, volumeLiters } = await request.json();

    if (!cost || !volumeLiters) throw new Error("Cost and Volume are required");

    // 1. Log the Water Tanker
    const newTanker = await WaterTanker.create([{
        cost: Number(cost),
        volumeLiters: Number(volumeLiters),
        addedBy: decoded.id,
        entryDate: new Date()
    }], { session });

    // 2. Automatically create a Financial Expense
    // Ensure 'UTILITIES' matches your Expense model enum
    await Expense.create([{
        amount: Number(cost),
        date: new Date(),
        category: 'UTILITIES', 
        description: `Water Tanker (${volumeLiters}L) - Logged by Security`,
        type: 'EXPENSE'
    }], { session });

    await session.commitTransaction();
    return NextResponse.json({ success: true, message: 'Water Tanker & Expense Logged', data: newTanker[0] });

  } catch (error: any) {
    await session.abortTransaction();
    console.error("Security Dashboard POST Error:", error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to log water' }, { status: 500 });
  } finally {
    session.endSession();
  }
}