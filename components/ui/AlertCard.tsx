'use client';

import { StatusBadge } from './StatusBadge';
import { TimeDisplay } from './TimeDisplay';
import { AcknowledgeButton } from './AcknowledgeButton';
import { AlertStatus } from '@prisma/client';

interface AlertCardProps {
  alert: {
    id: string;
    subject: string;
    from: string;
    receivedAt: Date | string;
    acknowledgedAt?: Date | string | null;
    status: AlertStatus;
    voicemailUrl?: string | null;
  };
  onStatusChange?: () => void;
}

export function AlertCard({ alert, onStatusChange }: AlertCardProps) {
  const handlePlayVoicemail = () => {
    if (alert.voicemailUrl) {
      // In a real app, this would open a voicemail player
      window.open(alert.voicemailUrl, '_blank');
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            {alert.subject}
          </h3>
          <p className="text-gray-400 text-sm">
            From: {alert.from}
          </p>
        </div>
        <StatusBadge status={alert.status} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <TimeDisplay date={alert.receivedAt} />
        {alert.acknowledgedAt && (
          <span className="text-green-500 text-sm">
            Acknowledged: <TimeDisplay date={alert.acknowledgedAt} showRelative={false} />
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {alert.voicemailUrl && (
          <button
            onClick={handlePlayVoicemail}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Play Voicemail
          </button>
        )}
        <AcknowledgeButton
          alertId={alert.id}
          status={alert.status}
          onAcknowledge={onStatusChange}
        />
      </div>
    </div>
  );
}