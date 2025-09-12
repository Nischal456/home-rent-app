'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, ArrowUpDown, Printer, CheckCircle2, Trash2, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { IRentBill, IUser, IRoom } from '@/types'

// The data type from your API, including populated fields
export type RentBillData = IRentBill & {
  tenantId: IUser;
  roomId: IRoom; // Room is a direct property of the bill
};

const getStatusBadge = (status: 'DUE' | 'PAID' | 'OVERDUE') => {
    switch (status) {
        case 'PAID': return <Badge className="bg-green-500 text-white hover:bg-green-600">PAID</Badge>;
        case 'OVERDUE': return <Badge variant="destructive">OVERDUE</Badge>;
        case 'DUE': default: return <Badge variant="secondary">DUE</Badge>;
    }
};

export const getRentBillColumns = (
    onAction: (action: 'pay' | 'delete', bill: RentBillData) => void,
    onPrint: (bill: RentBillData) => void,
    onShare: (bill: RentBillData) => void // ✅ Added onShare handler
): ColumnDef<RentBillData>[] => [
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
        accessorKey: 'rentForPeriod', 
        header: 'Period' 
    },
    { 
        accessorKey: 'amount', 
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue('amount'));
            const formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'NPR' }).format(amount);
            return <div className="text-right font-medium">{formatted}</div>;
        }
    },
    { 
        accessorKey: 'billDateBS', 
        header: 'Bill Date (B.S.)' 
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
                        <DropdownMenuItem onClick={() => onPrint(bill)}><Printer className="mr-2 h-4 w-4" /> Print Bill</DropdownMenuItem>
                        {/* ✅ Added Share Bill item */}
                        <DropdownMenuItem onClick={() => onShare(bill)}><Share2 className="mr-2 h-4 w-4" /> Share Bill</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {bill.status !== 'PAID' && (<DropdownMenuItem onClick={() => onAction('pay', bill)}><CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Paid</DropdownMenuItem>)}
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onAction('delete', bill)}><Trash2 className="mr-2 h-4 w-4" /> Delete Bill</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];