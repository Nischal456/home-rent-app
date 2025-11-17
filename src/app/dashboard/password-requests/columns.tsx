'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Edit } from 'lucide-react';
import { IPasswordResetRequest } from '@/models/PasswordResetRequest';
import { IUser } from '@/types';

// Helper to get nested tenant data
const getTenantData = (row: any, field: keyof IUser) => {
  const tenant = row.original.userId as IUser;
  return tenant ? tenant[field] : 'N/A';
};

export const getColumns = (
  onReset: (request: IPasswordResetRequest) => void
): ColumnDef<IPasswordResetRequest>[] => [
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Date <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
  },
  {
    accessorKey: 'name',
    header: 'Tenant Name',
    cell: ({ row }) => getTenantData(row, 'fullName')
  },
  {
    accessorKey: 'room',
    header: 'Room',
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => getTenantData(row, 'email')
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge variant="destructive">{row.original.status}</Badge>
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Button variant="default" size="sm" onClick={() => onReset(row.original)}>
        <Edit className="mr-2 h-4 w-4" /> Reset Password
      </Button>
    ),
  }
];