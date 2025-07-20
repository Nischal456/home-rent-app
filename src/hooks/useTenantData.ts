'use client';

import { useState, useEffect, useCallback } from 'react';
// AuthContext was removed, so useAuth is no longer available.
import { IUser, IRentBill, IUtilityBill, IMaintenanceRequest, IPayment } from '@/types';
import { toast } from 'react-hot-toast';

// This function is no longer used within this hook without a token
const authFetch = async (url: string, token: string, options: RequestInit = {}) => {
    const headers = { ...options.headers, 'Authorization': `Bearer ${token}` };
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `Request to ${url} failed.`);
    }
    return data;
};

export function useTenantData() {
  // Since useAuth was removed, the token is no longer available here.
  const token = null;

  const [user, setUser] = useState<IUser | null>(null);
  const [rentBills, setRentBills] = useState<IRentBill[]>([]);
  const [utilityBills, setUtilityBills] = useState<IUtilityBill[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<IMaintenanceRequest[]>([]);
  const [pendingPayment, setPendingPayment] = useState<IPayment | null>(null);
  // Default loading to false since we can't fetch data.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async (isInitialLoad = false) => {
    // This condition will always be true now, so this function will not do anything.
    if (!token) {
        if (isInitialLoad) setLoading(false);
        return;
    }

    if (isInitialLoad) setLoading(true);
    setError(null);

    try {
      const [userData, rentData, utilityData, maintData, pendingPaymentData] = await Promise.all([
        authFetch('/api/auth/me', token),
        authFetch('/api/my-bills/rent', token),
        authFetch('/api/my-bills/utility', token),
        authFetch('/api/my-maintenance', token),
        authFetch('/api/my-pending-payment', token),
      ]);

      if (userData.success) setUser(userData.user);
      if (rentData.success) setRentBills(rentData.data);
      if (utilityData.success) setUtilityBills(utilityData.data);
      if (maintData.success) setMaintenanceRequests(maintData.data);
      if (pendingPaymentData.success) setPendingPayment(pendingPaymentData.pendingPayment);

    } catch (err) {
      // ✅ FIX: Safely handle the error type
      let errorMessage = "An unknown error occurred.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error("Failed to fetch dashboard data:", errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, [token]);
  
  // These effects will not run because there is no token.
  useEffect(() => {
    if (token) {
      fetchAllData(true);
    } else {
      setLoading(false);
    }
  }, [token, fetchAllData]);
  
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchAllData(false);
    }, 30000); 

    return () => clearInterval(interval);
  }, [token, fetchAllData]);

  return { user, rentBills, utilityBills, maintenanceRequests, pendingPayment, loading, error, refreshData: fetchAllData };
}