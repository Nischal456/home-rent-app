'use client';

import { useState, useMemo, useCallback } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle, TrendingUp, TrendingDown, Scale, AlertCircle, Edit, Trash2, MoreVertical, PackageOpen, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { IExpense } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from 'react-hot-toast';
import { DataTable } from '@/components/ui/data-table';
import { getColumns } from './columns';
import { AddExpenseForm } from '@/components/dashboard/AddExpenseForm';
import { useMediaQuery } from 'usehooks-ts';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart } from '@mui/x-charts/BarChart';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const StatCard = ({ title, amount, icon, color }: { title: string, amount: number, icon: React.ReactNode, color: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className={color}>{icon}</div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">Rs {amount.toLocaleString()}</div>
        </CardContent>
    </Card>
);

const TransactionCard = ({ expense, onEdit, onDelete }: { expense: IExpense, onEdit: () => void, onDelete: () => void }) => {
    const isIncome = expense.type === 'INCOME';
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className={`flex items-center space-x-4 p-4 rounded-lg border-l-4 ${isIncome ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}`}
        >
            <div className={`p-2 rounded-full ${isIncome ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
                {isIncome ? <ArrowUpCircle className="h-6 w-6" /> : <ArrowDownCircle className="h-6 w-6" />}
            </div>
            <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{new Date(expense.date).toLocaleDateString()}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{expense.description}</p>
            </div>
            <div className="text-right">
                <p className={`font-bold text-lg ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                    {isIncome ? '+' : '-'}Rs {expense.amount.toLocaleString()}
                </p>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} className="text-red-500 focus:text-red-500 focus:bg-red-50"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </motion.div>
    );
};

const EmptyTransactions = ({ onAddNew }: { onAddNew: () => void }) => (
    <div className="text-center py-16 px-4">
        <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No transactions yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">Get started by adding your first income or expense.</p>
        <div className="mt-6">
            <Button onClick={onAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Add New Record</Button>
        </div>
    </div>
);


export default function FinancialsPage() {
    const { data: summaryResponse, error: summaryError, isLoading: isSummaryLoading, mutate: mutateSummary } = useSWR('/api/financials/summary', fetcher);
    const { data: expensesResponse, error: expensesError, isLoading: areExpensesLoading, mutate: mutateExpenses } = useSWR('/api/expenses', fetcher);
    
    const isMobile = useMediaQuery("(max-width: 768px)");

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<IExpense | undefined>(undefined);
    const [deletingRecord, setDeletingRecord] = useState<IExpense | null>(null);

    const summary = summaryResponse?.data;
    const expenses: IExpense[] = expensesResponse?.data ?? [];

    const handleDelete = async () => {
        if (!deletingRecord) return;
        const promise = fetch(`/api/expenses/${deletingRecord._id}`, { method: 'DELETE' });
        toast.promise(promise, { loading: 'Deleting record...', success: 'Record deleted!', error: 'Failed to delete record.' });
        
        try {
            await promise;
            mutateExpenses();
            mutateSummary();
        } catch (e) { /* Toast handles errors */ } 
        finally { setDeletingRecord(null); }
    };

    const openForm = useCallback((record?: IExpense) => {
        setEditingRecord(record);
        setIsFormOpen(true);
    }, []);

    const onOpenDeleteDialog = useCallback((record: IExpense) => {
        setDeletingRecord(record);
    }, []);

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingRecord(undefined);
        mutateExpenses();
        mutateSummary();
    };
    
    const columns = useMemo(() => getColumns(openForm, onOpenDeleteDialog), [openForm, onOpenDeleteDialog]);
    
    const chartData = useMemo(() => {
        if (!summary?.monthlyData) return { xAxis: [], series: [] };
        const labels = summary.monthlyData.map((d: any) => d.name);
        const incomeData = summary.monthlyData.map((d: any) => d.income);
        const expenseData = summary.monthlyData.map((d: any) => d.expense);

        return {
            xAxis: [{ scaleType: 'band' as const, data: labels }],
            series: [
                { data: incomeData, label: 'Income', color: '#10b981' },
                { data: expenseData, label: 'Expense', color: '#ef4444' },
            ]
        };
    }, [summary]);

    if (isSummaryLoading || areExpensesLoading) {
        return (
            <div className="p-4 md:p-8 space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-5 w-80" /></div>
                    <Skeleton className="h-10 w-40" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
                <Skeleton className="h-96 w-full" /> {/* Skeleton for chart */}
                <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </div>
        );
    }

    if (summaryError || expensesError) {
        return (
            <div className="p-8">
                <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>Failed to load financial data.</AlertDescription></Alert>
            </div>
        );
    }

    return (
        <>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent><DialogHeader><DialogTitle>{editingRecord ? 'Edit' : 'Add New'} Record</DialogTitle><DialogDescription>Fill in the details for the transaction.</DialogDescription></DialogHeader><AddExpenseForm expense={editingRecord} onSuccess={closeForm} /></DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingRecord} onOpenChange={() => setDeletingRecord(null)}>
                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the record for "{deletingRecord?.description}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="p-4 md:p-8 space-y-8"
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div><h1 className="text-3xl font-bold">Financial Overview</h1><p className="text-muted-foreground">Manage your income, expenses, and net profit.</p></div>
                    <Button onClick={() => openForm()}><PlusCircle className="mr-2 h-4 w-4" /> Add New Record</Button>
                </div>
                
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard title="Total Income" amount={summary?.totalIncome || 0} icon={<TrendingUp />} color="text-green-500" />
                    <StatCard title="Total Expense" amount={summary?.totalExpense || 0} icon={<TrendingDown />} color="text-red-500" />
                    <StatCard title="Net Profit" amount={summary?.netProfit || 0} icon={<Scale />} color="text-blue-500" />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Last 6 Months Performance</CardTitle>
                        <CardDescription>A visual breakdown of income vs. expenses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div style={{ width: '100%', height: 350 }}>
                            <BarChart
                                xAxis={chartData.xAxis}
                                series={chartData.series}
                                layout={isMobile ? 'horizontal' : 'vertical'}
                                grid={{ vertical: true, horizontal: false }}
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

                <Card>
                    <CardHeader>
                        <CardTitle>Transactions Log</CardTitle>
                        <CardDescription>A detailed history of all your financial records.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {expenses.length === 0 ? (
                            <EmptyTransactions onAddNew={() => openForm()} />
                        ) : isMobile ? (
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {expenses.map((expense) => (
                                        <TransactionCard 
                                            key={expense._id.toString()} 
                                            expense={expense}
                                            onEdit={() => openForm(expense)}
                                            onDelete={() => onOpenDeleteDialog(expense)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <DataTable columns={columns} data={expenses} filterColumnId="description" filterPlaceholder="Filter by description..." />
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </>
    );
}