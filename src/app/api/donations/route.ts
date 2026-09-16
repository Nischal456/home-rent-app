import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Donation from '../../../models/Donation';

export const dynamic = 'force-dynamic';

const TARGET_AMOUNT = 200000; // Rs. 2,00,000

const INITIAL_DONATIONS = [
  {
    donorName: 'STG Tower Management',
    phone: 'Management',
    amount: 5000,
    paymentMethod: 'esewa',
    transactionId: 'ESW-STG-MGMT',
    isAnonymous: false,
    message: 'हाम्रो परिवारको तर्फबाट सक्दो सहयोग। स्वास्थ्य लाभको कामना।',
    status: 'VERIFIED',
    createdAt: new Date('2026-09-16T10:30:00Z'),
  },
  {
    donorName: 'Gecko Works Members',
    phone: 'Office',
    amount: 6000,
    paymentMethod: 'esewa',
    transactionId: 'ESW-GECKO-TEAM',
    isAnonymous: false,
    message: 'Ujjwal — Rs. 1,000\nNischal — Rs. 1,000\nPrashant — Rs. 1,000\nManindra — Rs. 1,000\nAnjal — Rs. 2,000',
    status: 'VERIFIED',
    createdAt: new Date('2026-09-16T11:00:00Z'),
  },
  {
    donorName: 'James Subedi',
    phone: 'N/A',
    amount: 1000,
    paymentMethod: 'esewa',
    transactionId: 'ESW-JAMES-SUBEDI',
    isAnonymous: false,
    message: 'Get well soon',
    status: 'VERIFIED',
    createdAt: new Date('2026-09-16T11:05:00Z'),
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
    donorName: 'Anonymous',
    phone: 'N/A',
    amount: 1000,
    paymentMethod: 'esewa',
    transactionId: 'ESW-ANON-1000',
    isAnonymous: true,
    message: 'Speedy recovery 🙏',
    status: 'VERIFIED',
    createdAt: new Date('2026-09-16T11:10:00Z'),
  }
];

async function ensureSeedData() {
  const count = await Donation.countDocuments();
  if (count === 0) {
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
      isAnonymous: Boolean(d.isAnonymous || d.donorName.toLowerCase().trim() === 'anonymous'),
      message: d.message || '',
      createdAt: d.createdAt,
    }));

    // STG Tower Management always at top, then A-Z, then Anonymous at the very last
    donors.sort((a, b) => {
      const isMgmtA = /STG.*Management|Tower Management/i.test(a.donorName);
      const isMgmtB = /STG.*Management|Tower Management/i.test(b.donorName);
      if (isMgmtA && !isMgmtB) return -1;
      if (!isMgmtA && isMgmtB) return 1;

      if (a.isAnonymous && !b.isAnonymous) return 1;
      if (!a.isAnonymous && b.isAnonymous) return -1;
      return a.donorName.localeCompare(b.donorName, undefined, { sensitivity: 'base' });
    });

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
