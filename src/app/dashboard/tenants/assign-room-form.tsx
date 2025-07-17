'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { IRoom } from '@/models/Room';
import { Tenant } from './columns';

const formSchema = z.object({
  roomId: z.string().min(1, 'Please select a room.'),
});

type AssignRoomFormValues = z.infer<typeof formSchema>;

interface AssignRoomFormProps {
  tenant: Tenant;
  onSuccess: () => void;
}

export function AssignRoomForm({ tenant, onSuccess }: AssignRoomFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [vacantRooms, setVacantRooms] = useState<IRoom[]>([]);
  const form = useForm<AssignRoomFormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    const fetchVacantRooms = async () => {
      const res = await fetch('/api/rooms?status=vacant');
      const data = await res.json();
      if (data.success) setVacantRooms(data.data);
    };
    fetchVacantRooms();
  }, []);

  async function onSubmit(values: AssignRoomFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tenants/${tenant._id}/assign-room`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: values.roomId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to assign room.');
      toast.success('Room assigned successfully!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="text-sm">
          Assigning room to: <span className="font-semibold">{tenant.fullName}</span>
        </div>
        <FormField control={form.control} name="roomId" render={({ field }) => (
          <FormItem>
            <FormLabel>Vacant Rooms</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select a vacant room" /></SelectTrigger></FormControl>
              <SelectContent>
                {vacantRooms.length > 0 ? vacantRooms.map(room => (
                  <SelectItem key={room._id} value={room._id}>{room.roomNumber} ({room.floor})</SelectItem>
                )) : <p className="p-2 text-sm text-muted-foreground">No vacant rooms available.</p>}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Assign Room</Button>
      </form>
    </Form>
  );
}