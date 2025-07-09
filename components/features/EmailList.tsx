'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

interface Email {
  id: string;
  subject: string;
  from: string;
  fromName: string;
  preview: string;
  receivedAt: string;
  isRead: boolean;
}

export function EmailList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['recent-emails'],
    queryFn: async () => {
      const response = await fetch('/api/emails/recent');
      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-900 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-800 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-red-400">
        <p className="font-semibold mb-1">Error loading emails</p>
        <p className="text-sm">Please check your connection and try again.</p>
      </div>
    );
  }

  const emails: Email[] = data?.emails || [];

  if (emails.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-gray-400 text-center">
        <p>No recent emails found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {emails.map((email) => (
        <div
          key={email.id}
          className={`bg-gray-900 rounded-lg p-6 border ${
            email.isRead ? 'border-gray-800' : 'border-red-600'
          } transition-all hover:border-gray-600`}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-white truncate flex-1 mr-4">
              {email.subject}
            </h3>
            {!email.isRead && (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                UNREAD
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <span className="font-medium">{email.fromName || email.from}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true })}</span>
          </div>
          
          <p className="text-gray-300 text-sm line-clamp-2">
            {email.preview}
          </p>
        </div>
      ))}
    </div>
  );
}