
import { QueryClient, DehydratedState } from '@tanstack/react-query';
import { Persister } from '@tanstack/react-query-persist-client';
import { redis } from './db/redis';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Data from WS is the source of truth
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

/**
 * Custom Async Persister for React Query using our Redis adapter.
 * Implements the official Persister interface.
 */
export const asyncRedisPersister: Persister = {
  persistClient: async (persistClient) => {
    await redis.set('REACT_QUERY_OFFLINE_CACHE', persistClient);
  },
  restoreClient: async () => {
    return await redis.get<any>('REACT_QUERY_OFFLINE_CACHE');
  },
  removeClient: async () => {
    await redis.del('REACT_QUERY_OFFLINE_CACHE');
  },
};
