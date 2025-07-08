import { AlertStatus } from '@prisma/client';

interface StatusBadgeProps {
  status: AlertStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'PENDING':
        return 'bg-red-600 text-white animate-pulse';
      case 'ACKNOWLEDGED':
        return 'bg-green-600 text-white';
      case 'EXPIRED':
        return 'bg-gray-600 text-gray-300';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'ACKNOWLEDGED':
        return 'Acknowledged';
      case 'EXPIRED':
        return 'Expired';
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles()}`}
    >
      {getStatusText()}
    </span>
  );
}