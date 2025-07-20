import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import RentBill from '@/models/RentBill';

// This is the simplest, most standard way to write this function.
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
    await dbConnect();
    try {
        const billId = params.id;
        if (!billId) {
            return NextResponse.json({ success: false, message: 'Bill ID is required.' }, { status: 400 });
        }
        await RentBill.findByIdAndDelete(billId);
        return NextResponse.json({ success: true, message: 'Bill deleted successfully.' });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("Error deleting bill:", errorMessage);
        return NextResponse.json({ success: false, message: 'Error deleting bill' }, { status: 500 });
    }
}