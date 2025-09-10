'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { ISubmission } from '@/types';
import NepaliDate from 'nepali-date-converter';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export const getColumns = (
    onView: (submission: ISubmission) => void,
    onDelete: (submission: ISubmission) => void // ✅ Add onDelete handler
): ColumnDef<ISubmission>[] => [
  { 
    accessorKey: 'status', 
    header: 'Status', 
    cell: ({ row }) => <Badge variant={row.original.status === 'UNREAD' ? 'destructive' : 'default'}>{row.original.status}</Badge> 
  },
  { 
    accessorKey: 'createdAt', 
    header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Date <ArrowUpDown className="ml-2 h-4 w-4" /></Button>), 
    // ✅ FIX: The correct format for time is h:mm A
    cell: ({ row }) => new NepaliDate(row.original.createdAt).format('YYYY-MM-DD h:mm A') 
  },
  { accessorKey: 'name', header: 'From' },
  { accessorKey: 'contact', header: 'Contact' },
  { accessorKey: 'subject', header: 'Subject' },
  {
    id: 'actions',
    cell: ({ row }) => {
        const submission = row.original;
        return (
            <div className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(submission)}>View Message</DropdownMenuItem>
                        {/* ✅ ADDED: Delete option */}
                        <DropdownMenuItem onClick={() => onDelete(submission)} className="text-red-500">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    }
  }
];