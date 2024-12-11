import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Avoid automatic refetching, which can accidentally trigger rate limiting
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity, // Data remains fresh indefinitely
      cacheTime: 60 * 60 * 1000,
      retry: (failureCount, error) => {
        // Retry only if it's not a rate-limited error (HTTP 429)
        if (error.response?.status === 429) {
          return false; // Stop retrying on rate limit
        }
        return failureCount < 3; // Retry other errors up to 3 times
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff with a max delay
    },
  },
});
