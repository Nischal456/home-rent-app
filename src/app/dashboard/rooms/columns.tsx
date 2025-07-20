'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { IRoom } from '@/types'; // ✅ FIX: Corrected the import path

export type RoomData = IRoom & {
  tenantId?: { fullName: string };
};

export const columns: ColumnDef<RoomData>[] = [
  { accessorKey: 'roomNumber', header: 'Room Name / Number' },
  { accessorKey: 'floor', header: 'Floor' },
  { accessorKey: 'rentAmount', header: 'Rent (Rs)', cell: ({ row }) => row.original.rentAmount.toLocaleString('en-IN') },
  {
    accessorKey: 'tenantId',
    header: 'Status',
    cell: ({ row }) => {
      const isOccupied = !!row.original.tenantId;
      return isOccupied ? (
        <Badge className="bg-blue-500 hover:bg-blue-600">Occupied</Badge>
      ) : (
        <Badge variant="outline">Vacant</Badge>
      );
    },
  },
  {
    accessorKey: 'tenantId.fullName',
    header: 'Occupied By',
    cell: ({ row }) => row.original.tenantId?.fullName || '---',
  },
];