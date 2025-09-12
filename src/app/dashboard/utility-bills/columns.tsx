'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, ArrowUpDown, Printer, CheckCircle2, Trash2, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { IUtilityBill, IUser, IRoom } from '@/types'

export type UtilityBillData = IUtilityBill & {
  tenantId: IUser;
  roomId: IRoom; // Room is a direct property of the bill
};

const getStatusBadge = (status: 'DUE' | 'PAID') => {
    return status === 'PAID' 
        ? <Badge className="bg-green-500 text-white hover:bg-green-600">PAID</Badge> 
        : <Badge variant="secondary">DUE</Badge>;
};

// ✅ UPDATED: Added onShare function parameter
export const getUtilityBillColumns = (
    onAction: (action: 'pay' | 'delete', bill: UtilityBillData) => void,
    onPrint: (bill: UtilityBillData) => void,
    onShare: (bill: UtilityBillData) => void
): ColumnDef<UtilityBillData>[] => [
    { 
        accessorKey: 'tenantId.fullName', 
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                Tenant <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        id: 'tenantName',
    },
    {
        accessorKey: 'roomId.roomNumber',
        header: ({ column }) => (
             <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                Room <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        id: 'roomNumber',
        cell: ({ row }) => (row.original.roomId as IRoom)?.roomNumber || 'N/A',
    },
    { 
        accessorKey: 'billingMonthBS', 
        header: 'Billing Month' 
    },
    { 
        accessorKey: 'totalAmount', 
        header: () => <div className="text-right">Total Amount</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue('totalAmount'));
            const formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'NPR' }).format(amount);
            return <div className="text-right font-medium">{formatted}</div>;
        }
    },
    { 
        accessorKey: 'status', 
        header: 'Status', 
        cell: ({ row }) => getStatusBadge(row.getValue('status')) 
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const bill = row.original;
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onPrint(bill)}>
                            <Printer className="mr-2 h-4 w-4" /> Print Bill
                        </DropdownMenuItem>
                        {/* ✅ ADDED: Share Bill menu item */}
                        <DropdownMenuItem onClick={() => onShare(bill)}>
                            <Share2 className="mr-2 h-4 w-4" /> Share Bill
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {bill.status !== 'PAID' && (
                            <DropdownMenuItem onClick={() => onAction('pay', bill)}>
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Paid
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onAction('delete', bill)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Bill
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];