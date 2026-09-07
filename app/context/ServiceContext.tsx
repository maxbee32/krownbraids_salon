"use client";
import { createContext, useContext, useState, ReactNode } from 'react';

interface ServiceContextType {
  serviceCount: number;
  setServiceCount: (count: number) => void;
  refreshServiceCount: () => void;
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

  return (
    <ServiceContext.Provider value={{ serviceCount, setServiceCount, refreshServiceCount }}>
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