'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import NepaliDate from 'nepali-date-converter';
import Pusher from 'pusher-js';
import { toast } from 'react-hot-toast';

// --- UI Components & Icons ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge'; // ✅ Added Badge component
import { 
    DollarSign, Users, FileText, Banknote, LayoutDashboard, 
    AlertCircle, Wrench, Receipt, Loader2, ArrowRight, 
    Scale, TrendingUp, TrendingDown, Inbox
} from "lucide-react";

// --- Types ---
import { IUser } from '@/types';

// --- Type Definitions ---
interface SummaryData {
  totalRentDue: number;
  activeTenants: number;
  unpaidUtilityBills: number;
  lastPayment: {
    amount: number;
    date: string;
  };
}

interface FinancialsData {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
}

// --- Reusable SWR Fetcher ---
const fetcher = (url: string) => fetch(url).then(res => res.json());

// --- Reusable UI Components ---

const AnimatedNumber = ({ value, isCurrency = true }: { value: number, isCurrency?: boolean }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const targetValue = value || 0;
    let animationFrameId: number;

    const update = () => {
      const diff = targetValue - displayValue;
      if (Math.abs(diff) < 1) {
        setDisplayValue(targetValue);
        return;
      }
      setDisplayValue(prev => prev + diff * 0.1);
      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, displayValue]);

  const formattedValue = isCurrency 
    ? `Rs ${Math.round(displayValue).toLocaleString('en-IN')}`
    : Math.round(displayValue).toLocaleString('en-IN');

  return <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>{formattedValue}</motion.span>;
};

const StatCard = ({ title, value, Icon, description, isCurrency = true }: { title: string; value: number; Icon: React.ElementType; description?: string; isCurrency?: boolean; }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">
                <AnimatedNumber value={value} isCurrency={isCurrency} />
            </div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
);

const FinancialSummary = ({ data }: { data: FinancialsData | null }) => (
    <Card>
        <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>A quick look at your overall income, expenses, and profit.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="flex items-start space-x-4 rounded-lg bg-green-50 p-4 dark:bg-green-950">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Income</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100"><AnimatedNumber value={data?.totalIncome ?? 0} /></p>
                </div>
            </div>
            <div className="flex items-start space-x-4 rounded-lg bg-red-50 p-4 dark:bg-red-950">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">Total Expense</p>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100"><AnimatedNumber value={data?.totalExpense ?? 0} /></p>
                </div>
            </div>
            <div className="flex items-start space-x-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <Scale className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Net Profit</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100"><AnimatedNumber value={data?.netProfit ?? 0} /></p>
                </div>
            </div>
        </CardContent>
        <CardFooter>
            <Button asChild variant="secondary" className="w-full">
                <Link href="/dashboard/financials">View Full Financial Overview <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
        </CardFooter>
    </Card>
);

// --- Main Dashboard Component ---
export function AdminDashboard() {
  const { data: summaryResponse, error: summaryError, isLoading: isSummaryLoading } = useSWR('/api/dashboard/summary', fetcher);
  const { data: financialsResponse, error: financialsError, isLoading: areFinancialsLoading } = useSWR('/api/financials/summary', fetcher);
  
  // ✅ SWR hook now fetches submissions and the unread count
  const { data: submissionsResponse, mutate: mutateSubmissions } = useSWR('/api/submissions', fetcher);
  const unreadCount = submissionsResponse?.data?.unreadCount ?? 0;
  
  const summaryData: SummaryData | null = summaryResponse?.data ?? null;
  const financialsData: FinancialsData | null = financialsResponse?.data ?? null;
  const todayBS = new NepaliDate().format('ddd, MMMM DD, YYYY', 'np');

  // ✅ useEffect hook to listen for real-time notifications
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
        console.error("Pusher key is not defined.");
        return;
    }

    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    
    const channel = pusherClient.subscribe('admin-notifications');
    
    channel.bind('new-submission', (data: { subject: string, name: string }) => {
      toast.success(`New Message: "${data.subject}" from ${data.name}`);
      // When a new message arrives, tell SWR to re-fetch the data to update the unread count
      mutateSubmissions();
    });

    return () => {
        pusherClient.unsubscribe('admin-notifications');
        pusherClient.disconnect();
    };
  }, [mutateSubmissions]);


  const isLoading = isSummaryLoading || areFinancialsLoading;
  const error = summaryError || financialsError;

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-8">
        <div className="flex items-center justify-between"><Skeleton className="h-8 w-64" /><Skeleton className="h-5 w-48" /></div>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Skeleton className="h-28 rounded-lg" /><Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" /><Skeleton className="h-28 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-3">
            <Skeleton className="h-64 rounded-lg lg:col-span-2" />
            <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <div className="p-8">
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Dashboard</AlertTitle>
                <AlertDescription>Could not fetch all necessary data. Please try again later.</AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2 md:text-3xl">
          <LayoutDashboard className="h-7 w-7" /> Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">{todayBS}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <StatCard title="Total Rent Due" value={summaryData?.totalRentDue ?? 0} Icon={DollarSign} />
        <StatCard title="Active Tenants" value={summaryData?.activeTenants ?? 0} Icon={Users} isCurrency={false} />
        <StatCard title="Unpaid Utility Bills" value={summaryData?.unpaidUtilityBills ?? 0} Icon={FileText} isCurrency={false} />
        <StatCard title="Last Payment Received" value={summaryData?.lastPayment?.amount ?? 0} Icon={Banknote} description={`On ${new Date(summaryData?.lastPayment?.date ?? '').toLocaleDateString()}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <FinancialSummary data={financialsData} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              <Button asChild><Link href="/dashboard/tenants" className="flex items-center justify-start gap-2"><Users className="h-4 w-4"/>Manage Tenants</Link></Button>
              <Button asChild variant="outline"><Link href="/dashboard/financials" className="flex items-center justify-start gap-2"><Scale className="h-4 w-4"/>View Financials</Link></Button>
              <Button asChild variant="outline"><Link href="/dashboard/rent-bills" className="flex items-center justify-start gap-2"><Receipt className="h-4 w-4"/>Add Rent Bill</Link></Button>
              <Button asChild variant="outline"><Link href="/dashboard/utility-bills" className="flex items-center justify-start gap-2"><FileText className="h-4 w-4"/>Add Utility Bill</Link></Button>
              
              {/* ✅ UPDATED SECTION */}
              <Button asChild variant="outline">
                <Link href="/dashboard/inbox" className="flex items-center justify-start gap-2 relative">
                    <Inbox className="h-4 w-4"/>
                    View Inbox
                    {/* The badge will now show the real-time unread count */}
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{unreadCount}</Badge>
                    )}
                </Link>
              </Button>

              <Button asChild variant="outline"><Link href="/dashboard/maintenance" className="flex items-center justify-start gap-2"><Wrench className="h-4 w-4"/>Maintenance Requests</Link></Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}