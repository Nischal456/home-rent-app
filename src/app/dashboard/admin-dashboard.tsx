'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Users, Activity, ArrowUpRight, Loader2 } from "lucide-react";
import NepaliDate from 'nepali-date-converter';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface SummaryData {
  totalRentDue: number;
  activeTenants: number;
  unpaidUtilityBills: number;
  lastPayment: { amount: number; date: string; };
}

export function AdminDashboard() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const todayBS = new NepaliDate().format('dddd, MMMM DD, YYYY', 'np');

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/dashboard/summary');
        const result = await res.json();
        if (result.success) setSummaryData(result.data);
      } catch (error) {
        console.error("Failed to fetch summary data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (isLoading || !summaryData) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">{todayBS}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Rent Due</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">Rs {summaryData.totalRentDue.toLocaleString('en-IN')}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active Tenants</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{summaryData.activeTenants}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Unpaid Utility Bills</CardTitle><Activity className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{summaryData.unpaidUtilityBills}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Last Payment</CardTitle><ArrowUpRight className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">Rs {summaryData.lastPayment.amount.toLocaleString('en-IN')}</div><p className="text-xs text-muted-foreground">On {summaryData.lastPayment.date}</p></CardContent></Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2"><CardHeader><CardTitle>Recent Transactions</CardTitle><CardDescription>A list of recent rent and utility payments.</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">Transaction list coming soon...</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader><CardContent className="grid gap-4"><Button asChild><Link href="/dashboard/tenants">Manage Tenants</Link></Button><Button asChild><Link href="/dashboard/rent-bills">Add Rent Bill</Link></Button><Button asChild><Link href="/dashboard/utility-bills">Add Utility Bill</Link></Button></CardContent></Card>
      </div>
    </>
  );
}
