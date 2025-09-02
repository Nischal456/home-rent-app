'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CalendarIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { IExpense } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Define the shape of the form's state
interface FormState {
  type: 'INCOME' | 'EXPENSE';
  description: string;
  amount: string; // Amount is a string to match the input field
  category: 'MAINTENANCE' | 'SALARY' | 'UTILITIES' | 'RENT_INCOME' | 'OTHER';
  date: Date;
}

export function AddExpenseForm({ expense, onSuccess }: { expense?: IExpense; onSuccess: () => void; }) {
  // Use simple useState for each field, removing the complexity of react-hook-form
  const [formState, setFormState] = useState<FormState>({
    type: expense?.type || 'EXPENSE',
    description: expense?.description || '',
    amount: expense?.amount ? String(expense.amount) : '',
    category: expense?.category || 'MAINTENANCE',
    date: expense?.date ? new Date(expense.date) : new Date(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // Update state when editing a different expense
  useEffect(() => {
    if (expense) {
      setFormState({
        type: expense.type,
        description: expense.description,
        amount: String(expense.amount),
        category: expense.category,
        date: new Date(expense.date),
      });
    } else {
        // Reset form when adding a new record after editing
        setFormState({
            type: 'EXPENSE',
            description: '',
            amount: '',
            category: 'MAINTENANCE',
            date: new Date(),
        });
    }
  }, [expense]);

  // A simple, manual validation function
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!formState.description || formState.description.length < 3) {
      newErrors.description = 'Description must be at least 3 characters.';
    }
    const amountNum = parseFloat(formState.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Please enter a valid positive amount.';
    }
    if (!formState.date) {
      newErrors.date = 'Please select a date.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form.');
      return;
    }
    
    setIsSubmitting(true);
    
    const finalData = {
      ...formState,
      amount: parseFloat(formState.amount), // Convert amount to number before sending
    };

    const apiEndpoint = expense ? `/api/expenses/${expense._id}` : '/api/expenses';
    const method = expense ? 'PATCH' : 'POST';

    const promise = fetch(apiEndpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalData),
    }).then(res => res.json().then(data => {
      if (!res.ok) throw new Error(data.message || 'An error occurred.');
      return data;
    }));

    toast.promise(promise, {
      loading: expense ? 'Updating record...' : 'Adding record...',
      success: `Record ${expense ? 'updated' : 'added'} successfully!`,
      error: (err) => err.message,
    });
    
    try {
      await promise;
      onSuccess();
    } catch (error) {
      // Errors are already handled by the toast.
    } finally {
        setIsSubmitting(false);
    }
  };

  // Generic handler to update form state
  const handleChange = (field: keyof FormState, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    // Clear error for the field being edited
    if (errors[field]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Record Type</Label>
        <RadioGroup value={formState.type} onValueChange={(value: 'INCOME' | 'EXPENSE') => handleChange('type', value)} className="flex space-x-4">
          <div className="flex items-center space-x-2"><RadioGroupItem value="EXPENSE" id="r1" /><Label htmlFor="r1" className="font-normal">Expense</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="INCOME" id="r2" /><Label htmlFor="r2" className="font-normal">Income</Label></div>
        </RadioGroup>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" placeholder="e.g., Plumber for Room 101" value={formState.description} onChange={(e) => handleChange('description', e.target.value)} />
        {errors.description && <p className="text-sm font-medium text-destructive">{errors.description}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount (Rs)</Label>
        <Input id="amount" type="number" step="any" placeholder="e.g., 1500" value={formState.amount} onChange={(e) => handleChange('amount', e.target.value)} />
        {errors.amount && <p className="text-sm font-medium text-destructive">{errors.amount}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={formState.category} onValueChange={(value: FormState['category']) => handleChange('category', value)}>
            <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="RENT_INCOME">Rent Income</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              <SelectItem value="SALARY">Salary</SelectItem>
              <SelectItem value="UTILITIES">Utilities</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formState.date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formState.date ? format(formState.date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={formState.date} onSelect={(date) => handleChange('date', date)} initialFocus />
            </PopoverContent>
          </Popover>
          {errors.date && <p className="text-sm font-medium text-destructive">{errors.date}</p>}
        </div>
      </div>
      
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {expense ? 'Save Changes' : 'Add Record'}
      </Button>
    </form>
  );
}