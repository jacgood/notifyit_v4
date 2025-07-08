'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { AlertCard } from '@/components/ui/AlertCard';
import { AlertStatus } from '@prisma/client';

interface Alert {
  id: string;
  subject: string;
  from: string;
  receivedAt: string;
  acknowledgedAt?: string | null;
  status: AlertStatus;
  voicemailUrl?: string | null;
}

interface AlertListProps {
  initialAlerts?: Alert[];
  status?: AlertStatus;
}

export interface AlertListRef {
  refresh: () => void;
}

export const AlertList = forwardRef<AlertListRef, AlertListProps>(({ initialAlerts = [], status }, ref) => {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, [status]);

  useImperativeHandle(ref, () => ({
    refresh: fetchAlerts
  }));

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (status) {
        params.append('status', status);
      }
      
      const response = await fetch(`/api/alerts?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      
      const data = await response.json();
      setAlerts(data.alerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = () => {
    // Refresh alerts when status changes
    fetchAlerts();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchAlerts}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">
          {status === 'PENDING' 
            ? 'No pending alerts' 
            : status === 'ACKNOWLEDGED' 
            ? 'No acknowledged alerts' 
            : 'No alerts found'}
        </p>
        <button
          onClick={fetchAlerts}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onStatusChange={handleStatusChange}
        />
      ))}
      
      <div className="text-center pt-4">
        <button
          onClick={fetchAlerts}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Refresh Alerts
        </button>
      </div>
    </div>
  );
});

AlertList.displayName = 'AlertList';