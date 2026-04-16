import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import WaterTanker from '@/models/WaterTanker';
import Expense from '@/models/Expense';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    await dbConnect();
    try {
        const { id } = params;
        
        // Find the water tanker record
        const tanker = await WaterTanker.findById(id);
        if (!tanker) {
            return NextResponse.json({ success: false, message: 'Water record not found' }, { status: 404 });
        }

        // Delete associated expense if tied to this exact record (optional matching logic, but the user just wants the record gone)
        // Usually, we'd want a transaction, but let's safely remove the WaterTanker log first.
        await WaterTanker.findByIdAndDelete(id);

        return NextResponse.json({ success: true, message: 'Water record deleted' });
    } catch (error: any) {
        console.error("Delete Water Tanker Error:", error);
        return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
    }
}
