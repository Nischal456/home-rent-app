'use client';

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { BellRing } from "lucide-react";
import { Button } from "./ui/button";

export function PushPrompt() {
    const { isSupported, isSubscribed, permissionState, subscribeToPush } = usePushNotifications();

    // If granted, hide it completely. If denied or default, we show it so the user can interact.
    if (!isSupported || isSubscribed || permissionState === 'granted') {
        return null;
    }

    return (
        <Button 
            onClick={subscribeToPush}
            variant="outline" 
            className="flex bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 border-emerald-200 rounded-full font-bold text-xs h-8 px-2 sm:px-3 shadow-sm transform-gpu transition-all active:scale-95 animate-pulse"
        >
            <BellRing className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Enable Push</span>
        </Button>
    );
}
