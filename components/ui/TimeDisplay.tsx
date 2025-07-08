'use client';

import { useEffect, useState } from 'react';

interface TimeDisplayProps {
  date: Date | string;
  showRelative?: boolean;
}

export function TimeDisplay({ date, showRelative = true }: TimeDisplayProps) {
  const [relativeTime, setRelativeTime] = useState('');
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  useEffect(() => {
    const updateRelativeTime = () => {
      const now = new Date();
      const diff = now.getTime() - dateObj.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (seconds < 60) {
        setRelativeTime('just now');
      } else if (minutes < 60) {
        setRelativeTime(`${minutes}m ago`);
      } else if (hours < 24) {
        setRelativeTime(`${hours}h ago`);
      } else {
        setRelativeTime(`${days}d ago`);
      }
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [dateObj]);

  const formattedDate = dateObj.toLocaleDateString();
  const formattedTime = dateObj.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  if (!showRelative) {
    return (
      <span className="text-gray-400 text-sm">
        {formattedDate} {formattedTime}
      </span>
    );
  }

  return (
    <span className="text-gray-400 text-sm" title={`${formattedDate} ${formattedTime}`}>
      {relativeTime}
    </span>
  );
}