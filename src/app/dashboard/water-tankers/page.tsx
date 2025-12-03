'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import NepaliDate from 'nepali-date-converter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Droplets, TrendingDown, AlertCircle, User, Calendar, Banknote } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// --- Helper Component for Stat Cards ---
const StatCard = ({ title, value, icon, color, subtext }: any) => (
  <Card className="bg-white/80 backdrop-blur-xl shadow-sm border-0">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`p-2 rounded-full ${color}`}>{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </CardContent>
  </Card>
);

export default function AdminWaterTankerPage() {
  const { data: response, error, isLoading } = useSWR('/api/admin/water-tankers', fetcher);
  const tankers = response?.data || [];

  // Calculate Stats
  const { totalCost, totalLiters, monthlyCost } = useMemo(() => {
    const currentMonth = new NepaliDate().getMonth();
    return tankers.reduce((acc: any, t: any) => {
        acc.totalCost += t.cost;
        acc.totalLiters += t.volumeLiters;
        
        // Check if entry is from current month (simplified check)
        const entryDate = new Date(t.entryDate);
        if (new NepaliDate(entryDate).getMonth() === currentMonth) {
            acc.monthlyCost += t.cost;
        }
        return acc;
    }, { totalCost: 0, totalLiters: 0, monthlyCost: 0 });
  }, [tankers]);

  if (isLoading) {
      return (
          <div className="p-8 space-y-6">
              <Skeleton className="h-12 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Skeleton className="h-32"/><Skeleton className="h-32"/><Skeleton className="h-32"/></div>
              <Skeleton className="h-96 w-full" />
          </div>
      );
  }

  if (error) {
      return <div className="p-8"><Alert variant="destructive"><AlertCircle className="h-4 w-4"/><AlertTitle>Error</AlertTitle><AlertDescription>Failed to load water records.</AlertDescription></Alert></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 rounded-full text-blue-600"><Droplets className="h-8 w-8" /></div>
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Water Tanker Logs</h1>
            <p className="text-muted-foreground">Track water supply costs and history.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
            title="Total Cost (All Time)" 
            value={`Rs ${totalCost.toLocaleString()}`} 
            icon={<Banknote className="h-5 w-5 text-green-600"/>} 
            color="bg-green-100"
        />
        <StatCard 
            title="Cost This Month" 
            value={`Rs ${monthlyCost.toLocaleString()}`} 
            icon={<TrendingDown className="h-5 w-5 text-orange-600"/>} 
            color="bg-orange-100"
            subtext="Expenses for current Nepali month"
        />
        <StatCard 
            title="Total Volume Received" 
            value={`${totalLiters.toLocaleString()} Liters`} 
            icon={<Droplets className="h-5 w-5 text-blue-600"/>} 
            color="bg-blue-100"
        />
      </div>

      {/* Records Table */}
      <Card className="border shadow-sm bg-white">
        <CardHeader>
            <CardTitle>Entry History</CardTitle>
            <CardDescription>Records logged by security staff.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Volume</TableHead>
                            <TableHead>Logged By</TableHead>
                            <TableHead className="text-right">Cost</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tankers.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No records found.</TableCell></TableRow>
                        ) : (
                            tankers.map((t: any) => (
                                <TableRow key={t._id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-slate-400"/>
                                            {new NepaliDate(new Date(t.entryDate)).format('YYYY MMMM DD')}
                                            <span className="text-xs text-muted-foreground ml-1">({new Date(t.entryDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            {t.volumeLiters} Liters
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <User className="h-4 w-4"/> {t.addedBy?.fullName || 'Unknown'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold font-mono text-slate-900">
                                        Rs {t.cost.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}