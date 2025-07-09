'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCard } from '@/components/ui/AlertCard';
import { AlertStatus } from '@prisma/client';
import { formatDistanceToNow } from 'date-fns';

interface Alert {
  id: string;
  subject: string;
  from: string;
  receivedAt: string;
  acknowledgedAt?: string | null;
  status: AlertStatus;
  voicemailUrl?: string | null;
  type: 'alert';
}

interface EmailAlert {
  id: string;
  subject: string;
  from: string;
  fromName: string;
  preview: string;
  receivedAt: string;
  isRead: boolean;
  type: 'email';
}

type AlertItem = Alert | EmailAlert;

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

  // Fetch recent voicemail emails
  const { data: emailsData, refetch: refetchEmails } = useQuery({
    queryKey: ['recent-emails'],
    queryFn: async () => {
      const response = await fetch('/api/emails/recent');
      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }
      return response.json();
    },
    refetchInterval: 30000,
  });

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([refetchAlerts(), refetchEmails()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh
  }));

  // Combine and sort alerts and emails
  const combineAlertsAndEmails = (): AlertItem[] => {
    const alerts: Alert[] = (alertsData?.alerts || []).map((alert: any) => ({
      ...alert,
      type: 'alert' as const,
    }));

    const emails: EmailAlert[] = (emailsData?.emails || []).map((email: any) => ({
      ...email,
      type: 'email' as const,
    }));

    // Convert emails to alert-like objects for unified display
    const emailAlerts: AlertItem[] = emails.map((email): AlertItem => ({
      id: email.id,
      subject: email.subject,
      from: email.fromName || email.from,
      receivedAt: email.receivedAt,
      acknowledgedAt: email.isRead ? email.receivedAt : null,
      status: email.isRead ? AlertStatus.ACKNOWLEDGED : AlertStatus.PENDING,
      voicemailUrl: null,
      type: 'email',
      ...email,
    }));

    // Combine and sort by received time
    const combined = [...alerts, ...emailAlerts];
    return combined.sort((a, b) => 
      new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );
  };

  const handleAcknowledge = async (item: AlertItem) => {
    if (item.type === 'alert') {
      // Handle alert acknowledgment (existing logic)
      // The AlertCard component will handle this
    } else if (item.type === 'email') {
      // Handle email acknowledgment by marking as read
      try {
        const response = await fetch(`/api/emails/${item.id}/mark-read`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error('Failed to mark email as read');
        }
        
        // Refresh the data to show updated status
        await refresh();
      } catch (error) {
        console.error('Error marking email as read:', error);
      }
    }
  };

  const handleStatusChange = () => {
    refresh();
  };

  const alerts = combineAlertsAndEmails();

  // Filter by status if specified
  const filteredAlerts = status 
    ? alerts.filter(alert => alert.status === status)
    : alerts;

  if (loading && !alertsData && !emailsData) {
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
      {filteredAlerts.map((item) => (
        <div key={`${item.type}-${item.id}`}>
          {item.type === 'alert' ? (
            <AlertCard
              alert={item as Alert}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <EmailAlertCard
              email={item as EmailAlert}
              onAcknowledge={() => handleAcknowledge(item)}
            />
          )}
        </div>
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

// Custom component for displaying email-based alerts
function EmailAlertCard({ email, onAcknowledge }: { 
  email: EmailAlert; 
  onAcknowledge: () => void; 
}) {
  const isUnread = !email.isRead;
  
  return (
    <div className={`bg-gray-900 rounded-lg p-6 border transition-all ${
      isUnread ? 'border-red-600 shadow-lg shadow-red-600/20' : 'border-gray-800'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">
            {email.subject}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="font-medium">{email.fromName || email.from}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true })}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isUnread && (
            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
              UNREAD
            </span>
          )}
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
            VOICEMAIL
          </span>
        </div>
      </div>
      
      <p className="text-gray-300 text-sm mb-4 line-clamp-2">
        {email.preview}
      </p>
      
      {isUnread && (
        <div className="flex gap-2">
          <button
            onClick={onAcknowledge}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Mark as Read
          </button>
        </div>
      )}
    </div>
  );
}

AlertList.displayName = 'AlertList';