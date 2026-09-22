export interface BillShareInput {
  billId: string | any;
  type?: 'Rent' | 'Utility' | string;
  tenantName?: string;
  roomNumber?: string;
  billingPeriod?: string;
  billDateBS?: string;
  totalAmount: number;
  remainingAmount?: number;
  totalOutstandingDue?: number;
  status: 'DUE' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | string;
  electricity?: {
    previousReading?: number;
    currentReading?: number;
    unitsConsumed?: number;
    ratePerUnit?: number;
    rate?: number;
    amount?: number;
  };
  water?: {
    previousReading?: number;
    currentReading?: number;
    unitsConsumed?: number;
    ratePerUnit?: number;
    rate?: number;
    amount?: number;
  };
  threePhase?: {
    previousReading?: number;
    currentReading?: number;
    unitsConsumed?: number;
    ratePerUnit?: number;
    rate?: number;
    amount?: number;
  };
  serviceCharge?: number;
  securityCharge?: number;
  remarks?: string;
  origin?: string;
}

export function formatBillShare(input: BillShareInput): {
  title: string;
  text: string;
  url: string;
  shareData: { title: string; text: string; url: string };
} {
  const isUtility = input.type !== 'Rent';
  const tenant = input.tenantName || 'Tenant';
  const room = input.roomNumber ? ` (${input.roomNumber})` : '';
  const period = input.billingPeriod || 'Current Period';
  const baseUrl = input.origin || (typeof window !== 'undefined' ? window.location.origin : 'https://stgtower.com');
  const billIdStr = input.billId?.toString?.() || String(input.billId);
  const billUrl = `${baseUrl}/bill/${billIdStr}`;

  const total = Number(input.totalAmount || 0);
  const thisBillRemaining = input.status === 'PAID' ? 0 : Number(input.remainingAmount ?? total);
  const totalDueAltogether = Number(input.totalOutstandingDue ?? thisBillRemaining);

  const statusEmoji = input.status === 'PAID' ? '🟢' : input.status === 'PARTIALLY_PAID' ? '🟡' : '🔴';
  const statusLabel = input.status === 'PAID' ? 'PAID' : input.status === 'PARTIALLY_PAID' ? 'PARTIALLY PAID' : input.status === 'OVERDUE' ? 'OVERDUE' : 'DUE';

  let breakdown = '';
  if (isUtility) {
    const e = input.electricity;
    if (e && e.unitsConsumed !== undefined) {
      const eRate = e.ratePerUnit || e.rate || 19;
      const eAmt = e.amount !== undefined ? ` = Rs ${Number(e.amount).toLocaleString('en-IN')}` : '';
      breakdown += `⚡ *Electricity:* ${e.unitsConsumed} Units (@ Rs ${eRate}/unit)${eAmt}\n`;
    }

    const tp = input.threePhase;
    if (tp && (tp.amount || 0) > 0) {
      const tpRate = tp.ratePerUnit || tp.rate || 19;
      breakdown += `⚡ *Three-Phase:* ${tp.unitsConsumed} Units (@ Rs ${tpRate}/unit) = Rs ${Number(tp.amount).toLocaleString('en-IN')}\n`;
    }

    const w = input.water;
    if (w && w.unitsConsumed !== undefined) {
      const wRate = w.ratePerUnit || w.rate || 0.3;
      const wAmt = w.amount !== undefined ? ` = Rs ${Number(w.amount).toLocaleString('en-IN')}` : '';
      breakdown += `💧 *Water:* ${Number(w.unitsConsumed).toLocaleString('en-IN')} Litres (@ Rs ${wRate}/L)${wAmt}\n`;
    }

    const otherCharges = (Number(input.serviceCharge || 0) + Number(input.securityCharge || 0));
    if (otherCharges > 0) {
      breakdown += `🛠️ *Service & Security:* Rs ${otherCharges.toLocaleString('en-IN')}\n`;
    }
  }

  const remarksText = input.remarks?.trim() ? `📝 *Remarks:* ${input.remarks.trim()}\n` : '';

  const text = 
`🏢 *STG TOWER MANAGEMENT*
📄 *${isUtility ? 'Utility Bill' : 'Rent Bill'} for ${tenant}${room}*
📅 *Period:* ${period}${input.billDateBS ? ` | *Date:* ${input.billDateBS}` : ''}

━━━━━━━━━━━━━━━━━━━━
💵 *Bill Total Amount:* Rs ${total.toLocaleString('en-IN')}
💳 *This Bill Remaining:* Rs ${thisBillRemaining.toLocaleString('en-IN')}
${statusEmoji} *Total Remaining Balance (Altogether):* Rs ${totalDueAltogether.toLocaleString('en-IN')}
📌 *Status:* ${statusLabel}
━━━━━━━━━━━━━━━━━━━━
${breakdown}${remarksText}
🔗 *View & Download Full Bill Photo Here:*
${billUrl}`;

  const title = `STG Tower - ${isUtility ? 'Utility' : 'Rent'} Bill (${tenant})`;

  return {
    title,
    text,
    url: billUrl,
    shareData: {
      title,
      text,
      url: billUrl,
    },
  };
}

/**
 * Universal safe share helper: triggers native mobile share or copies formatted text to clipboard
 */
export async function shareBill(input: BillShareInput): Promise<{ success: boolean; method: 'share' | 'clipboard' }> {
  const { title, text, url } = formatBillShare(input);

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return { success: true, method: 'share' };
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return { success: false, method: 'share' };
      }
    }
  }

  // Fallback to clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return { success: true, method: 'clipboard' };
  }

  return { success: false, method: 'clipboard' };
}
