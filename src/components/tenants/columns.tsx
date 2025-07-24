'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Define the shape of your Tenant data
export interface Tenant {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  status: 'ACTIVE' | 'INACTIVE';
  leaseEndDate?: string;
  roomId?: {
    _id: string;
    roomNumber: string;
  } | null;
}

// Function to generate columns, passing callbacks for actions
export const getTenantColumns = (
  onAssignRoom: (tenant: Tenant) => void,
  onDelete: (tenant: Tenant) => void
): ColumnDef<Tenant>[] => [
  {
    accessorKey: 'fullName',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">
        <div>{row.original.fullName}</div>
        <div className="text-xs text-muted-foreground">{row.original.email}</div>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'roomId',
    header: 'Assigned Room',
    cell: ({ row }) => {
      const room = row.original.roomId;
      return room ? (
        <Badge variant="outline">{room.roomNumber}</Badge>
      ) : (
        <span className="text-muted-foreground">N/A</span>
      );
    },
  },
  {
    accessorKey: 'phoneNumber',
    header: 'Phone Number',
  },
  {
    accessorKey: 'leaseEndDate',
    header: 'Lease End Date',
    cell: ({ row }) => {
      const date = row.original.leaseEndDate;
      return date ? new Date(date).toLocaleDateString() : 'N/A';
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const tenant = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
               <Link href={`/dashboard/tenants/${tenant._id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAssignRoom(tenant)}>
              {tenant.roomId ? 'Change Room' : 'Assign Room'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onDelete(tenant)}
            >
              Delete Tenant
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];