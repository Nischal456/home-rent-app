'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion'; // Still needed for AnimatedNumber
import NepaliDate from 'nepali-date-converter';

// UI & Icons
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DollarSign, Users, FileText, Banknote, LayoutDashboard, AlertCircle, Wrench, Receipt } from "lucide-react";

// --- Type Definition ---
interface SummaryData {
  totalRentDue: number;
  activeTenants: number;
  unpaidUtilityBills: number;
  lastPayment: {
    amount: number;
    date: string;
  };
}

// --- Reusable Animated Number Component ---
const AnimatedNumber = ({ value, isCurrency = true }: { value: number, isCurrency?: boolean }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setDisplayValue(value));
    return () => cancelAnimationFrame(animation);
  }, [value]);

  const formattedValue = isCurrency 
    ? `Rs ${Math.round(displayValue).toLocaleString('en-IN')}`
    : Math.round(displayValue).toLocaleString('en-IN');
    
  return <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>{formattedValue}</motion.span>;
};

// --- Main Dashboard Component ---
export function AdminDashboard() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const todayBS = new NepaliDate().format('ddd, MMMM DD, YYYY', 'np');

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/dashboard/summary');
        if (!res.ok) throw new Error('Failed to fetch summary data from the server.');
        const result = await res.json();
        if (result.success) {
          setSummaryData(result.data);
        } else {
          throw new Error(result.message || 'An unknown error occurred.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        console.error("Failed to fetch summary data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, []);

  // --- Loading State UI ---
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-64 xl:col-span-2" />
            <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // --- Error State UI ---
  if (error) {
    return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2 md:text-3xl">
          <LayoutDashboard className="h-7 w-7" /> Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">{todayBS}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Rent Due</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold"><AnimatedNumber value={summaryData?.totalRentDue ?? 0} /></div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active Tenants</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold"><AnimatedNumber value={summaryData?.activeTenants ?? 0} isCurrency={false} /></div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Unpaid Utility Bills</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold"><AnimatedNumber value={summaryData?.unpaidUtilityBills ?? 0} isCurrency={false}/></div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Last Payment</CardTitle><Banknote className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold"><AnimatedNumber value={summaryData?.lastPayment.amount ?? 0} /></div><p className="text-xs text-muted-foreground">On {new Date(summaryData?.lastPayment.date ?? '').toLocaleDateString()}</p></CardContent></Card>
      </div>
      
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2"><CardHeader><CardTitle>Recent Transactions</CardTitle><CardDescription>A list of recent rent and utility payments.</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">Transaction list coming soon...</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild variant="default"><Link href="/dashboard/tenants" className="flex items-center justify-start gap-2"><Users className="h-4 w-4"/>Manage Tenants</Link></Button>
            <Button asChild variant="outline"><Link href="/dashboard/rent-bills" className="flex items-center justify-start gap-2"><Receipt className="h-4 w-4"/>Add Rent Bill</Link></Button>
            <Button asChild variant="outline"><Link href="/dashboard/utility-bills" className="flex items-center justify-start gap-2"><FileText className="h-4 w-4"/>Add Utility Bill</Link></Button>
            <Button asChild variant="outline"><Link href="/dashboard/maintenance" className="flex items-center justify-start gap-2"><Wrench className="h-4 w-4"/>Maintenance Requests</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}