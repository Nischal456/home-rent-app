import { IRentBill, IUtilityBill } from '@/types';
import NepaliDate from 'nepali-date-converter';

export const printBill = (bill: IRentBill | IUtilityBill, billType: 'rent' | 'utility') => {
  const isRentBill = billType === 'rent';
  const tenant = (bill.tenantId as any);
  const room = (bill.roomId as any);
  const todayBS = new NepaliDate().format('DD MMMM, YYYY');

  const getStatusClass = (status: string) => {
    return status === 'PAID' ? 'text-green-600' : 'text-red-600';
  };

  // Constructing the HTML for the invoice
  let billContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - ${bill._id.slice(-8).toUpperCase()}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
        }
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body class="bg-gray-100">
      <div class="max-w-4xl mx-auto p-8 bg-white shadow-lg my-8">
        <header class="flex justify-between items-center pb-6 border-b-2 border-gray-800">
          <div>
            <h1 class="text-4xl font-bold text-gray-800">Your Company Name</h1>
            <p class="text-sm text-gray-600">123 Property Lane, Kathmandu, Nepal</p>
            <p class="text-sm text-gray-600">contact@yourcompany.com | 98XXXXXXXX</p>
          </div>
          <h2 class="text-5xl font-light text-gray-500 uppercase tracking-widest">Invoice</h2>
        </header>

        <section class="flex justify-between mt-10">
          <div>
            <h3 class="font-semibold text-gray-500 uppercase tracking-wide">Bill To</h3>
            <p class="font-bold text-lg">${tenant?.fullName}</p>
            <p>${room?.roomNumber} (${room?.floor})</p>
          </div>
          <div class="text-right">
            <p><span class="font-semibold text-gray-600">Invoice #:</span> ${bill._id.slice(-8).toUpperCase()}</p>
            <p><span class="font-semibold text-gray-600">Date:</span> ${todayBS}</p>
            <p class="mt-2 px-4 py-2 bg-gray-100 rounded-md inline-block font-bold text-lg">
              Status: <span class="${getStatusClass(bill.status)}">${bill.status}</span>
            </p>
          </div>
        </section>
  `;

  if (isRentBill) {
    billContent += `
        <section class="mt-12">
          <table class="w-full text-left">
            <thead class="bg-gray-800 text-white">
              <tr>
                <th class="p-4 text-sm font-medium uppercase">Description</th>
                <th class="p-4 text-sm font-medium uppercase text-right">Amount (Rs)</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b">
                <td class="p-4">Rent for period: ${(bill as IRentBill).rentForPeriod}</td>
                <td class="p-4 text-right font-semibold">${(bill as IRentBill).amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </section>
    `;
  } else {
    const utilityBill = bill as IUtilityBill;
    billContent += `
        <section class="mt-12">
            <h3 class="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Bill Details</h3>

            <!-- Electricity Details -->
            <div class="mb-6">
                <h4 class="font-bold text-md mb-2 text-gray-800">Electricity Charges</h4>
                <div class="grid grid-cols-4 gap-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                    <div><p class="font-semibold">Previous Reading</p><p>${utilityBill.electricity.previousReading}</p></div>
                    <div><p class="font-semibold">Current Reading</p><p>${utilityBill.electricity.currentReading}</p></div>
                    <div><p class="font-semibold">Units Consumed</p><p>${utilityBill.electricity.unitsConsumed}</p></div>
                    <div class="text-right"><p class="font-semibold">Amount</p><p>Rs ${utilityBill.electricity.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p></div>
                </div>
            </div>

            <!-- Water Details -->
            <div class="mb-6">
                <h4 class="font-bold text-md mb-2 text-gray-800">Water Charges</h4>
                <div class="grid grid-cols-4 gap-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                    <div><p class="font-semibold">Previous Reading</p><p>${utilityBill.water.previousReading}</p></div>
                    <div><p class="font-semibold">Current Reading</p><p>${utilityBill.water.currentReading}</p></div>
                    <div><p class="font-semibold">Units Consumed</p><p>${utilityBill.water.unitsConsumed}</p></div>
                    <div class="text-right"><p class="font-semibold">Amount</p><p>Rs ${utilityBill.water.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p></div>
                </div>
            </div>
        </section>

        <section class="mt-8">
          <table class="w-full text-left">
            <thead class="bg-gray-800 text-white">
              <tr>
                <th class="p-4 text-sm font-medium uppercase">Summary</th>
                <th class="p-4 text-sm font-medium uppercase text-right">Amount (Rs)</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b"><td class="p-4">Sub-total (Electricity + Water)</td><td class="p-4 text-right font-semibold">${(utilityBill.electricity.amount + utilityBill.water.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
              ${utilityBill.serviceCharge > 0 ? `<tr class="border-b"><td class="p-4">Service Charge</td><td class="p-4 text-right font-semibold">${utilityBill.serviceCharge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>` : ''}
              ${utilityBill.securityCharge > 0 ? `<tr class="border-b"><td class="p-4">Security Charge</td><td class="p-4 text-right font-semibold">${utilityBill.securityCharge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>` : ''}
            </tbody>
          </table>
        </section>
    `;
  }

  billContent += `
        <section class="flex justify-end mt-6">
          <div class="w-full md:w-1/2">
            <div class="flex justify-between p-4 bg-gray-100 rounded-lg">
              <span class="font-bold text-lg">Total Amount</span>
              <span class="font-bold text-lg">Rs ${isRentBill ? (bill as IRentBill).amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : (bill as IUtilityBill).totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </section>

        ${bill.remarks ? `
        <section class="mt-10">
            <h3 class="font-semibold text-gray-500 uppercase tracking-wide">Notes</h3>
            <p class="text-sm text-gray-600 mt-2 p-4 bg-gray-50 rounded-lg">${bill.remarks}</p>
        </section>
        ` : ''}

        <footer class="mt-20 pt-6 border-t text-center text-sm text-gray-500">
          <p>Thank you for your timely payment. This is a computer-generated invoice.</p>
        </footer>
      </div>
      <div class="text-center my-4 no-print">
        <button onclick="window.print()" class="bg-blue-600 text-white px-6 py-2 rounded-md shadow-md hover:bg-blue-700">Print Bill</button>
      </div>
    </body>
    </html>
  `;

  // Open the content in a new tab
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(billContent);
    printWindow.document.close();
  } else {
    alert('Please allow popups for this website to print the bill.');
  }
};
