'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { IUser, IRoom } from '@/types';
import Link from 'next/link'; // ✅ Import the Link component

export type Tenant = IUser;

export const getTenantColumns = (
  onAssignRoom: (tenant: Tenant) => void,
  onDeleteTenant: (tenant: Tenant) => void
): ColumnDef<Tenant>[] => [
    { 
      accessorKey: 'fullName', 
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Full Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ) 
    },
    { 
      accessorKey: 'email', 
      header: 'Email' 
    },
    { 
      accessorKey: 'phoneNumber', 
      header: 'Phone Number' 
    },
    { 
      accessorKey: 'roomId', // Keep accessor key for data access
      header: 'Room', 
      cell: ({ row }) => {
        const room = row.original.roomId as IRoom | undefined; // Safe cast
        return room?.roomNumber ? 
          <Badge variant="outline">{room.roomNumber}</Badge> : 
          <Badge variant="destructive">Unassigned</Badge>;
      }
    },
    { 
      accessorKey: 'createdAt', 
      header: 'Joined On', 
      cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleDateString('en-CA') 
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
                        {/* ✅ FIX: Wrap the menu item in a Link component */}
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/tenants/${tenant._id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAssignRoom(tenant)}>
                          Assign Room
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={() => onDeleteTenant(tenant)}
                        >
                          Delete Tenant
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];