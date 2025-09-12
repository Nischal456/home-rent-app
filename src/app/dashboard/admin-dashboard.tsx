'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import NepaliDate from 'nepali-date-converter';
import Pusher from 'pusher-js';
import { toast } from 'react-hot-toast';
import { useMediaQuery } from 'usehooks-ts';

// --- UI Components & Icons ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
    DollarSign, Users, FileText, Banknote, LayoutDashboard, 
    AlertCircle, Wrench, Receipt, ArrowRight, 
    Scale, TrendingUp, TrendingDown, Inbox
} from "lucide-react";

// --- Types ---
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

// --- Reusable SWR Fetcher & Components ---
const fetcher = (url: string) => fetch(url).then(res => res.json());

const AnimatedNumber = ({ value }: { value: number }) => {
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

  return <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{Math.round(displayValue).toLocaleString('en-IN')}</motion.span>;
};

const StatCard = ({ title, value, Icon, description, isCurrency = true }: { title: string; value: number; Icon: React.ElementType; description?: string; isCurrency?: boolean; }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">
                {isCurrency && 'Rs '}
                <AnimatedNumber value={value} />
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
            <div className="flex items-start space-x-4 rounded-lg bg-green-50 p-4 dark:bg-green-950"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900"><TrendingUp className="h-5 w-5 text-green-600" /></div><div><p className="text-sm font-medium text-green-700">Total Income</p><p className="text-2xl font-bold text-green-900">Rs <AnimatedNumber value={data?.totalIncome ?? 0} /></p></div></div>
            <div className="flex items-start space-x-4 rounded-lg bg-red-50 p-4 dark:bg-red-950"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900"><TrendingDown className="h-5 w-5 text-red-600" /></div><div><p className="text-sm font-medium text-red-700">Total Expense</p><p className="text-2xl font-bold text-red-900">Rs <AnimatedNumber value={data?.totalExpense ?? 0} /></p></div></div>
            <div className="flex items-start space-x-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-950"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900"><Scale className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm font-medium text-blue-700">Net Profit</p><p className="text-2xl font-bold text-blue-900">Rs <AnimatedNumber value={data?.netProfit ?? 0} /></p></div></div>
        </CardContent>
        <CardFooter><Button asChild variant="secondary" className="w-full"><Link href="/dashboard/financials">View Full Financial Overview <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></CardFooter>
    </Card>
);

// ✅ NEW: Reusable list of action buttons
const QuickActionsList = () => (
    <div className="grid gap-3">
        <Button asChild><Link href="/dashboard/tenants" className="flex items-center justify-start gap-2"><Users className="h-4 w-4"/>Manage Tenants</Link></Button>
        <Button asChild variant="outline"><Link href="/dashboard/financials" className="flex items-center justify-start gap-2"><Scale className="h-4 w-4"/>View Financials</Link></Button>
        <Button asChild variant="outline"><Link href="/dashboard/rent-bills" className="flex items-center justify-start gap-2"><Receipt className="h-4 w-4"/>Add Rent Bill</Link></Button>
        <Button asChild variant="outline"><Link href="/dashboard/utility-bills" className="flex items-center justify-start gap-2"><FileText className="h-4 w-4"/>Add Utility Bill</Link></Button>
        <Button asChild variant="outline"><Link href="/dashboard/maintenance" className="flex items-center justify-start gap-2"><Wrench className="h-4 w-4"/>Maintenance Requests</Link></Button>
    </div>
);

// --- Main Dashboard Component ---
export function AdminDashboard() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { data: summaryResponse, error: summaryError } = useSWR('/api/dashboard/summary', fetcher);
  const { data: financialsResponse, error: financialsError } = useSWR('/api/financials/summary', fetcher);
  const { data: submissionsResponse, mutate: mutateSubmissions } = useSWR('/api/submissions', fetcher);
  
  const summaryData: SummaryData | null = summaryResponse?.data ?? null;
  const financialsData: FinancialsData | null = financialsResponse?.data ?? null;
  const unreadCount = submissionsResponse?.data?.unreadCount ?? 0;
  
  const todayBS = new NepaliDate().format('ddd, MMMM DD, YYYY', 'np');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) return;
    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
    const channel = pusherClient.subscribe('admin-notifications');
    channel.bind('new-submission', (data: { subject: string, name: string }) => {
      toast.success(`New Message: "${data.subject}" from ${data.name}`);
      mutateSubmissions();
    });
    return () => {
      pusherClient.unsubscribe('admin-notifications');
      pusherClient.disconnect();
    };
  }, [mutateSubmissions]);

  const isLoading = !summaryResponse || !financialsResponse;
  const error = summaryError || financialsError;

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-8">
        <div className="flex items-center justify-between"><Skeleton className="h-8 w-64" /><Skeleton className="h-5 w-48" /></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3"><Skeleton className="h-64 lg:col-span-2" /><Skeleton className="h-64" /></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error Loading Dashboard</AlertTitle><AlertDescription>Could not fetch data. Please try again later.</AlertDescription></Alert></div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* ✅ NEW: Responsive Header with Greeting and prominent actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{greeting}, Admin!</h1>
            <p className="text-sm text-muted-foreground">{todayBS}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
            <Button asChild variant="outline" className="relative">
                <Link href="/dashboard/inbox">
                    <Inbox className="h-4 w-4" />
                    {!isMobile && <span className="ml-2">Inbox</span>}
                    {unreadCount > 0 && <Badge className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{unreadCount}</Badge>}
                </Link>
            </Button>
            {isMobile && (
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="secondary" size="icon"><Wrench className="h-4 w-4" /></Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader><SheetTitle>Quick Actions</SheetTitle></SheetHeader>
                        <div className="py-4"><QuickActionsList/></div>
                    </SheetContent>
                </Sheet>
            )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Rent Due" value={summaryData?.totalRentDue ?? 0} Icon={DollarSign} />
        <StatCard title="Active Tenants" value={summaryData?.activeTenants ?? 0} Icon={Users} isCurrency={false} />
        <StatCard title="Unpaid Utility Bills" value={summaryData?.unpaidUtilityBills ?? 0} Icon={FileText} isCurrency={false} />
        <StatCard title="Last Payment Received" value={summaryData?.lastPayment?.amount ?? 0} Icon={Banknote} description={`On ${new Date(summaryData?.lastPayment?.date ?? '').toLocaleDateString()}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <FinancialSummary data={financialsData} />
        </div>

        {/* --- Quick Actions Card is now hidden on mobile --- */}
        <div className="hidden md:block">
          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent>
                <QuickActionsList/>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}