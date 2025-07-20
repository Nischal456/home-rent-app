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
import { IUser, IRoom } from '@/types'; // ✅ FIX: Import IRoom

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
      accessorKey: 'roomId.roomNumber', 
      header: 'Room', 
      cell: ({ row }) => {
        // ✅ FIX: Use a safe, explicit cast to the expected populated type
        const room = row.original.roomId as unknown as IRoom;
        return room ? 
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