'use client';

import { useEffect, useState, useCallback } from 'react';
import { columns, RoomData } from './columns';
import { DataTable } from '../tenants/data-table';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddRoomForm } from './add-room-form';

export default function RoomsPage() {
  const [data, setData] = useState<RoomData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch('/api/rooms');
    const roomData = await res.json();
    if (roomData.success) setData(roomData.data);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const handleSuccess = () => {
    setIsDialogOpen(false);
    fetchRooms();
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Room Management</h1>
          <p className="text-muted-foreground">Add, view, and manage all rooms in your property.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button>Add New Room</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle>Add New Room</DialogTitle><DialogDescription>Fill in the details for a new rentable space.</DialogDescription></DialogHeader>
            <AddRoomForm onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <DataTable 
            columns={columns} 
            data={data}
            filterColumnId="roomNumber"
            filterPlaceholder="Filter by room name..."
        />
      )}
    </div>
  );
}
