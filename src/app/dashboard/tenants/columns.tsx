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
import { IUser } from '@/types';

// The Tenant type uses the central IUser interface
export type Tenant = IUser;

// This function generates the column definitions for the tenants table.
// It takes callback functions for handling actions like assigning a room or deleting a tenant.
export const getTenantColumns = (
  onAssignRoom: (tenant: Tenant) => void,
  onDeleteTenant: (tenant: Tenant) => void
): ColumnDef<Tenant>[] => [
    // Column for the tenant's full name, with sorting capability.
    { 
      accessorKey: 'fullName', 
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Full Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ) 
    },
    // Column for the tenant's email address.
    { 
      accessorKey: 'email', 
      header: 'Email' 
    },
    // Column for the tenant's phone number.
    { 
      accessorKey: 'phoneNumber', 
      header: 'Phone Number' 
    },
    // Column for the assigned room, which displays a badge.
    { 
      accessorKey: 'roomId.roomNumber', 
      header: 'Room', 
      cell: ({ row }) => {
        // The 'any' cast here is a safe way to access populated data from Mongoose.
        const room = row.original.roomId as any;
        return room ? 
          <Badge variant="outline">{room.roomNumber}</Badge> : 
          <Badge variant="destructive">Unassigned</Badge>;
      }
    },
    // Column for the date the tenant joined, formatted for readability.
    { 
      accessorKey: 'createdAt', 
      header: 'Joined On', 
      cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleDateString('en-CA') 
    },
    // Column for actions, containing a dropdown menu.
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
                        <DropdownMenuItem onClick={() => onAssignRoom(tenant)}>
                          Assign Room
                        </DropdownMenuItem>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600 hover:!text-red-600 hover:!bg-red-50" 
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
