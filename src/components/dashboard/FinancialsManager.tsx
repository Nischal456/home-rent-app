'use client';

import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, MoreHorizontal, TrendingUp, TrendingDown, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { IExpense } from '@/types';
import { AddExpenseForm } from './AddExpenseForm';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function FinancialsManager() {
  const { data: response, error, isLoading } = useSWR('/api/expenses', fetcher);
  const expenses: IExpense[] = response?.data ?? [];
  const { mutate } = useSWRConfig();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<IExpense | undefined>(undefined);
  
  const handleDelete = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) return;
    
    const promise = fetch(`/api/expenses/${expenseId}`, { method: 'DELETE' }).then(res => {
      if (!res.ok) throw new Error('Failed to delete record.');
      return res.json();
    });

    toast.promise(promise, {
      loading: 'Deleting record...',
      success: 'Record deleted successfully!',
      error: 'Could not delete record.',
    });
    
    await promise;
    mutate('/api/expenses');
  };

  const openForm = (expense?: IExpense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingExpense(undefined);
    mutate('/api/expenses');
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <p className="text-red-500 text-center p-4">Failed to load financial records.</p>;

  return (
    <>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit' : 'Add New'} Financial Record</DialogTitle>
            <DialogDescription>
                {editingExpense ? 'Update the details of this financial record.' : 'Fill in the details to add a new income or expense record.'}
            </DialogDescription>
          </DialogHeader>
          <AddExpenseForm expense={editingExpense} onSuccess={closeForm} />
        </DialogContent>
      </Dialog>
    
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle>Income & Expense Log</CardTitle>
              <CardDescription>A complete log of all financial records.</CardDescription>
            </div>
            <Button onClick={() => openForm()} size="sm" className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Record
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length > 0 ? expenses.map((expense) => (
                  <TableRow key={expense._id.toString()}>
                    <TableCell>
                      <Badge variant={expense.type === 'INCOME' ? 'default' : 'destructive'} className="gap-1">
                        {expense.type === 'INCOME' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {expense.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell><Badge variant="secondary">{expense.category}</Badge></TableCell>
                    <TableCell className="text-right font-mono">Rs {expense.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openForm(expense)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(expense._id.toString())} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">No financial records found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}