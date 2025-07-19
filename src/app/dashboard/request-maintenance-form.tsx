'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

// --- THE CORE FIX IS HERE ---
// The `.min(20)` validation has been removed from the description.
const formSchema = z.object({
  issue: z.string().min(5, 'Please provide a brief title for the issue.'),
  description: z.string().min(1, 'Please describe the issue.'), // Now only requires 1 character
});
// --- END OF FIX ---

type MaintenanceFormValues = z.infer<typeof formSchema>;

export function RequestMaintenanceForm({ onSuccess }: { onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { issue: '', description: '' },
  });

  async function onSubmit(values: MaintenanceFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to submit request.');
      toast.success('Maintenance request submitted!');
      form.reset();
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
        <FormField control={form.control} name="issue" render={({ field }) => (
          <FormItem><FormLabel>Issue Title</FormLabel><FormControl><Input placeholder="e.g., Leaky Faucet in Kitchen" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Please describe the problem in detail..." className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Request</Button>
      </form>
    </Form>
  );
}