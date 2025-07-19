'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { IUser, IRentBill, IUtilityBill, IMaintenanceRequest, IPayment } from '@/types';
import { toast } from 'react-hot-toast';

// A robust fetch utility that automatically adds the auth token.
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
  const { token } = useAuth();
  const [user, setUser] = useState<IUser | null>(null);
  const [rentBills, setRentBills] = useState<IRentBill[]>([]);
  const [utilityBills, setUtilityBills] = useState<IUtilityBill[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<IMaintenanceRequest[]>([]);
  const [pendingPayment, setPendingPayment] = useState<IPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async (isInitialLoad = false) => {
    if (!token) {
        if (isInitialLoad) setLoading(false);
        return; // Do not fetch if there's no token.
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

    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, [token]);

  // Fetch data only when the token becomes available.
  useEffect(() => {
    if (token) {
      fetchAllData(true);
    } else {
      // If there's no token on initial check, stop loading.
      setLoading(false);
    }
  }, [token, fetchAllData]);
  
  // Set up an interval to automatically refresh the data.
  useEffect(() => {
    if (!token) return; // Don't start polling without a token.
    const interval = setInterval(() => {
      fetchAllData(false); // Fetch data without showing the main loader
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [token, fetchAllData]);

  return { user, rentBills, utilityBills, maintenanceRequests, pendingPayment, loading, error, refreshData: fetchAllData };
}
