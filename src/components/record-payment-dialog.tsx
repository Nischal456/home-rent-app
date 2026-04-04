import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface RecordPaymentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    billId: string;
    targetUrl: string; // e.g. /api/rent-bills/[id]/pay
    totalAmount: number;
    remainingAmount: number;
}

export function RecordPaymentDialog({ isOpen, onClose, onSuccess, billId, targetUrl, totalAmount, remainingAmount }: RecordPaymentDialogProps) {
    const [amount, setAmount] = useState<string>(remainingAmount.toString());
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset when opened
    useState(() => {
        if (isOpen) {
            setAmount(remainingAmount.toString());
            setRemarks('');
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const payAmount = parseFloat(amount);
        if (isNaN(payAmount) || payAmount <= 0) {
            toast.error("Please enter a valid amount greater than 0");
            return;
        }

        if (payAmount > remainingAmount) {
            toast.error(`Amount cannot exceed the remaining balance of Rs ${remainingAmount}`);
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: payAmount, remarks })
            });
            const data = await res.json();
            
            if (data.success) {
                toast.success("Payment recorded successfully!");
                onSuccess();
                onClose();
            } else {
                toast.error(data.message || "Failed to record payment");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error while recording payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                        Enter the payment details below. You can accept partial or full payments.
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="bg-muted p-4 rounded-lg flex justify-between items-center mb-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Remaining Balance</p>
                            <p className="text-xl font-bold text-primary">Rs {remainingAmount.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-muted-foreground">Total Bill</p>
                            <p className="text-md font-semibold text-gray-700">Rs {totalAmount.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Payment Amount (Rs)</Label>
                        <Input 
                            id="amount" 
                            type="number" 
                            min="1" 
                            max={remainingAmount}
                            step="0.01"
                            value={amount} 
                            onChange={(e) => setAmount(e.target.value)} 
                            required 
                            className="text-lg"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="remarks">Remarks (Optional)</Label>
                        <Textarea 
                            id="remarks" 
                            placeholder="e.g. Paid in cash, Bank transfer ref #12345" 
                            value={remarks} 
                            onChange={(e) => setRemarks(e.target.value)} 
                        />
                    </div>
                    
                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Recording...</> : 'Record Payment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
