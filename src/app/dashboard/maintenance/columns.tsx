'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { IMaintenanceRequest, IUser, IRoom } from '@/types';
import { Badge } from '@/components/ui/badge';
import NepaliDate from 'nepali-date-converter';

export type MaintenanceData = IMaintenanceRequest;

type Status = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

const getStatusBadge = (status: Status) => {
    const variants: { [key in Status]: string } = {
        COMPLETED: "bg-green-100 text-green-800",
        PENDING: "bg-yellow-100 text-yellow-800",
        IN_PROGRESS: "bg-blue-100 text-blue-800",
    };
    const formattedStatus = status.replace('_', ' ');
    return <Badge variant="outline" className={`capitalize ${variants[status]}`}>{formattedStatus}</Badge>;
};

export const getMaintenanceColumns = (
    onStatusChange: (request: MaintenanceData, status: Status) => void
): ColumnDef<MaintenanceData>[] => [
    {
        accessorKey: 'tenantId.fullName',
        header: 'Tenant',
        id: 'tenantName',
        cell: ({ row }) => (row.original.tenantId as unknown as IUser)?.fullName || 'N/A',
    },
    {
        accessorKey: 'roomId.roomNumber',
        header: 'Room',
        cell: ({ row }) => (row.original.roomId as unknown as IRoom)?.roomNumber || 'N/A',
    },
    {
        accessorKey: 'issue',
        header: 'Issue',
    },
    {
        accessorKey: 'createdAt',
        header: 'Submitted On',
        cell: ({ row }) => new NepaliDate(row.getValue('createdAt')).format('YYYY-MM-DD'),
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => getStatusBadge(row.getValue('status')),
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const request = row.original;
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {request.status !== 'IN_PROGRESS' && (
                                <DropdownMenuItem onClick={() => onStatusChange(request, 'IN_PROGRESS')}>
                                    Mark as In Progress
                                </DropdownMenuItem>
                            )}
                            {request.status !== 'COMPLETED' && (
                                <DropdownMenuItem onClick={() => onStatusChange(request, 'COMPLETED')}>
                                    Mark as Completed
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenuPortal>
                </DropdownMenu>
            );
        },
    },
];