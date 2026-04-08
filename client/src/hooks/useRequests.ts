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
    
    // Simple polling for Observe mode (updates every 1 second)
    const interval = setInterval(fetchRequests, 1000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const deleteRequests = useCallback(async (ids: number[]) => {
    try {
      const response = await fetch('/api/requests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error('Failed to delete requests');
      await fetchRequests();
    } catch (err: any) {
      setError(err.message);
    }
  }, [fetchRequests]);

  return { requests, isLoading, error, refreshRequests: fetchRequests, deleteRequests };
}
