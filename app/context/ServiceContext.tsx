// app/context/ServiceContext.tsx
"use client";
import { createContext, useContext, useState, ReactNode } from 'react';

interface ServiceContextType {
  serviceCount: number;
  setServiceCount: (count: number) => void;
  refreshServiceCount: () => Promise<void>;
  incrementServiceCount: () => void;  // ✅ Add this
  decrementServiceCount: () => void;  // ✅ Add this
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export function ServiceProvider({ children }: { children: ReactNode }) {
  const [serviceCount, setServiceCount] = useState<number>(0);

  const refreshServiceCount = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const salonResponse = await fetch('/api/auth/business/salons/onboarding', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (salonResponse.ok) {
        const salonData = await salonResponse.json();
        const salonId = salonData.salonId || salonData.id;
        
        if (salonId) {
          const servicesResponse = await fetch(`/api/auth/services?salonId=${salonId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          
          if (servicesResponse.ok) {
            const servicesData = await servicesResponse.json();
            const serviceList = Array.isArray(servicesData) ? servicesData : servicesData.data || [];
            setServiceCount(serviceList.length);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing service count:', error);
    }
  };

  const incrementServiceCount = () => {
    setServiceCount(prev => prev + 1);
  };

  const decrementServiceCount = () => {
    setServiceCount(prev => Math.max(0, prev - 1));
  };

  return (
    <ServiceContext.Provider value={{ 
      serviceCount, 
      setServiceCount, 
      refreshServiceCount,
      incrementServiceCount,
      decrementServiceCount
    }}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useServiceContext() {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error('useServiceContext must be used within a ServiceProvider');
  }
  return context;
}