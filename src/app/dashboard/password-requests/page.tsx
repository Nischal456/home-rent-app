'use client';

import { useState, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IPasswordResetRequest } from '@/models/PasswordResetRequest';
import { DataTable } from '@/components/ui/data-table';
import { getColumns } from './columns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PasswordRequestsPage() {
    const { data: response, error, isLoading, mutate } = useSWR('/api/admin/password-requests', fetcher);
    const requests: IPasswordResetRequest[] = response?.data ?? [];
    
    const [selectedRequest, setSelectedRequest] = useState<IPasswordResetRequest | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReset = async () => {
        if (!selectedRequest || !newPassword) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/admin/password-requests/${selectedRequest._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to reset password.');
            
            toast.success(data.message);
            mutate(); // Re-fetch the list of requests
            setSelectedRequest(null);
            setNewPassword('');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns = useMemo(() => getColumns(setSelectedRequest), []);

    if (isLoading) {
        return (
            <div className="p-8 space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (error || !response.success) {
      return (
          <div className="p-8">
              <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>Failed to load password requests.</AlertDescription></Alert>
          </div>
      );
    }

    return (
        <>
            {/* --- Reset Password Dialog --- */}
            <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            You are resetting the password for <span className="font-semibold">{(selectedRequest?.userId as any)?.fullName}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input 
                            id="new-password" 
                            type="text" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter a strong temporary password"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
                        <Button onClick={handleReset} disabled={isSubmitting || newPassword.length < 6}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Reset
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- Main Page Content --- */}
            <div className="p-4 md:p-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Password Reset Requests</h1>
                    <p className="text-muted-foreground">Manage pending password reset requests from tenants.</p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable 
                            columns={columns} 
                            data={requests}
                            filterColumnId="name"
                            filterPlaceholder="Filter by name..."
                        />
                    </CardContent>
                </Card>
            </div>
        </>
    );
}