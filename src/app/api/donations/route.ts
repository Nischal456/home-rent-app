import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Donation from '@/models/Donation';

export const dynamic = 'force-dynamic';

const TARGET_AMOUNT = 200000; // Rs. 2,00,000

const INITIAL_DONATIONS = [
  {
    donorName: 'Sangita DiDi (7th floor)',
    phone: '7th Floor',
    amount: 5000,
    paymentMethod: 'esewa',
    transactionId: 'ESW-SANGITA-7',
    isAnonymous: false,
    message: 'speedy recovery Suman bhai',
    status: 'VERIFIED',
    createdAt: new Date('2026-09-16T09:00:00Z'),
  },
  {
    donorName: 'Roshan Shrestha (2nd floor)',
    phone: '2nd Floor',
    amount: 5000,
    paymentMethod: 'esewa',
    transactionId: 'ESW-ROSHAN-2',
    isAnonymous: false,
    message: 'god bless him',
    status: 'VERIFIED',
    createdAt: new Date('2026-09-16T09:30:00Z'),
  },
  {
    donorName: 'Faruk Ansari (2nd floor)',
    phone: '2nd Floor',
    amount: 5000,
    paymentMethod: 'esewa',
    transactionId: 'ESW-FARUK-2',
    isAnonymous: false,
    message: 'Zakkat',
    status: 'VERIFIED',
    createdAt: new Date('2026-09-16T10:00:00Z'),
  },
  {
    donorName: 'STG Tower Management',
    phone: 'Management',
    amount: 20000,
    paymentMethod: 'esewa',
    transactionId: 'ESW-STG-MGMT',
    isAnonymous: false,
    message: 'हाम्रो परिवारको तर्फबाट सक्दो सहयोग। स्वास्थ्य लाभको कामना।',
    status: 'VERIFIED',
    createdAt: new Date('2026-09-16T10:30:00Z'),
  }
];

async function ensureSeedData() {
  // Check if initial donations already contain Sangita DiDi
  const exists = await Donation.findOne({ donorName: 'Sangita DiDi (7th floor)' });
  if (!exists) {
    // Clear out old test seeds and populate with the user's exact 4 donations
    await Donation.deleteMany({});
    await Donation.insertMany(INITIAL_DONATIONS);
  }
}

export async function GET() {
  try {
    await dbConnect();
    await ensureSeedData();

    const verified = await Donation.find({ status: 'VERIFIED' }).sort({ createdAt: -1 });
    
    let totalCollected = 0;
    for (const d of verified) {
      totalCollected += d.amount;
    }

    const totalDonors = verified.length;
    const remainingAmount = Math.max(0, TARGET_AMOUNT - totalCollected);
    const percentage = Number(((totalCollected / TARGET_AMOUNT) * 100).toFixed(1));

    const donors = verified.map((d: any) => ({
      _id: d._id,
      donorName: d.isAnonymous ? 'Anonymous' : d.donorName,
      phone: d.phone,
      amount: d.amount,
      isAnonymous: d.isAnonymous,
      message: d.message || '',
      createdAt: d.createdAt,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        targetAmount: TARGET_AMOUNT,
        totalCollected,
        remainingAmount,
        percentage,
        totalDonors,
        lastUpdated: verified.length > 0 ? verified[0].createdAt : new Date(),
      },
      donors,
    });
  } catch (error: any) {
    console.error('Donation API error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    const { donorName, phone, amount, message, isAnonymous, transactionId } = body;

    if (!donorName || !amount) {
      return NextResponse.json(
        { success: false, message: 'कृपया नाम र सहयोग रकम भर्नुहोस्।' },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'कृपया सही रकम प्रविष्ट गर्नुहोस्।' },
        { status: 400 }
      );
    }

    const txn = transactionId?.trim() || `ESEWA-${Date.now()}`;

    const newDonation = await Donation.create({
      donorName: donorName.trim(),
      phone: phone ? phone.trim() : 'N/A',
      amount: parsedAmount,
      paymentMethod: 'esewa',
      transactionId: txn,
      isAnonymous: Boolean(isAnonymous),
      message: message ? message.trim() : '',
      status: 'VERIFIED',
      verifiedAt: new Date(),
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'सहयोग दर्ता भयो!',
      data: newDonation,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Donation submit error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
