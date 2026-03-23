import { useState, useEffect, useCallback } from 'react';
import type { StoredRequest } from '../../../shared/types.js';

export function useRequests() {
  const [requests, setRequests] = useState<StoredRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/requests');
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setRequests(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    
    // Simple polling for Observe mode (updates every 2 seconds)
    const interval = setInterval(fetchRequests, 2000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  return { requests, isLoading, error, refreshRequests: fetchRequests };
}
