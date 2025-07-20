'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { IRentBill, IUser, IRoom } from '@/types';
import { Badge } from '@/components/ui/badge';
import { printBill } from '@/lib/printBill';

export type RentBillData = IRentBill;

const getStatusBadge = (status: 'DUE' | 'PAID' | 'OVERDUE') => {
    switch (status) {
        case 'PAID': return <Badge className="bg-green-500 text-white hover:bg-green-600">PAID</Badge>;
        case 'OVERDUE': return <Badge variant="destructive">OVERDUE</Badge>;
        case 'DUE': default: return <Badge variant="secondary">DUE</Badge>;
    }
};

export const getRentBillColumns = (
    openConfirmation: (action: 'pay' | 'delete', bill: RentBillData) => void
): ColumnDef<RentBillData>[] => [
    { accessorKey: 'tenantId.fullName', header: 'Tenant', id: 'tenantName', cell: ({row}) => (row.original.tenantId as unknown as IUser)?.fullName || 'N/A' },
    { accessorKey: 'roomId.roomNumber', header: 'Room', cell: ({row}) => (row.original.roomId as unknown as IRoom)?.roomNumber || 'N/A' },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => `Rs ${row.getValue('amount')}` },
    { accessorKey: 'billDateBS', header: 'Bill Date (B.S.)' },
    { accessorKey: 'rentForPeriod', header: 'Period' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => getStatusBadge(row.getValue('status')) },
    {
        id: 'actions',
        cell: ({ row }) => {
            const bill = row.original;
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    {/* ✅ FIX: Use a Portal to render the menu outside the table's clipping context */}
                    <DropdownMenuPortal>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => printBill(bill, 'rent')}>Print Bill</DropdownMenuItem>
                            {bill.status === 'DUE' && (<DropdownMenuItem onClick={() => openConfirmation('pay', bill)}>Mark as Paid</DropdownMenuItem>)}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => openConfirmation('delete', bill)}>Delete Bill</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenuPortal>
                </DropdownMenu>
            );
        },
    },
];