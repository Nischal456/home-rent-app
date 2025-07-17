'use client';

import { ColumnDef as UtilColumnDef } from '@tanstack/react-table';
import { MoreHorizontal as UtilMoreHorizontal } from 'lucide-react';
import { Button as UtilButton } from '@/components/ui/button';
import { DropdownMenu as UtilDropdownMenu, DropdownMenuContent as UtilDropdownMenuContent, DropdownMenuItem as UtilDropdownMenuItem, DropdownMenuLabel as UtilDropdownMenuLabel, DropdownMenuSeparator as UtilDropdownMenuSeparator, DropdownMenuTrigger as UtilDropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge as UtilBadge } from '@/components/ui/badge';
import { IUtilityBill } from '@/types';
import { printBill as printUtilityBill } from '@/lib/printBill';

export type UtilityBillData = IUtilityBill;

const getUtilStatusBadge = (status: 'DUE' | 'PAID') => {
    return status === 'PAID' ? <UtilBadge className="bg-green-500 text-white hover:bg-green-600">PAID</UtilBadge> : <UtilBadge variant="secondary">DUE</UtilBadge>;
};

export const getUtilityBillColumns = (
    openConfirmation: (action: 'pay' | 'delete', bill: UtilityBillData) => void
): UtilColumnDef<UtilityBillData>[] => [
    { accessorKey: 'tenantId.fullName', header: 'Tenant', id: 'tenantName', cell: ({ row }) => (row.original.tenantId as any)?.fullName || 'N/A' },
    { accessorKey: 'billingMonthBS', header: 'Billing Month' },
    { accessorKey: 'totalAmount', header: 'Total Amount', cell: ({ row }) => `Rs ${row.original.totalAmount.toLocaleString('en-IN')}` },
    { accessorKey: 'electricity.unitsConsumed', header: 'Elec. Units' },
    { accessorKey: 'water.unitsConsumed', header: 'Water Units' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => getUtilStatusBadge(row.getValue('status')) },
    {
        id: 'actions',
        cell: ({ row }) => {
            const bill = row.original;
            return (
                <UtilDropdownMenu>
                    <UtilDropdownMenuTrigger asChild><UtilButton variant="ghost" className="h-8 w-8 p-0"><UtilMoreHorizontal className="h-4 w-4" /></UtilButton></UtilDropdownMenuTrigger>
                    <UtilDropdownMenuContent align="end">
                        <UtilDropdownMenuLabel>Actions</UtilDropdownMenuLabel>
                        <UtilDropdownMenuItem onClick={() => printUtilityBill(bill, 'utility')}>Print Bill</UtilDropdownMenuItem>
                        {bill.status === 'DUE' && (<UtilDropdownMenuItem onClick={() => openConfirmation('pay', bill)}>Mark as Paid</UtilDropdownMenuItem>)}
                        <UtilDropdownMenuSeparator />
                        <UtilDropdownMenuItem className="text-red-600" onClick={() => openConfirmation('delete', bill)}>Delete Bill</UtilDropdownMenuItem>
                    </UtilDropdownMenuContent>
                </UtilDropdownMenu>
            );
        },
    },
];