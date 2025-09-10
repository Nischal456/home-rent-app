'use client';

import { useState, useMemo, useCallback } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, Inbox, MailOpen, AlertCircle, MoreVertical, Trash2 } from 'lucide-react';
import { ISubmission } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMediaQuery } from 'usehooks-ts';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { DataTable } from '@/components/ui/data-table';
import { getColumns } from './columns';
import NepaliDate from 'nepali-date-converter';
import { Badge } from '@/components/ui/badge';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// The mobile card now includes a dropdown for actions like deleting
const SubmissionCard = ({ submission, onView, onDelete }: { submission: ISubmission, onView: () => void, onDelete: () => void }) => (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start space-x-4 p-4 rounded-lg border bg-card">
        <div className={`mt-1 p-2 rounded-full ${submission.status === 'UNREAD' ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
            {submission.status === 'UNREAD' ? <Inbox className="h-5 w-5" /> : <MailOpen className="h-5 w-5" />}
        </div>
        <div className="flex-1 space-y-1 cursor-pointer" onClick={onView}>
            <div className="flex justify-between items-center">
                <p className="text-sm font-semibold">{submission.subject}</p>
                {submission.status === 'UNREAD' && <Badge variant="destructive">New</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">From: {submission.name} ({submission.contact})</p>
            {/* Corrected date format with 12-hour time */}
            <p className="text-xs text-muted-foreground">{new NepaliDate(submission.createdAt).format('YYYY-MM-DD h:mm A')}</p>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>View Message</DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-red-500 focus:bg-red-100 focus:text-red-600 dark:focus:bg-red-900/80 dark:focus:text-red-400">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </motion.div>
);


export default function InboxPage() {
    const { data: response, error, isLoading, mutate } = useSWR('/api/submissions', fetcher);
    const submissions: ISubmission[] = response?.data?.submissions ?? [];
    const isMobile = useMediaQuery("(max-width: 768px)");

    const [selectedSubmission, setSelectedSubmission] = useState<ISubmission | null>(null);
    const [deletingSubmission, setDeletingSubmission] = useState<ISubmission | null>(null); // State for delete confirmation

    const handleViewSubmission = useCallback((submission: ISubmission) => {
        setSelectedSubmission(submission);
        if (submission.status === 'UNREAD') {
            fetch(`/api/submissions/${submission._id}`, { method: 'PATCH' })
                .then(res => res.json())
                .then(data => { if (data.success) mutate(); });
        }
    }, [mutate]);

    // Function to handle the delete API call with toast notifications
    const handleDelete = async () => {
        if (!deletingSubmission) return;

        const promise = fetch(`/api/submissions/${deletingSubmission._id}`, { method: 'DELETE' });

        toast.promise(promise, {
            loading: 'Deleting message...',
            success: 'Message deleted successfully!',
            error: 'Failed to delete message.',
        });

        try {
            const res = await promise;
            if (res.ok) {
                mutate(); // Re-fetch data to update the list
            }
        } catch (e) {
            // Error is handled by toast.promise
            console.error(e);
        } finally {
            setDeletingSubmission(null); // Close the confirmation dialog
        }
    };
    
    // Pass the delete handler to the columns definition
    const columns = useMemo(() => getColumns(handleViewSubmission, (submission) => setDeletingSubmission(submission)), [handleViewSubmission]);

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-72" />
                </div>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-56" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    if (error) return (
        <div className="p-8">
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Inbox</AlertTitle>
                <AlertDescription>Could not fetch messages. Please try refreshing the page.</AlertDescription>
            </Alert>
        </div>
    );


    return (
        <>
            <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedSubmission?.subject}</DialogTitle>
                        <DialogDescription>From: {selectedSubmission?.name} ({selectedSubmission?.contact}) on {selectedSubmission && new NepaliDate(selectedSubmission.createdAt).format('YYYY-MM-DD h:mm A')}</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 whitespace-pre-wrap bg-muted/50 p-4 rounded-md border text-sm max-h-[60vh] overflow-y-auto">{selectedSubmission?.message}</div>
                </DialogContent>
            </Dialog>
            
            {/* Confirmation dialog for deleting a message */}
            <AlertDialog open={!!deletingSubmission} onOpenChange={() => setDeletingSubmission(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the message regarding "{deletingSubmission?.subject}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="p-4 md:p-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Inbox</h1>
                    <p className="text-muted-foreground">Public inquiries, complaints, and problems.</p>
                </div>
                <Card>
                    <CardHeader><CardTitle>Incoming Messages</CardTitle></CardHeader>
                    <CardContent>
                        {isMobile ? (
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {submissions.map(submission => (
                                        <SubmissionCard 
                                            key={submission._id.toString()} 
                                            submission={submission} 
                                            onView={() => handleViewSubmission(submission)} 
                                            onDelete={() => setDeletingSubmission(submission)} 
                                        />
                                    ))}
                                </AnimatePresence>
                                {submissions.length === 0 && (
                                    <div className="text-center py-10 text-muted-foreground">
                                        <Inbox className="mx-auto h-12 w-12" />
                                        <p className="mt-4">Your inbox is empty.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <DataTable 
                                columns={columns} 
                                data={submissions}
                                filterColumnId="subject"
                                filterPlaceholder="Filter by subject..."
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}