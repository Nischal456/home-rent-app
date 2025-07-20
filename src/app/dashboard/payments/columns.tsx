'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { IPayment, IUser } from '@/types';
import NepaliDate from 'nepali-date-converter';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

// Define the shape of the data for each row in our table
export type PaymentData = IPayment & {
  tenantId: Pick<IUser, 'fullName'>;
};

// This function defines the columns for the data table
export const getPaymentColumns = (
  onVerify: (payment: PaymentData) => void
): ColumnDef<PaymentData>[] => [
    {
        accessorKey: 'tenantId.fullName',
        header: 'Tenant',
        id: 'tenantName',
    },
    {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => `Rs ${row.original.amount.toLocaleString('en-IN')}`,
    },
    {
        accessorKey: 'createdAt',
        header: 'Submitted On',
        cell: ({ row }) => new NepaliDate(row.getValue('createdAt')).format('YYYY-MM-DD hh:mm A'),
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: () => <Badge variant="destructive">PENDING</Badge>,
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const payment = row.original;
            return (
                <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => onVerify(payment)} 
                    className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Verify & Approve
                </Button>
            );
        },
    },
];