import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getPublicBill } from '@/lib/getPublicBill';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { billId: string } }
) {
  try {
    const { billId } = params;
    const bill = await getPublicBill(billId);

    // Read public/logo.png (official STG Tower logo with silhouette and subtext)
    let logoBase64 = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } catch (e) {
      console.error('Error loading public/logo.png for OG bill:', e);
    }

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
    const tenantPhone = bill.tenantId?.phoneNumber || bill.tenantId?.phone || '';
    const period = isUtility ? bill.billingMonthBS : bill.rentForPeriod;
    const billDate = bill.billDateBS || 'Current';

    const totalAmount = Number(bill.totalAmount || 0);
    const remainingAmount = Number(bill.remainingAmount || 0);
    const totalOutstandingDue = Number(bill.totalOutstandingDue || 0);

    const isPaid = bill.status === 'PAID';
    const isPartial = bill.status === 'PARTIALLY_PAID';
    const statusText = isPaid ? 'PAID' : isPartial ? 'PARTIALLY PAID' : 'DUE';
    const statusColor = isPaid ? '#16a34a' : isPartial ? '#d97706' : '#dc2626';

    const billHeadingTitle = isUtility ? 'UTILITY' : 'RENTAL';

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            fontFamily: 'sans-serif',
            padding: '28px 36px',
            justifyContent: 'space-between',
          }}
        >
          {/* Top Header: Logo on left, UTILITY/RENTAL Bill on right */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              borderBottom: '2px solid #0f172a',
              paddingBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {logoBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoBase64}
                  width="220"
                  height="58"
                  alt="STG Tower"
                  style={{
                    width: 220,
                    height: 58,
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 32, fontWeight: '900', color: '#000000' }}>STG TOWER</span>
                  <span style={{ fontSize: 13, fontWeight: '700', color: '#64748b' }}>YOUR LIVING • YOUR COMFORT</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 38, fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1 }}>
                {billHeadingTitle}
              </span>
              <span style={{ fontSize: 34, fontWeight: '800', color: '#64748b', letterSpacing: '0.5px', lineHeight: 1 }}>
                BILL
              </span>
            </div>
          </div>

          {/* Sub Header: BILL FROM & BILL TO (matching print bill layout exactly) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              width: '100%',
              marginTop: 12,
            }}
          >
            {/* BILL FROM */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '42%' }}>
              <span style={{ fontSize: 13, fontWeight: '800', color: '#64748b', letterSpacing: '0.5px' }}>
                BILL FROM:
              </span>
              <span style={{ fontSize: 22, fontWeight: '900', color: '#0f172a', marginTop: 2 }}>
                STG Tower
              </span>
              <span style={{ fontSize: 15, fontWeight: '500', color: '#334155', marginTop: 2, whiteSpace: 'nowrap' }}>
                Bhotebahal, Kathmandu
              </span>
              <span style={{ fontSize: 14, fontWeight: '500', color: '#64748b', marginTop: 2, whiteSpace: 'nowrap' }}>
                stgtowerhouse@gmail.com
              </span>
            </div>

            {/* BILL TO + Date & Status table */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '55%' }}>
              <span style={{ fontSize: 13, fontWeight: '800', color: '#64748b', letterSpacing: '0.5px' }}>
                BILL TO:
              </span>
              <span style={{ fontSize: 22, fontWeight: '900', color: '#0f172a', marginTop: 2 }}>
                {tenantName}
              </span>
              <span style={{ fontSize: 15, fontWeight: '600', color: '#334155', marginTop: 2 }}>
                Flat: {roomNumber}
              </span>
              {tenantPhone ? (
                <span style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginTop: 2 }}>
                  {tenantPhone}
                </span>
              ) : null}

              {/* Date, Billing Month, Status aligned key-value table */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: 350,
                  marginTop: 8,
                }}
              >
                {/* Date row */}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap' }}>
                    Date (B.S.) :
                  </span>
                  <span style={{ fontSize: 14, fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap' }}>
                    {billDate}
                  </span>
                </div>

                {/* Billing Month row */}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap' }}>
                    Billing Month :
                  </span>
                  <span style={{ fontSize: 14, fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap' }}>
                    {period}
                  </span>
                </div>

                {/* Status row */}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap' }}>
                    Status :
                  </span>
                  <span style={{ fontSize: 15, fontWeight: '900', color: statusColor, whiteSpace: 'nowrap' }}>
                    {statusText}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Breakdown Box */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: 12,
              padding: '12px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              marginTop: 8,
            }}
          >
            {isUtility ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: '700', color: '#334155' }}>
                    ⚡ Electricity ({bill.electricity?.unitsConsumed || 0} Units @ Rs {bill.electricity?.ratePerUnit || bill.electricity?.rate || 19}/unit)
                  </span>
                  <span style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>
                    Rs {Number(bill.electricity?.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: '700', color: '#334155' }}>
                    💧 Water ({Number(bill.water?.unitsConsumed || 0).toLocaleString('en-IN')} Litres @ Rs {bill.water?.ratePerUnit || bill.water?.rate || 0.3}/L)
                  </span>
                  <span style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>
                    Rs {Number(bill.water?.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {bill.threePhase && (bill.threePhase.amount || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: '700', color: '#d97706' }}>
                      ⚡ Three Phase ({bill.threePhase.unitsConsumed || 0} Units)
                    </span>
                    <span style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>
                      Rs {Number(bill.threePhase.amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {(Number(bill.serviceCharge || 0) + Number(bill.securityCharge || 0)) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: '700', color: '#334155' }}>
                      🛡️ Service & Security Charges
                    </span>
                    <span style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>
                      Rs {(Number(bill.serviceCharge || 0) + Number(bill.securityCharge || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: '700', color: '#334155' }}>
                  🏠 Rent for Period: {period}
                </span>
                <span style={{ fontSize: 22, fontWeight: '900', color: '#0f172a' }}>
                  Rs {totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>

          {/* High Impact Financial Summary Row */}
          <div
            style={{
              display: 'flex',
              gap: 14,
              marginTop: 10,
            }}
          >
            <div
              style={{
                flex: 1,
                backgroundColor: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: 12,
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                Bill Total Amount
              </span>
              <span style={{ fontSize: 24, fontWeight: '900', color: '#0f172a', marginTop: 2 }}>
                Rs {totalAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div
              style={{
                flex: 1,
                backgroundColor: isPaid ? '#f0fdf4' : '#fff7ed',
                border: `1.5px solid ${isPaid ? '#bbf7d0' : '#fed7aa'}`,
                borderRadius: 12,
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: '800', color: isPaid ? '#166534' : '#c2410c', textTransform: 'uppercase' }}>
                This Bill Remaining
              </span>
              <span style={{ fontSize: 24, fontWeight: '900', color: isPaid ? '#15803d' : '#ea580c', marginTop: 2 }}>
                Rs {remainingAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div
              style={{
                flex: 1.3,
                backgroundColor: totalOutstandingDue > 0 ? '#fef2f2' : '#ecfdf5',
                border: `2px solid ${totalOutstandingDue > 0 ? '#fca5a5' : '#86efac'}`,
                borderRadius: 12,
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: '900', color: totalOutstandingDue > 0 ? '#991b1b' : '#065f46', textTransform: 'uppercase' }}>
                Total Remaining Balance (Altogether)
              </span>
              <span style={{ fontSize: 26, fontWeight: '900', color: totalOutstandingDue > 0 ? '#dc2626' : '#059669', marginTop: 2 }}>
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
              borderTop: '1px solid #e2e8f0',
              paddingTop: 8,
              marginTop: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: '700', color: '#64748b' }}>
              STG Community • Elevated Living
            </span>
            <span style={{ fontSize: 12, fontWeight: '800', color: '#2563eb' }}>
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
