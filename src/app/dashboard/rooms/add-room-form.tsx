'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

// ✅ FIX 1: Change how 'rentAmount' is validated
const formSchema = z.object({
  roomNumber: z.string().min(2, 'Room name must be at least 2 characters.'),
  floor: z.string().min(1, 'Floor is required.'),
  rentAmount: z.number().min(1, 'Rent amount must be greater than 0.'),
});

type RoomFormValues = z.infer<typeof formSchema>;

export function AddRoomForm({ onSuccess }: { onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      roomNumber: '', 
      floor: '', 
      rentAmount: undefined, // Use undefined for an empty, required number
    },
  });

  async function onSubmit(values: RoomFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to add room.');
      toast.success('Room added successfully!');
      form.reset();
      onSuccess();
    } catch (error) {
      // ✅ FIX 3: Safely handle the error type
      let errorMessage = "An unknown error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="roomNumber" render={({ field }) => (
          <FormItem><FormLabel>Room Name / Number</FormLabel><FormControl><Input placeholder="e.g., A1 Dairy Shop" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="floor" render={({ field }) => (
          <FormItem><FormLabel>Floor</FormLabel><FormControl><Input placeholder="e.g., Ground Floor" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="rentAmount" render={({ field }) => (
          <FormItem>
            <FormLabel>Monthly Rent (Rs)</FormLabel>
            <FormControl>
              {/* ✅ FIX 2: Explicitly pass the value as a number */}
              <Input 
                type="number" 
                placeholder="25000"
                {...field}
                onChange={event => field.onChange(event.target.value === '' ? undefined : Number(event.target.value))}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Room</Button>
      </form>
    </Form>
  );
}