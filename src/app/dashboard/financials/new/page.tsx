'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { AddExpenseForm } from '@/components/dashboard/AddExpenseForm'; // This form component will be used here
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NewFinancialRecordPage() {
    const router = useRouter();

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto p-4 md:p-8"
        >
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0 rounded-full" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Add New Financial Record</h1>
                    <p className="text-muted-foreground">Log a new income or expense transaction.</p>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Record Details</CardTitle>
                    <CardDescription>Please fill in all the required fields below.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* The onSuccess callback will now navigate the user back to the main financials page */}
                    <AddExpenseForm onSuccess={() => router.push('/dashboard/financials')} />
                </CardContent>
            </Card>
        </motion.div>
    );
}