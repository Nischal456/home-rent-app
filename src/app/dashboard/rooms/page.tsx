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
import { Loader2, AlertCircle, PlusCircle, Search, BedDouble, MoreHorizontal, User, DoorOpen, Banknote, Edit, Trash2, Home } from 'lucide-react';
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
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
        <Card className="relative overflow-hidden border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(11,40,99,0.08)] transition-all duration-500 rounded-[2.5rem] bg-white/70 backdrop-blur-xl group">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${room.tenantId ? 'from-orange-100/50' : 'from-green-100/50'} to-transparent opacity-60 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none -z-10`}></div>
            <CardHeader className="flex flex-row items-start justify-between p-6 pb-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[1.2rem] flex items-center justify-center shadow-inner bg-slate-50 text-[#0B2863]">
                        <BedDouble className="h-6 w-6" strokeWidth={2.5} />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-black tracking-tight text-slate-800">{room.roomNumber}</CardTitle>
                        <p className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mt-0.5 tracking-wide"><Banknote size={12}/> Rs {room.rentAmount.toLocaleString()}/mo</p>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-slate-100">
                        <DropdownMenuLabel className="text-xs uppercase tracking-widest font-bold text-slate-500">Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit(room)} disabled className="text-slate-600 font-medium cursor-pointer"><Edit className="mr-2 h-4 w-4" />Edit Room (soon)</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 font-bold focus:bg-red-50 focus:text-red-700 cursor-pointer" onClick={() => onDelete(room)} disabled><Trash2 className="mr-2 h-4 w-4" />Delete Room (soon)</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="p-6 pt-4">
                <div className="flex justify-between items-center bg-slate-50 p-3 px-4 rounded-2xl border border-slate-100/50">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status</p>
                    {room.tenantId ? (
                        <Badge className="bg-orange-100 text-orange-700 shadow-sm hover:bg-orange-200 uppercase tracking-widest text-[10px] px-2 py-0.5"><User className="mr-1 h-3 w-3" />Occupied</Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 shadow-sm border border-emerald-200/50 hover:bg-emerald-200 uppercase tracking-widest text-[10px] px-2 py-0.5"><DoorOpen className="mr-1 h-3 w-3" />Vacant</Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    </motion.div>
);

const RoomsPageSkeleton = () => (
    <div className="space-y-4 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-[180px] rounded-[2.5rem]" />
            <Skeleton className="h-[180px] rounded-[2.5rem]" />
            <Skeleton className="h-[180px] rounded-[2.5rem]" />
            <Skeleton className="h-[180px] rounded-[2.5rem] hidden sm:block" />
        </div>
    </div>
);

// --- Main Page Component ---
export default function RoomsPage() {
    const isMobile = useMediaQuery("(max-width: 768px)");
    const { mutate } = useSWRConfig();
    const apiUrl = '/api/rooms';

    const { data: apiResponse, error, isLoading } = useSWR(apiUrl, fetcher);
    // Explicitly handle mapping if it exists, otherwise empty array
    const rooms: RoomData[] = apiResponse?.data ?? [];
    
    // Derived state for quick stats
    const totalRooms = rooms.length;
    const occupiedCount = rooms.filter(r => r.tenantId).length;
    const vacantCount = totalRooms - occupiedCount;
    
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
        if (isLoading) return <RoomsPageSkeleton />;
        
        if (error) {
            return <Alert variant="destructive" className="bg-red-50 border border-red-200 mt-6"><AlertCircle className="h-4 w-4" /><AlertTitle>System Alert</AlertTitle><AlertDescription>Failed to fetch core architectural records. Please reload.</AlertDescription></Alert>;
        }
        if (rooms.length === 0) {
            return (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 px-4 mt-8 bg-white/60 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-sm">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner text-blue-500">
                        <BedDouble className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">No Chambers Built</h3>
                    <p className="mt-2 text-sm font-semibold text-slate-500 max-w-sm mx-auto">The tower layout is empty. Begin by mapping out the first rentable room.</p>
                    <div className="mt-8">
                        <Button onClick={() => setAddDialogOpen(true)} className="h-12 rounded-full px-8 bg-[#0B2863] hover:bg-blue-800 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-95"><PlusCircle className="mr-2 h-5 w-5" /> Construct Room</Button>
                    </div>
                </motion.div>
            );
        }
        return isMobile ? (
            <div className="space-y-4 pb-32">
                <AnimatePresence>
                    {filteredRooms.map((room) => (
                        <RoomCard 
                            key={room._id.toString()} 
                            room={room} 
                            onEdit={() => toast("Edit functionality coming soon!")}
                            onDelete={() => toast("Delete functionality coming soon!")}
                        />
                    ))}
                </AnimatePresence>
            </div>
        ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-1 bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2rem] shadow-sm overflow-hidden">
                <DataTable 
                    columns={columns} 
                    data={filteredRooms}
                    filterColumnId="roomNumber"
                    filterPlaceholder="Filter by room ID..."
                />
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 relative overflow-hidden selection:bg-[#0B2863]/20">
            {/* Ambient Background Shimmers */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-100/50 blur-[100px] pointer-events-none z-0"></div>
            <div className="absolute top-[40%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-emerald-50/50 blur-[120px] pointer-events-none z-0"></div>

            <div className="container mx-auto py-8 md:py-10 px-4 md:px-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">Room Nexus</h1>
                        <p className="text-sm md:text-base font-bold text-slate-500 uppercase tracking-widest mt-1">
                            {totalRooms} Total • {vacantCount} Vacant
                        </p>
                    </div>
                    <Button onClick={() => setAddDialogOpen(true)} className="hidden md:inline-flex h-12 bg-white text-[#0B2863] border border-slate-200/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-slate-50 transition-all font-bold rounded-full px-6 active:scale-95">
                        <PlusCircle className="mr-2 h-5 w-5 text-blue-500" /> New Chamber
                    </Button>
                </div>

                {/* Premium Search Bar for Mobile */}
                {isMobile && rooms.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <Input 
                            placeholder="Search directory..." 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            className="bg-white/80 backdrop-blur-sm border-slate-200 placeholder:text-slate-400 text-slate-800 font-bold h-14 pl-12 rounded-2xl shadow-sm focus-visible:ring-blue-100 focus-visible:border-blue-300"
                        />
                    </motion.div>
                )}

                {/* Desktop Premium Search Bar */}
                {!isMobile && rooms.length > 0 && (
                    <div className="relative max-w-sm mb-6">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <Input 
                            placeholder="Locate designated room..." 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            className="bg-white/60 backdrop-blur-sm border-white shadow-sm placeholder:text-slate-400 text-slate-800 font-bold pl-11 rounded-full focus-visible:ring-blue-100 focus-visible:border-blue-300"
                        />
                    </div>
                )}

                {renderContent()}
            </div>

            {/* Mobile Floating Action Button */}
            <Button 
                onClick={() => setAddDialogOpen(true)} 
                className="fixed bottom-[calc(env(safe-area-inset-bottom,40px)+4.5rem)] right-6 h-16 w-16 bg-[#0B2863] hover:bg-blue-800 text-white rounded-full shadow-[0_10px_30px_rgba(11,40,99,0.3)] hover:shadow-[0_15px_40px_rgba(11,40,99,0.4)] transition-all transform hover:-translate-y-1 active:scale-90 z-[60] flex items-center justify-center md:hidden"
            >
                <PlusCircle className="h-8 w-8" />
                <span className="sr-only">Construct Chamber</span>
            </Button>

            {/* Premium Add Modal Overlay styling relies on global dialog styling */}
            <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-0 overflow-hidden border-0 shadow-2xl">
                    <div className="p-8 pb-0">
                        <DialogHeader>
                            <div className="w-12 h-12 bg-blue-50 rounded-[1.2rem] flex items-center justify-center mb-4">
                                <Home className="h-6 w-6 text-blue-600" />
                            </div>
                            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">New Parameter</DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium">Log structural data into the central STG network.</DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-8 pt-6 bg-slate-50 border-t border-slate-100 mt-6">
                        <AddRoomForm onSuccess={handleSuccess} />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}