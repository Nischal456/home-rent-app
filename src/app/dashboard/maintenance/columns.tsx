'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, ArrowUpDown, User, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { IMaintenanceRequest, IUser, IRoom } from '@/types'
import Link from 'next/link'

export type MaintenanceData = IMaintenanceRequest;
type Status = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

const getStatusBadge = (status: Status) => {
    switch (status) {
        case 'PENDING': return <Badge variant="destructive">Pending</Badge>;
        case 'IN_PROGRESS': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">In Progress</Badge>;
        case 'COMPLETED': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>;
        default: return <Badge variant="secondary">{status}</Badge>;
    }
};

export const getMaintenanceColumns = (
    onStatusChange: (request: MaintenanceData, status: Status) => void,
    onViewDetails: (request: MaintenanceData) => void
): ColumnDef<MaintenanceData>[] => [
    {
        accessorKey: 'issue',
        header: 'Issue',
        cell: ({ row }) => (
            <button
                onClick={() => onViewDetails(row.original)}
                className="font-medium text-primary hover:underline text-left p-0 bg-transparent"
            >
                {row.getValue('issue')}
            </button>
        )
    },
    {
        accessorKey: 'tenantId.fullName',
        // ✅ NEW: Header is now responsive
        header: () => <div className="hidden md:table-cell">Tenant</div>,
        id: 'tenantName',
        cell: ({ row }) => {
            const tenant = row.original.tenantId as IUser;
            return (
                // ✅ NEW: Cell is now responsive
                <div className="hidden md:flex items-center gap-2">
                    <User size={14} className="text-muted-foreground"/>
                    <Link href={`/dashboard/tenants/${tenant._id.toString()}`} className="hover:underline">
                        {tenant.fullName}
                    </Link>
                </div>
            );
        },
    },
    {
        accessorKey: 'roomId.roomNumber',
        // ✅ NEW: Header is now responsive
        header: () => <div className="hidden lg:table-cell">Room</div>,
        cell: ({ row }) => {
            const room = row.original.roomId as IRoom;
            return (
                 // ✅ NEW: Cell is now responsive
                 <div className="hidden lg:flex items-center gap-2">
                    <Home size={14} className="text-muted-foreground"/>
                    <span>{room.roomNumber}</span>
                </div>
            );
        }
    },
    {
        accessorKey: 'createdAt',
        // ✅ NEW: Header is now responsive
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="hidden lg:flex p-0 hover:bg-transparent">
                Reported On <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        // ✅ NEW: Cell is now responsive
        cell: ({ row }) => <div className="hidden lg:table-cell">{new Date(row.getValue('createdAt')).toLocaleDateString()}</div>
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => getStatusBadge(row.getValue('status'))
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const request = row.original;
            return (
                <div className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onStatusChange(request, 'PENDING')} disabled={request.status === 'PENDING'}>Set as Pending</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange(request, 'IN_PROGRESS')} disabled={request.status === 'IN_PROGRESS'}>Set as In Progress</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange(request, 'COMPLETED')} disabled={request.status === 'COMPLETED'}>Set as Completed</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    },
];