'use client';

import { useMemo, useState, useEffect } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { useMediaQuery } from 'usehooks-ts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';

interface MonthlyData {
  name: string;
  income: number;
  expense: number;
}

interface FinancialsChartProps {
  data: MonthlyData[];
}

export function FinancialsChart({ data }: FinancialsChartProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [hasMounted, setHasMounted] = useState(false);

  // This effect ensures the component only renders on the client side, after mounting.
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const chartAxisAndSeriesData = useMemo(() => {
    if (!data) return { axis: [], series: [] };
    const labels = data.map(d => d.name);
    const incomeData = data.map(d => d.income);
    const expenseData = data.map(d => d.expense);

    return {
      axis: [{ scaleType: 'band' as const, data: labels }],
      series: [
        { data: incomeData, label: 'Income', color: '#10b981' },
        { data: expenseData, label: 'Expense', color: '#ef4444' },
      ],
    };
  }, [data]);

  // Before the component has mounted, show a skeleton loader.
  if (!hasMounted) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Last 6 Months Performance</CardTitle>
        <CardDescription>A visual breakdown of income vs. expenses.</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 350 }}>
          <BarChart
            // ✅ DEFINITIVE FIX: Conditionally assign the axis data based on the layout.
            // This is now safe because `isMobile` will be correct before the chart renders.
            yAxis={isMobile ? chartAxisAndSeriesData.axis : undefined}
            xAxis={isMobile ? undefined : chartAxisAndSeriesData.axis}
            series={chartAxisAndSeriesData.series}
            layout={isMobile ? 'horizontal' : 'vertical'}
            grid={{ vertical: !isMobile, horizontal: isMobile }}
            margin={{ top: 50, right: 20, bottom: 40, left: 70 }}
            slotProps={{
              legend: {
                position: { vertical: 'top', horizontal: 'center' },
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}