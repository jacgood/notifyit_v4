'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  status?: AlertStatus;
}

export interface AlertListRef {
  refresh: () => void;
}

export const AlertList = forwardRef<AlertListRef, AlertListProps>(({ status }, ref) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch alerts from database
  const { data: alertsData, refetch: refetchAlerts } = useQuery({
    queryKey: ['alerts', status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) {
        params.append('status', status);
      }
      const response = await fetch(`/api/alerts?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      return response.json();
    },
    refetchInterval: 30000,
  });

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await refetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh
  }));

  const handleStatusChange = () => {
    refresh();
  };

  const alerts = alertsData?.alerts || [];

  // Filter by status if specified
  const filteredAlerts = status 
    ? alerts.filter((alert: Alert) => alert.status === status)
    : alerts;

  if (loading && !alertsData) {
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
          onClick={refresh}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (filteredAlerts.length === 0) {
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
          onClick={refresh}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredAlerts.map((alert: Alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onStatusChange={handleStatusChange}
        />
      ))}
      
      <div className="text-center pt-4">
        <button
          onClick={refresh}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
});

AlertList.displayName = 'AlertList';