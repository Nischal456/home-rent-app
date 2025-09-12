'use client';

import { useState, useCallback, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from 'usehooks-ts';
import { toast } from 'react-hot-toast';

// --- UI Components & Icons ---
import { columns, RoomData } from './columns';
import { DataTable } from '../tenants/data-table';
import { AddRoomForm } from './add-room-form';
import { Loader2, AlertCircle, PlusCircle, Search, BedDouble, MoreHorizontal, User, DoorOpen, Banknote, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch rooms.');
    return res.json();
});

// --- Reusable Sub-Components ---

const RoomCard = ({ room, onEdit, onDelete }: { room: RoomData, onEdit: (room: RoomData) => void, onDelete: (room: RoomData) => void }) => (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <Card className="overflow-hidden shadow-md transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between bg-muted/30 p-4">
                <div>
                    <CardTitle className="text-xl font-bold">{room.roomNumber}</CardTitle>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground"><Banknote size={14}/> Rs {room.rentAmount.toLocaleString()}/month</p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit(room)} disabled><Edit className="mr-2 h-4 w-4" />Edit Room (soon)</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => onDelete(room)} disabled><Trash2 className="mr-2 h-4 w-4" />Delete Room (soon)</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="p-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Status</p>
                    {/* ✅ FIX: Check for tenantId to determine occupancy */}
                    {room.tenantId ? (
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"><User className="mr-1.5 h-3 w-3" />Occupied</Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200"><DoorOpen className="mr-1.5 h-3 w-3" />Vacant</Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    </motion.div>
);

const RoomsPageSkeleton = () => (
    <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg sm:hidden lg:block" />
            <Skeleton className="h-32 rounded-lg hidden sm:block lg:block" />
            <Skeleton className="h-32 rounded-lg hidden sm:block lg:block" />
        </div>
    </div>
);

// --- Main Page Component ---
export default function RoomsPage() {
    const isMobile = useMediaQuery("(max-width: 768px)");
    const { mutate } = useSWRConfig();
    const apiUrl = '/api/rooms';

    const { data: apiResponse, error, isLoading } = useSWR(apiUrl, fetcher);
    const rooms: RoomData[] = apiResponse?.data ?? [];
    
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSuccess = useCallback(() => {
        setAddDialogOpen(false);
        mutate(apiUrl);
        toast.success("Room added successfully!");
    }, [mutate, apiUrl]);

    const filteredRooms = useMemo(() => {
        if (!searchQuery) return rooms;
        return rooms.filter(room =>
            room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [rooms, searchQuery]);
    
    const renderContent = () => {
        if (isLoading) {
            return <RoomsPageSkeleton />;
        }
        if (error) {
            return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error.message}</AlertDescription></Alert>;
        }
        if (rooms.length === 0) {
            return (
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <BedDouble className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Rooms Found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Get started by adding your first room.</p>
                    <div className="mt-6">
                        <Button onClick={() => setAddDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add First Room</Button>
                    </div>
                </div>
            );
        }
        return isMobile ? (
            <div className="space-y-4">
                <AnimatePresence>
                    {filteredRooms.map((room) => (
                        <RoomCard 
                            key={room._id.toString()} 
                            room={room} 
                            // ✅ FIX: Changed toast.info to the correct toast() function
                            onEdit={() => toast("Edit functionality coming soon!")}
                            onDelete={() => toast("Delete functionality coming soon!")}
                        />
                    ))}
                </AnimatePresence>
            </div>
        ) : (
            <DataTable 
                columns={columns} 
                data={rooms}
                filterColumnId="roomNumber"
                filterPlaceholder="Filter by room number..."
            />
        );
    };

    return (
        <>
            <div className="container mx-auto py-10">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Room Management</h1>
                        <p className="text-muted-foreground">Add, view, and manage all rooms in your property.</p>
                    </div>
                    <Button onClick={() => setAddDialogOpen(true)} className="hidden md:inline-flex">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Room
                    </Button>
                </div>

                {isMobile && rooms.length > 0 && (
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="Search by room number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                    </div>
                )}

                {renderContent()}
            </div>

            {isMobile && (
                <Button onClick={() => setAddDialogOpen(true)} className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50 flex md:hidden">
                    <PlusCircle className="h-8 w-8" />
                    <span className="sr-only">Add New Room</span>
                </Button>
            )}

            <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New Room</DialogTitle>
                        <DialogDescription>Fill in the details for a new rentable space.</DialogDescription>
                    </DialogHeader>
                    <AddRoomForm onSuccess={handleSuccess} />
                </DialogContent>
            </Dialog>
        </>
    );
}