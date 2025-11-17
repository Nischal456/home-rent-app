import { IRentBill, IUtilityBill, IUser, IRoom } from '@/types';
import NepaliDate from 'nepali-date-converter';
import { numberToWords } from './numberToWords';

const isPopulated = (field: any): field is IUser | IRoom => {
  return field && typeof field === 'object' && '_id' in field;
};

// Define rates here to be used in the template
const ELECTRICITY_RATE_PER_UNIT = 19;
const WATER_RATE_PER_UNIT = 0.30;

export const printBill = (bill: IRentBill | IUtilityBill) => {
  const tenant = isPopulated(bill.tenantId) ? bill.tenantId : null;
  const room = isPopulated(bill.roomId) ? bill.roomId : null;

  const isRentBill = 'rentForPeriod' in bill;
  const billType = isRentBill ? 'Rent Bill' : 'Utility Bill';
  
  const billDateAD = new Date(bill.billDateAD);
  const billDateBS = bill.billDateBS || new NepaliDate(billDateAD).format('YYYY/MM/DD');
  const billDateADFormatted = `${billDateAD.getFullYear()}/${String(billDateAD.getMonth() + 1).padStart(2, '0')}/${String(billDateAD.getDate()).padStart(2, '0')}`;
  
  const totalAmount = isRentBill ? bill.amount : bill.totalAmount;
  const amountInWords = numberToWords(totalAmount);
  
  const billTitle = isRentBill ? "RENTAL" : "UTILITY";

  // ✅ Generate the unique, shareable URL for the bill
  const billUrl = `${window.location.origin}/bill/${bill._id}`;

  let descriptionRows = '';
  if (isRentBill) {
    descriptionRows = `
      <tr class="border-b border-black"><td class="border-r border-black p-2">${bill.rentForPeriod}</td><td class="p-2 text-right">Rs ${bill.amount.toLocaleString('en-IN')}/-</td></tr>
    `;
  } else {
    const utilityBill = bill as IUtilityBill;
    descriptionRows = `
      ${utilityBill.electricity.amount > 0 ? `<tr class="border-b border-black"><td class="border-r border-black p-2">Electricity Charge</td><td class="p-2 text-right">Rs ${utilityBill.electricity.amount.toLocaleString('en-IN')}/-</td></tr>` : ''}
      ${utilityBill.water.amount > 0 ? `<tr class="border-b border-black"><td class="border-r border-black p-2">Water Charge</td><td class="p-2 text-right">Rs ${utilityBill.water.amount.toLocaleString('en-IN')}/-</td></tr>` : ''}
      ${utilityBill.serviceCharge > 0 ? `<tr class="border-b border-black"><td class="border-r border-black p-2">Service Charge</td><td class="p-2 text-right">Rs ${utilityBill.serviceCharge.toLocaleString('en-IN')}/-</td></tr>` : ''}
      ${utilityBill.securityCharge > 0 ? `<tr class="border-b border-black"><td class="border-r border-black p-2">Security Charge</td><td class="p-2 text-right">Rs ${utilityBill.securityCharge.toLocaleString('en-IN')}/-</td></tr>` : ''}
    `;
  }

  let utilityDetailsSection = '';
  if (!isRentBill) {
    const utilityBill = bill as IUtilityBill;
    utilityDetailsSection = `
        <section class="mt-8">
            <h3 class="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">Utility Meter Readings</h3>
            <div class="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                    <h4 class="font-bold text-md text-gray-800">Electricity (@ Rs ${ELECTRICITY_RATE_PER_UNIT}/unit)</h4>
                    <div class="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg mt-1 space-y-1">
                        <div class="flex justify-between"><p>Previous Reading:</p><p>${utilityBill.electricity.previousReading}</p></div>
                        <div class="flex justify-between"><p>Current Reading:</p><p>${utilityBill.electricity.currentReading}</p></div>
                        <div class="flex justify-between font-semibold"><p>Units Consumed:</p><p>${utilityBill.electricity.unitsConsumed}</p></div>
                        <div class="flex justify-between font-bold text-black border-t pt-1 mt-1 border-gray-300"><p>Total Amount:</p><p>Rs ${utilityBill.electricity.amount.toLocaleString('en-IN')}</p></div>
                    </div>
                </div>
                <div>
                    <h4 class="font-bold text-md text-gray-800">Water (@ Rs ${WATER_RATE_PER_UNIT}/Litre)</h4>
                    <div class="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg mt-1 space-y-1">
                        <div class="flex justify-between"><p>Previous Reading:</p><p>${utilityBill.water.previousReading}</p></div>
                        <div class="flex justify-between"><p>Current Reading:</p><p>${utilityBill.water.currentReading}</p></div>
                        <div class="flex justify-between font-semibold"><p>Litres Consumed:</p><p>${utilityBill.water.unitsConsumed}</p></div>
                        <div class="flex justify-between font-bold text-black border-t pt-1 mt-1 border-gray-300"><p>Total Amount:</p><p>Rs ${utilityBill.water.amount.toLocaleString('en-IN')}</p></div>
                    </div>
                </div>
            </div>
        </section>
    `;
  }

  const billContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${billType} - ${tenant?.fullName || 'Bill'}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .bill-container { width: 210mm; min-height: 297mm; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        @page { size: A4; margin: 0; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none; }
          .bill-container { box-shadow: none; margin: 0; }
        }
      </style>
    </head>
    <body class="bg-gray-100 flex flex-col justify-center items-center p-4">
      <div class="bill-container bg-white p-10 text-sm text-gray-800">
        <header class="flex justify-between items-start border-b-2 border-black pb-4">
          <div class="flex items-center gap-4">
             <img src="/logo.png" alt="Logo" class="h-20 w-auto object-contain">
          </div>
          <div class="text-right">
            <h2 class="text-4xl font-bold uppercase">${billTitle}</h2>
            <p class="text-lg font-semibold text-gray-600">Bill</p>
          </div>
        </header>
        <section class="grid grid-cols-2 gap-8 mt-8">
          <div>
            <p class="font-bold text-gray-500">BILL FROM:</p>
            <p class="font-bold text-lg">STG Tower</p>
            <p>Bhotebahal, Kathmandu</p>
            <p>stgtowerhouse@gmail.com</p>
          </div>
          <div class="text-right">
            <p class="font-bold text-gray-500">BILL TO:</p>
            <p class="font-bold text-lg">${tenant?.fullName || 'N/A'}</p>
            <p>Flat: ${room?.roomNumber || 'N/A'}</p>
            
            ${tenant?.phoneNumber ? `<p>${tenant.phoneNumber}</p>` : ''}
          </div>
        </section>
        <section class="mt-4 text-right">
            <table class="w-1/2 ml-auto">
              <tr><td class="font-bold pr-4 text-gray-500">Date (B.S.) :</td><td>${billDateBS}</td></tr>
              <tr><td class="font-bold pr-4 text-gray-500">Date (A.D.) :</td><td>${billDateADFormatted}</td></tr>
              <tr><td class="font-bold pr-4 text-gray-500">Status :</td><td class="font-bold ${bill.status === 'PAID' ? 'text-green-600' : 'text-red-600'}">${bill.status}</td></tr>
            </table>
        </section>
        
        <section class="mt-8">
          <table class="w-full border-collapse border border-black">
            <thead class="bg-gray-100">
              <tr>
                <th class="border border-black p-2 text-left font-bold">DESCRIPTION</th>
                <th class="border border-black p-2 text-right font-bold">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${descriptionRows}
              <tr><td class="border-r border-black p-2 h-8"></td><td class="p-2"></td></tr>
              <tr><td class="border-r border-black p-2 h-8"></td><td class="p-2"></td></tr>
            </tbody>
          </table>
        </section>
        ${utilityDetailsSection}
        <section class="grid grid-cols-2 gap-8 mt-8">
          <div>
            <p class="font-bold text-gray-500">Amount In words:</p>
            <p class="italic capitalize">${amountInWords}</p>
            <p class="font-bold mt-6 text-gray-500">Remarks:</p>
            <p>${bill.remarks || 'The water rate has been adjusted from Rs 0.40 to Rs 0.30 per liter .'}</p>
          </div>
          <div>
            <table class="w-full text-right">
              <tr><td class="pr-4">Sub - Total</td><td>Rs ${totalAmount.toLocaleString('en-IN')}/-</td></tr>
              <tr class="font-bold border-t-2 border-b-2 border-black my-2 py-2 text-lg"><td class="pr-4">Balance Due</td><td>Rs ${totalAmount.toLocaleString('en-IN')}/-</td></tr>
            </table>
          </div>
        </section>
        <footer class="mt-16 flex justify-between items-end text-xs text-gray-500">
          <div>
            <p>Thank you </p>
          </div>
          <div class="text-center">
            <p class="border-t-2 border-black pt-1 px-8">Authorized Signature</p>
          </div>
        </footer>
      </div>
       <div class="text-center my-4 no-print flex justify-center items-center gap-4">
        <button onclick="window.print()" class="bg-blue-600 text-white px-6 py-2 rounded-md shadow-md hover:bg-blue-700">Print Bill</button>
        <button id="share-btn" class="bg-green-600 text-white px-6 py-2 rounded-md shadow-md hover:bg-green-700">Share Bill</button>
      </div>

      <script>
        const shareBtn = document.getElementById('share-btn');
        const shareData = {
          title: '${billType}',
          text: 'Here is the bill for ${tenant?.fullName || 'your account'}.',
          url: '${billUrl}'
        };

        shareBtn.addEventListener('click', async () => {
          if (navigator.share) {
            try {
              await navigator.share(shareData);
            } catch (err) {
              console.error("Share failed:", err);
            }
          } else {
            // Fallback for desktop: copy link to clipboard
            try {
              await navigator.clipboard.writeText(shareData.url);
              shareBtn.textContent = 'Link Copied!';
              setTimeout(() => {
                shareBtn.textContent = 'Share Bill';
              }, 2000);
            } catch (err) {
              console.error('Failed to copy text: ', err);
              shareBtn.textContent = 'Copy Failed';
               setTimeout(() => {
                shareBtn.textContent = 'Share Bill';
              }, 2000);
            }
          }
        });
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(billContent);
    printWindow.document.close();
  } else {
    alert('Please allow popups for this website to print the bill.');
  }
};
