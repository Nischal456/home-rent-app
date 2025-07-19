import { IRentBill, IUtilityBill } from '@/types';
import NepaliDate from 'nepali-date-converter';
import { numberToWords } from './numberToWords';

export const printBill = (bill: IRentBill | IUtilityBill, billType: 'rent' | 'utility') => {
  const isRentBill = billType === 'rent';
  const tenant = (bill.tenantId as any);
  const room = (bill.roomId as any);
  
  const billDateAD = new Date(bill.billDateAD);
  const billDateBS = new NepaliDate(billDateAD).format('YYYY/MM/DD');
  const billDateADFormatted = `${billDateAD.getFullYear()}/${String(billDateAD.getMonth() + 1).padStart(2, '0')}/${String(billDateAD.getDate()).padStart(2, '0')}`;
  
  let receiptMonthDate = billDateAD;
  if (!isRentBill) {
      receiptMonthDate = new Date(billDateAD.getFullYear(), billDateAD.getMonth() - 1, 1);
  }
  const receiptMonth = new NepaliDate(receiptMonthDate).format('MMMM');

  const totalAmount = isRentBill ? (bill as IRentBill).amount : (bill as IUtilityBill).totalAmount;
  const amountInWords = numberToWords(totalAmount);
  
  const billTitle = isRentBill ? "RENTAL" : "UTILITY";

  let descriptionRows = '';
  if (isRentBill) {
    const rentBill = bill as IRentBill;
    descriptionRows = `
      <tr class="border-b border-black"><td class="border-r border-black p-2">${rentBill.rentForPeriod}</td><td class="p-2 text-right">Rs ${rentBill.amount.toLocaleString('en-IN')}/-</td></tr>
    `;
  } else {
    const utilityBill = bill as IUtilityBill;
    descriptionRows = `
      ${utilityBill.electricity.amount > 0 ? `<tr class="border-b border-black"><td class="border-r border-black p-2">Electricity Bill</td><td class="p-2 text-right">Rs ${utilityBill.electricity.amount.toLocaleString('en-IN')}/-</td></tr>` : ''}
      ${utilityBill.water.amount > 0 ? `<tr class="border-b border-black"><td class="border-r border-black p-2">Water Bill</td><td class="p-2 text-right">Rs ${utilityBill.water.amount.toLocaleString('en-IN')}/-</td></tr>` : ''}
      ${utilityBill.serviceCharge > 0 ? `<tr class="border-b border-black"><td class="border-r border-black p-2">Service Charge</td><td class="p-2 text-right">Rs ${utilityBill.serviceCharge.toLocaleString('en-IN')}/-</td></tr>` : ''}
      ${utilityBill.securityCharge > 0 ? `<tr class="border-b border-black"><td class="border-r border-black p-2">Security Charge</td><td class="p-2 text-right">Rs ${utilityBill.securityCharge.toLocaleString('en-IN')}/-</td></tr>` : ''}
    `;
  }

  let utilityDetailsSection = '';
  if (!isRentBill) {
    const utilityBill = bill as IUtilityBill;
    utilityDetailsSection = `
        <section class="mt-8">
            <h3 class="text-lg font-semibold text-black-700 mb-2 border-b pb-1">Utility Details</h3>
            <div class="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                    <h4 class="font-bold text-md text-gray-800">Electricity</h4>
                    <div class="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg mt-1 space-y-1">
                        <div class="flex justify-between"><p>Previous Reading:</p><p>${utilityBill.electricity.previousReading}</p></div>
                        <div class="flex justify-between"><p>Current Reading:</p><p>${utilityBill.electricity.currentReading}</p></div>
                        <div class="flex justify-between font-semibold border-t pt-1 mt-1 border-gray-300"><p>Units Consumed:</p><p>${utilityBill.electricity.unitsConsumed}</p></div>
                    </div>
                </div>
                <div>
                    <h4 class="font-bold text-md text-gray-800">Water</h4>
                    <div class="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg mt-1 space-y-1">
                        <div class="flex justify-between"><p>Previous Reading:</p><p>${utilityBill.water.previousReading}</p></div>
                        <div class="flex justify-between"><p>Current Reading:</p><p>${utilityBill.water.currentReading}</p></div>
                        <div class="flex justify-between font-semibold border-t pt-1 mt-1 border-gray-300"><p>Units Consumed:</p><p>${utilityBill.water.unitsConsumed}</p></div>
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
      <title>Rental Bill - ${tenant?.fullName}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
        body { font-family: 'Roboto', sans-serif; }
        .bill-container { width: 210mm; min-height: 297mm; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        @page { size: A4; margin: 0; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none; }
          .bill-container { box-shadow: none; margin: 0; }
        }
      </style>
    </head>
    <body class="bg-gray-100 flex justify-center items-center p-4">
      <div class="bill-container bg-white p-10 text-sm">
        <header class="flex justify-between items-start border-b-2 border-black pb-4">
          <div class="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" class="h-40 w-80 object-contain">
          </div>
          <div class="text-center">
            <h2 class="text-4xl font-bold">${billTitle}</h2>
            <p class="text-3xl font-semibold">BILL</p>
          </div>
        </header>
        <section class="grid grid-cols-2 gap-8 mt-8">
          <div>
            <p class="font-bold">To,</p>
            <p>${tenant?.fullName}</p>
            <p>${room?.floor}, ${room?.roomNumber}</p>
            <p>Bhotebahal, Kathmandu</p>
          </div>
          <div class="flex justify-end">
            <table class="w-full">
              <tr><td class="font-bold pr-4">Date (B.S.)</td><td>: ${billDateBS}</td></tr>
              <tr><td class="font-bold pr-4">Date (A.D.)</td><td>: ${billDateADFormatted}</td></tr>
              <tr><td class="font-bold pr-4">Receipt Month</td><td>: ${receiptMonth}</td></tr>
            </table>
          </div>
        </section>
        ${utilityDetailsSection}
        <section class="mt-8">
          <table class="w-full border-collapse border border-black">
            <thead class="bg-gray-200">
              <tr>
                <th class="border border-black p-2 text-left">DESCRIPTION</th>
                <th class="border border-black p-2 text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${descriptionRows}
              <tr><td class="border-r border-black p-2 h-8"></td><td class="p-2"></td></tr>
              <tr><td class="border-r border-black p-2 h-8"></td><td class="p-2"></td></tr>
            </tbody>
          </table>
        </section>
        <section class="grid grid-cols-2 gap-8 mt-4">
          <div>
            <p class="font-bold">Amount In words:</p>
            <p class="italic">${amountInWords}</p>
            <p class="font-bold mt-6">Remarks:</p>
            <p>${bill.remarks || 'Please Clear all'}</p>
          </div>
          <div>
            <table class="w-full">
              <tr><td class="font-bold pr-4">Sub - Total</td><td class="text-right">Rs ${totalAmount.toLocaleString('en-IN')}/-</td></tr>
              <tr><td class="font-bold pr-4">Partial Payment</td><td class="text-right">Rs 0.00/-</td></tr>
              <tr><td class="font-bold pr-4">Previous Balance</td><td class="text-right">Rs 0.00/-</td></tr>
              <tr class="font-bold border-t-2 border-b-2 border-black my-2 py-1"><td class="pr-4">Balance Due</td><td class="text-right">Rs ${totalAmount.toLocaleString('en-IN')}/-</td></tr>
            </table>
          </div>
        </section>
        <footer class="mt-24 flex justify-between items-end">
          <div>
            <p class="text-xs">stgtowerhouse@gmail.com</p>
            <p class="text-xs">Bhotebahal, Kathmandu</p>
          </div>
          <div class="text-center">
            <p class="border-t-2 border-black pt-1 px-8">Authorized Signature</p>
            <p class="text-xs">(Accountant)</p>
          </div>
        </footer>
      </div>
       <div class="text-center my-4 no-print">
        <button onclick="window.print()" class="bg-blue-600 text-white px-6 py-2 rounded-md shadow-md hover:bg-blue-700">Print Bill</button>
      </div>
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