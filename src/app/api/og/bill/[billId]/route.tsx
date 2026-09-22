import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getPublicBill } from '@/lib/getPublicBill';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { billId: string } }
) {
  try {
    const { billId } = params;
    const bill = await getPublicBill(billId);

    if (!bill) {
      return new ImageResponse(
        (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontFamily: 'sans-serif',
            }}
          >
            <h1 style={{ fontSize: 48, fontWeight: 'bold' }}>STG Tower Management</h1>
            <p style={{ fontSize: 24, color: '#94a3b8' }}>Bill Not Found or Expired</p>
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }

    const isUtility = bill.type === 'Utility';
    const tenantName = bill.tenantId?.fullName || 'Tenant';
    const roomNumber = bill.roomId?.roomNumber || 'Apartment';
    const period = isUtility ? bill.billingMonthBS : bill.rentForPeriod;
    const billDate = bill.billDateBS || 'Current';

    const totalAmount = Number(bill.totalAmount || 0);
    const remainingAmount = Number(bill.remainingAmount || 0);
    const totalOutstandingDue = Number(bill.totalOutstandingDue || 0);

    const isPaid = bill.status === 'PAID';
    const isPartial = bill.status === 'PARTIALLY_PAID';
    const statusBg = isPaid ? '#15803d' : isPartial ? '#b45309' : '#b91c1c';
    const statusText = isPaid ? 'PAID' : isPartial ? 'PARTIALLY PAID' : 'DUE';

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f8fafc',
            fontFamily: 'sans-serif',
            padding: 40,
            justifyContent: 'space-between',
          }}
        >
          {/* Top Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '3px solid #e2e8f0',
              paddingBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: 28,
                  fontWeight: 'bold',
                }}
              >
                🏢
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 32, fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px' }}>
                  STG TOWER
                </span>
                <span style={{ fontSize: 16, fontWeight: '700', color: '#64748b', letterSpacing: '1px' }}>
                  OFFICIAL {bill.type.toUpperCase()} BILL RECEIPT
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: statusBg,
                color: '#ffffff',
                padding: '10px 24px',
                borderRadius: 999,
                fontSize: 20,
                fontWeight: '900',
                letterSpacing: '1px',
              }}
            >
              {statusText}
            </div>
          </div>

          {/* Tenant & Bill Metadata Cards */}
          <div
            style={{
              display: 'flex',
              gap: 20,
              marginTop: 18,
            }}
          >
            <div
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                border: '2px solid #e2e8f0',
                borderRadius: 16,
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                Billed To
              </span>
              <span style={{ fontSize: 24, fontWeight: '900', color: '#0f172a', marginTop: 4 }}>
                {tenantName}
              </span>
              <span style={{ fontSize: 16, fontWeight: '600', color: '#2563eb', marginTop: 2 }}>
                Flat/Room: {roomNumber}
              </span>
            </div>

            <div
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                border: '2px solid #e2e8f0',
                borderRadius: 16,
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                Billing Period & Date
              </span>
              <span style={{ fontSize: 24, fontWeight: '900', color: '#0f172a', marginTop: 4 }}>
                {period}
              </span>
              <span style={{ fontSize: 16, fontWeight: '600', color: '#64748b', marginTop: 2 }}>
                Date: {billDate}
              </span>
            </div>
          </div>

          {/* Itemized Breakdown Box */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '2px solid #e2e8f0',
              borderRadius: 16,
              padding: '18px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              marginTop: 16,
            }}
          >
            {isUtility ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: '700', color: '#334155' }}>
                    ⚡ Electricity ({bill.electricity?.unitsConsumed || 0} Units @ Rs {bill.electricity?.ratePerUnit || bill.electricity?.rate || 19}/unit)
                  </span>
                  <span style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>
                    Rs {Number(bill.electricity?.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: '700', color: '#334155' }}>
                    💧 Water ({Number(bill.water?.unitsConsumed || 0).toLocaleString('en-IN')} Litres @ Rs {bill.water?.ratePerUnit || bill.water?.rate || 0.3}/L)
                  </span>
                  <span style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>
                    Rs {Number(bill.water?.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {bill.threePhase && (bill.threePhase.amount || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 18, fontWeight: '700', color: '#d97706' }}>
                      ⚡ Three Phase ({bill.threePhase.unitsConsumed || 0} Units)
                    </span>
                    <span style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>
                      Rs {Number(bill.threePhase.amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {(Number(bill.serviceCharge || 0) + Number(bill.securityCharge || 0)) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 18, fontWeight: '700', color: '#334155' }}>
                      🛡️ Service & Security Charges
                    </span>
                    <span style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>
                      Rs {(Number(bill.serviceCharge || 0) + Number(bill.securityCharge || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 22, fontWeight: '700', color: '#334155' }}>
                  🏠 Rent for Period: {period}
                </span>
                <span style={{ fontSize: 24, fontWeight: '900', color: '#0f172a' }}>
                  Rs {totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>

          {/* High Impact Financial Summary Row */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 18,
            }}
          >
            <div
              style={{
                flex: 1,
                backgroundColor: '#f1f5f9',
                border: '2px solid #cbd5e1',
                borderRadius: 16,
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                Bill Total Amount
              </span>
              <span style={{ fontSize: 28, fontWeight: '900', color: '#0f172a', marginTop: 2 }}>
                Rs {totalAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div
              style={{
                flex: 1,
                backgroundColor: isPaid ? '#f0fdf4' : '#fff7ed',
                border: `2px solid ${isPaid ? '#bbf7d0' : '#fed7aa'}`,
                borderRadius: 16,
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: '800', color: isPaid ? '#166534' : '#c2410c', textTransform: 'uppercase' }}>
                This Bill Remaining
              </span>
              <span style={{ fontSize: 28, fontWeight: '900', color: isPaid ? '#15803d' : '#ea580c', marginTop: 2 }}>
                Rs {remainingAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div
              style={{
                flex: 1.4,
                backgroundColor: totalOutstandingDue > 0 ? '#fef2f2' : '#ecfdf5',
                border: `3px solid ${totalOutstandingDue > 0 ? '#fca5a5' : '#86efac'}`,
                borderRadius: 16,
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: '900', color: totalOutstandingDue > 0 ? '#991b1b' : '#065f46', textTransform: 'uppercase' }}>
                Total Remaining Balance (Altogether)
              </span>
              <span style={{ fontSize: 30, fontWeight: '900', color: totalOutstandingDue > 0 ? '#dc2626' : '#059669', marginTop: 2 }}>
                Rs {totalOutstandingDue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '2px solid #e2e8f0',
              paddingTop: 12,
              marginTop: 12,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: '700', color: '#64748b' }}>
              STG Community • Elevated Living
            </span>
            <span style={{ fontSize: 14, fontWeight: '800', color: '#2563eb' }}>
              View full details online at stgtower.com
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    console.error('Error generating bill OG image:', error);
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            fontSize: 32,
            fontFamily: 'sans-serif',
          }}
        >
          STG Tower Bill Receipt
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}
