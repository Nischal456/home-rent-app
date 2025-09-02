import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Expense from '@/models/Expense';
// import { getToken } from 'next-auth/jwt'; // Uncomment to secure this route

export async function GET() {
  // const token = await getToken({ req: request });
  // if (!token || token.role !== 'ADMIN') {
  //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  // }
  
  await dbConnect();
  try {
    const records = await Expense.find({});
    
    // Calculate total income and expense
    const summary = records.reduce((acc, record) => {
        if (record.type === 'INCOME') {
            acc.totalIncome += record.amount;
        } else {
            acc.totalExpense += record.amount;
        }
        return acc;
    }, { totalIncome: 0, totalExpense: 0 });

    const netProfit = summary.totalIncome - summary.totalExpense;
    
    // Create data for the last 6 months for the chart
    const monthlyData: { name: string, income: number, expense: number }[] = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      monthlyData.push({ name: monthName, income: 0, expense: 0 });
    }

    records.forEach(record => {
      const recordDate = new Date(record.date);
      const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

      if (recordDate >= sixMonthsAgo) {
          const recordMonth = recordDate.toLocaleString('default', { month: 'short' });
          const monthData = monthlyData.find(m => m.name === recordMonth);
          if (monthData) {
            if (record.type === 'INCOME') {
              monthData.income += record.amount;
            } else {
              monthData.expense += record.amount;
            }
          }
      }
    });

    return NextResponse.json({ 
        success: true, 
        data: { 
            ...summary, 
            netProfit, 
            monthlyData 
        } 
    });
  } catch (error) {
    console.error("Error fetching financials summary:", error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}