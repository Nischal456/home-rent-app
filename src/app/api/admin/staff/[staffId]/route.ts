import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import StaffPayment from '@/models/StaffPayment';

export async function GET(request: NextRequest, { params }: { params: { staffId: string } }) {
    await dbConnect();
    
    try {
        const { staffId } = params;

        // Verify the user exists and is actually a staff member
        const staff = await User.findById(staffId).select('-password');
        if (!staff || !['SECURITY', 'ACCOUNTANT', 'CLEANER'].includes(staff.role)) {
            return NextResponse.json({ success: false, message: 'Invalid Staff Profile' }, { status: 404 });
        }

        // Fetch their complete payroll/payment history
        const payments = await StaffPayment.find({ staffId }).sort({ date: -1, createdAt: -1 });

        return NextResponse.json({
            success: true,
            data: {
                staffDetails: staff,
                payments
            }
        });
    } catch (error: any) {
        console.error("Fetch Deep Staff Data Error:", error);
        return NextResponse.json({ success: false, message: 'Error retrieving staff data' }, { status: 500 });
    }
}
