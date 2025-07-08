'use client';

import { useState } from 'react';
import { AlertStatus } from '@prisma/client';

interface AcknowledgeButtonProps {
  alertId: string;
  status: AlertStatus;
  onAcknowledge?: () => void;
}

export function AcknowledgeButton({ alertId, status, onAcknowledge }: AcknowledgeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (status !== 'PENDING') {
    return null;
  }

  const handleAcknowledge = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });

      if (response.ok) {
        onAcknowledge?.();
      } else {
        console.error('Failed to acknowledge alert');
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleAcknowledge}
      disabled={isLoading}
      className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isLoading ? 'Acknowledging...' : 'Acknowledge'}
    </button>
  );
}