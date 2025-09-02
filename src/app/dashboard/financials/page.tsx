'use client';

import { useState, useMemo, useCallback } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, TrendingUp, TrendingDown, Scale, AlertCircle, Edit, Trash2, MoreVertical, PackageOpen, ArrowUpCircle, ArrowDownCircle, BarChart2, List } from 'lucide-react';
import { IExpense } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from 'usehooks-ts';
import { cn } from '@/lib/utils'; // ✅ FIX: Added the missing import for 'cn'
import { DataTable } from '@/components/ui/data-table';
import { getColumns } from './columns';
import { AddExpenseForm } from '@/components/dashboard/AddExpenseForm';
import { FinancialsChart } from '@/components/dashboard/FinancialsChart';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const StatCard = ({ title, amount, icon, color }: { title: string, amount: number, icon: React.ReactNode, color: string }) => (
    <Card className="bg-background/70 backdrop-blur-sm">
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
            className="flex items-center space-x-4 p-3 rounded-lg border bg-card"
        >
            <div className={`p-2 rounded-full ${isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {isIncome ? <ArrowUpCircle className="h-5 w-5" /> : <ArrowDownCircle className="h-5 w-5" />}
            </div>
            <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{expense.description}</p>
                <p className="text-xs text-muted-foreground">{new Date(expense.date).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
                <p className={`font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                    {isIncome ? '+' : '-'}Rs {expense.amount.toLocaleString()}
                </p>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} className="text-red-500"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
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

// --- MAIN FINANCIALS PAGE COMPONENT ---
export default function FinancialsPage() {
    const { data: summaryResponse, error: summaryError, isLoading: isSummaryLoading, mutate: mutateSummary } = useSWR('/api/financials/summary', fetcher);
    const { data: expensesResponse, error: expensesError, isLoading: areExpensesLoading, mutate: mutateExpenses } = useSWR('/api/expenses', fetcher);
    
    const isMobile = useMediaQuery("(max-width: 768px)");

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<IExpense | undefined>(undefined);
    const [deletingRecord, setDeletingRecord] = useState<IExpense | null>(null);

    const summary = summaryResponse?.data;
    const expenses: IExpense[] = expensesResponse?.data ?? [];

    const handleDelete = async () => { /* ... (handleDelete logic) ... */ };
    const openForm = useCallback((record?: IExpense) => { setEditingRecord(record); setIsFormOpen(true); }, []);
    const onOpenDeleteDialog = useCallback((record: IExpense) => { setDeletingRecord(record); }, []);
    const closeForm = () => { setIsFormOpen(false); setEditingRecord(undefined); mutateExpenses(); mutateSummary(); };
    
    const columns = useMemo(() => getColumns(openForm, onOpenDeleteDialog), [openForm, onOpenDeleteDialog]);

    if (isSummaryLoading || areExpensesLoading) { /* ... (Skeleton UI) ... */ }
    if (summaryError || expensesError) { /* ... (Error UI) ... */ }

    return (
        <>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}><DialogContent><DialogHeader><DialogTitle>{editingRecord ? 'Edit' : 'Add New'} Record</DialogTitle><DialogDescription>Fill in the details for the transaction.</DialogDescription></DialogHeader><AddExpenseForm expense={editingRecord} onSuccess={closeForm} /></DialogContent></Dialog>
            <AlertDialog open={!!deletingRecord} onOpenChange={() => setDeletingRecord(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the record for "{deletingRecord?.description}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
            
            {isMobile && (
                <Button onClick={() => openForm()} className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50 flex items-center justify-center">
                    <PlusCircle className="h-8 w-8" />
                </Button>
            )}
            
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
                className="p-4 md:p-8 space-y-8"
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div><h1 className="text-3xl font-bold">Financial Overview</h1><p className="text-muted-foreground">Manage your income, expenses, and net profit.</p></div>
                    {!isMobile && <Button onClick={() => openForm()}><PlusCircle className="mr-2 h-4 w-4" /> Add New Record</Button>}
                </div>
                
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard title="Total Income" amount={summary?.totalIncome || 0} icon={<TrendingUp />} color="text-green-500" />
                    <StatCard title="Total Expense" amount={summary?.totalExpense || 0} icon={<TrendingDown />} color="text-red-500" />
                    <StatCard title="Net Profit" amount={summary?.netProfit || 0} icon={<Scale />} color="text-blue-500" />
                </div>

                <Tabs defaultValue="overview" className="w-full">
                    {isMobile && (
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="overview"><BarChart2 className="mr-2 h-4 w-4"/> Overview</TabsTrigger>
                            <TabsTrigger value="transactions"><List className="mr-2 h-4 w-4"/> Transactions</TabsTrigger>
                        </TabsList>
                    )}

                    <TabsContent value="overview" className={cn(isMobile && "mt-6")}>
                        <FinancialsChart data={summary?.monthlyData || []} />
                    </TabsContent>

                    <TabsContent value="transactions" className={cn(isMobile && "mt-6")}>
                         <Card className={cn(!isMobile && "hidden")}>
                            <CardHeader>
                                <CardTitle>Transactions Log</CardTitle>
                                <CardDescription>A detailed history of all your financial records.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {expenses.length === 0 ? (
                                    <EmptyTransactions onAddNew={() => openForm()} />
                                ) : (
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
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
                
                <div className={cn(isMobile && "hidden")}>
                    <Card>
                         <CardHeader>
                            <CardTitle>Transactions Log</CardTitle>
                            <CardDescription>A detailed history of all your financial records.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={columns} data={expenses} filterColumnId="description" filterPlaceholder="Filter by description..." />
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
        </>
    );
}