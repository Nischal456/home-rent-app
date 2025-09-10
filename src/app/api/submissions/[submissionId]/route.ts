import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Submission from '@/models/Submission';

// This function will mark a specific submission as READ
export async function PATCH(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  // Add admin auth check here
  await dbConnect();
  try {
    const updatedSubmission = await Submission.findByIdAndUpdate(
      params.submissionId,
      { status: 'READ' },
      { new: true } // Return the updated document
    );
    if (!updatedSubmission) {
      return NextResponse.json({ success: false, message: 'Submission not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updatedSubmission });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update submission.' }, { status: 400 });
  }
}

// ✅ ADD THIS NEW DELETE FUNCTION
export async function DELETE(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  // Add your admin authentication check here
  await dbConnect();
  try {
    const deletedSubmission = await Submission.findByIdAndDelete(params.submissionId);
    if (!deletedSubmission) {
      return NextResponse.json({ success: false, message: 'Submission not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Submission deleted successfully.' });
  } catch (error) {
    console.error("Error deleting submission:", error);
    return NextResponse.json({ success: false, message: 'Failed to delete submission.' }, { status: 500 });
  }
}