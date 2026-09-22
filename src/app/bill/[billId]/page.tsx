import { Metadata } from 'next';
import { getPublicBill } from '@/lib/getPublicBill';
import PublicBillClient from './bill-client';

interface BillPageProps {
  params: {
    billId: string;
  };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: BillPageProps): Promise<Metadata> {
  const billId = params.billId;
  const bill = await getPublicBill(billId);

  if (!bill) {
    return {
      title: 'Bill Not Found | STG Tower Management',
      description: 'The requested bill could not be found.',
    };
  }

  const isUtility = bill.type === 'Utility';
  const tenantName = bill.tenantId?.fullName || 'Tenant';
  const roomNumber = bill.roomId?.roomNumber ? ` (${bill.roomId.roomNumber})` : '';
  const period = isUtility ? bill.billingMonthBS : bill.rentForPeriod;
  const total = Number(bill.totalAmount || 0);
  const remaining = Number(bill.remainingAmount || 0);
  const totalDue = Number(bill.totalOutstandingDue || 0);

  const title = `${isUtility ? 'Utility' : 'Rent'} Bill - ${tenantName}${roomNumber} (${period})`;
  const description = `Total Amount: Rs ${total.toLocaleString('en-IN')} | Remaining: Rs ${remaining.toLocaleString('en-IN')} | Total Balance Altogether: Rs ${totalDue.toLocaleString('en-IN')} | Status: ${bill.status}`;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://stgtower.com';
  const ogImageUrl = `${baseUrl}/api/og/bill/${billId}`;

  return {
    title: `${title} | STG Tower Management`,
    description,
    openGraph: {
      title: `🏢 STG Tower ${title}`,
      description,
      url: `/bill/${billId}`,
      siteName: 'STG Tower Management',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `STG Tower ${title}`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `🏢 STG Tower ${title}`,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function PublicBillPage({ params }: BillPageProps) {
  const bill = await getPublicBill(params.billId);

  return <PublicBillClient initialBill={bill} billId={params.billId} />;
}