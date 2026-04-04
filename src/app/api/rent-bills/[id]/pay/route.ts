import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import RentBill from '@/models/RentBill';
import { createNotification } from '@/lib/createNotification';
import { pusherServer } from '@/lib/pusher';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import NepaliDate from 'nepali-date-converter';

interface TokenPayload {
  id: string;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  try {
    const billId = params.id;
    const body = await request.json();
    const { amount, remarks } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid payment amount' }, { status: 400 });
    }

    const bill = await RentBill.findById(billId).populate('tenantId', 'fullName');
    if (!bill) {
      return NextResponse.json({ success: false, message: 'Bill not found' }, { status: 404 });
    }
    
    const tenantName = (bill.tenantId as any)?.fullName || 'Tenant';
    const tenantIdObj = (bill.tenantId as any)?._id;
    const tenantIdStr = tenantIdObj?.toString();

    // Initialize values if missing (backward compatibility)
    const currentPaid = bill.paidAmount || 0;
    const totalAmount = bill.amount;
    const currentRemaining = bill.remainingAmount ?? (totalAmount - currentPaid);

    if (amount > currentRemaining) {
      return NextResponse.json({ success: false, message: 'Payment exceeds remaining balance' }, { status: 400 });
    }

    const newPaidAmount = currentPaid + amount;
    const newRemainingAmount = totalAmount - newPaidAmount;
    
    // Automatically transition to PAID if balance cleared
    let newStatus = bill.status;
    let paidOnBS = bill.paidOnBS;
    if (newRemainingAmount <= 0) {
      newStatus = 'PAID';
      paidOnBS = new NepaliDate(new Date()).format('YYYY-MM-DD');
    } else {
      newStatus = 'PARTIALLY_PAID';
    }

    // Atomic update
    const updatedBill = await RentBill.findByIdAndUpdate(
      billId,
      {
        $set: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus,
          ...(paidOnBS ? { paidOnBS } : {})
        },
        $push: {
          paymentHistory: {
            amount,
            date: new Date(),
            remarks: remarks || ''
          }
        }
      },
      { new: true }
    );

    // Notifications
    const token = request.cookies.get('token')?.value || '';
    if (process.env.JWT_SECRET && token) {
      const adminUser = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
      
      const adminMsg = `${tenantName} has paid Rs ${amount.toLocaleString()} towards their rent bill. Remaining balance: Rs ${newRemainingAmount.toLocaleString()}.`;
      const tenantMsg = `You have successfully paid Rs ${amount.toLocaleString()} towards your rent bill. Remaining balance: Rs ${newRemainingAmount.toLocaleString()}.`;

      const isPartial = updatedBill?.status === 'PARTIALLY_PAID';
      const titleAdmin = isPartial ? 'Partial Rent Payment Received' : 'Rent Payment Received';
      const titleTenant = isPartial ? 'Partial Rent Payment Confirmed' : 'Rent Payment Confirmed';

      // Admin Notif (Links to specific Tenant statement page)
      if (adminUser) {
        await createNotification(
          new Types.ObjectId(adminUser.id),
          titleAdmin,
          adminMsg,
          `/dashboard/tenants/${tenantIdStr}`
        );
      }
      
      // Tenant Notif (Links to tenant dashboard)
      if (tenantIdObj) {
        await createNotification(
          tenantIdObj,
          titleTenant,
          tenantMsg,
          `/tenant/dashboard`
        );
      }

      // Try triggering realtime pusher event
      try {
        const notificationPayload = {
          title: adminUser.id === tenantIdStr ? titleTenant : titleAdmin,
          message: adminUser.id === tenantIdStr ? tenantMsg : adminMsg,
        };
        await pusherServer.trigger(`user-${adminUser.id}`, 'notification', notificationPayload);
        
        if (tenantIdStr) {
            await pusherServer.trigger(`user-${tenantIdStr}`, 'notification', {
              title: titleTenant,
              message: tenantMsg
            });
        }
      } catch (err) {
         console.error("Pusher error (non-fatal):", err);
      }
    }

    return NextResponse.json({ success: true, message: 'Payment recorded successfully', data: updatedBill });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error processing rent payment:", errorMessage);
    return NextResponse.json({ success: false, message: 'Error processing payment' }, { status: 500 });
  }
}
