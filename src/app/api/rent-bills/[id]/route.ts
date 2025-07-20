import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import RentBill from '@/models/RentBill';
import NepaliDate from 'nepali-date-converter';
import { createNotification } from '@/lib/createNotification';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
// We need to import the Room model for populate to work, but we can do it this way to avoid 'unused variable' warnings.
import '@/models/Room'; 

interface TokenPayload {
  id: string;
}

// Context type for our route handlers
interface RouteContext {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  await dbConnect();
  try {
    const billId = context.params.id;
    const todayAD = new Date();
    const todayBS = new NepaliDate(todayAD).format('YYYY-MM-DD');

    const updatedBill = await RentBill.findByIdAndUpdate(
      billId,
      { status: 'PAID', paidOnBS: todayBS },
      { new: true }
    ).populate('tenantId'); // Let's populate to be safe for notifications

    if (!updatedBill) {
      return NextResponse.json({ success: false, message: 'Bill not found' }, { status: 404 });
    }
    
    if (process.env.JWT_SECRET) {
        const token = request.cookies.get('token')?.value || '';
        if (token) {
            const adminUser = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
            
            await createNotification(
                updatedBill.tenantId._id as Types.ObjectId,
                'Rent Bill Paid!',
                `Your rent bill of Rs ${updatedBill.amount} has been marked as paid. Thank you!`,
                '/dashboard'
            );

            if (adminUser) {
                await createNotification(
                    new Types.ObjectId(adminUser.id), 
                    'Payment Recorded',
                    `You marked a rent bill of Rs ${updatedBill.amount} as paid.`,
                    '/dashboard/rent-bills'
                );
            }
        }
    }

    return NextResponse.json({ success: true, message: 'Bill marked as paid', data: updatedBill });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error updating bill:", errorMessage);
    return NextResponse.json({ success: false, message: 'Error updating bill' }, { status: 500 });
  }
}

// export async function DELETE(request: NextRequest, context: RouteContext) {
//     await dbConnect();
//     try {
//         const billId = context.params.id;
//         await RentBill.findByIdAndDelete(billId);
//         return NextResponse.json({ success: true, message: 'Bill deleted successfully' });
//     } catch (error) {
//         const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//         console.error("Error deleting bill:", errorMessage);
//         return NextResponse.json({ success: false, message: 'Error deleting bill' }, { status: 500 });
//     }
// }