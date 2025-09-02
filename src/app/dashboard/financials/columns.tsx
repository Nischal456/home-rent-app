'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowUpDown, MoreHorizontal, TrendingUp, TrendingDown, Edit, Trash2 } from 'lucide-react';
import { IExpense } from '@/types';
import NepaliDate from 'nepali-date-converter';

// This function generates the columns for your data table.
// It takes two functions as arguments: one to handle editing, and one to handle deleting.
export const getColumns = (
    onEdit: (expense: IExpense) => void,
    onDelete: (expense: IExpense) => void
): ColumnDef<IExpense>[] => [
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
        const type = row.original.type;
        return (
          <Badge variant={type === 'INCOME' ? 'default' : 'destructive'} className="gap-1">
            {type === 'INCOME' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {type}
          </Badge>
        );
    }
  },
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Date <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => new NepaliDate(row.original.date).format('YYYY-MM-DD')
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => <Badge variant="secondary">{row.original.category}</Badge>
  },
  {
    accessorKey: 'amount',
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => <div className="text-right font-mono">Rs {row.original.amount.toLocaleString()}</div>
  },
  {
    id: 'actions',
    cell: ({ row }) => {
        const expense = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(expense)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                {/* ✅ FIX: This now correctly calls the onDelete function passed from the parent page. */}
                <DropdownMenuItem onClick={() => onDelete(expense)} className="text-red-600 focus:text-red-600 focus:bg-red-50"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
    }
  }
];