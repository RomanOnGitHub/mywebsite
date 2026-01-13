import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGraphData } from './graph-cache';
import { fetchWithTimeout } from './fetch-with-timeout';

// Mock fetchWithTimeout
vi.mock('./fetch-with-timeout', () => ({
  fetchWithTimeout: vi.fn(),
}));

describe('getGraphData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the cache manually if possible, or we rely on using different langs
    // Since cache is global singleton, we need to be careful.
    // We can't easily clear the private cache variable without exposing it.
    // For test purposes, we can use a new random language code.
  });

  it('should fetch data if not cached', async () => {
    const lang = 'test-lang-1';
    const mockData = { nodes: [], edges: [] };

    (fetchWithTimeout as any).mockResolvedValue({
      json: async () => mockData,
    });

    const result = await getGraphData(lang);

    expect(fetchWithTimeout).toHaveBeenCalledWith(`/graph-data-${lang}.json`, {}, 10000);
    expect(result).toEqual(mockData);
  });

  it('should return cached promise for subsequent calls', async () => {
    const lang = 'test-lang-2';
    const mockData = { nodes: ['cached'], edges: [] };

    (fetchWithTimeout as any).mockResolvedValue({
      json: async () => mockData,
    });

    // First call
    const result1 = await getGraphData(lang);

    // Second call
    const result2 = await getGraphData(lang);

    expect(fetchWithTimeout).toHaveBeenCalledTimes(1); // Should be called only once
    expect(result1).toBe(result2); // Should return same object/promise result
    expect(result2).toEqual(mockData);
  });

  it('should handle errors and remove from cache', async () => {
    const lang = 'test-lang-error';

    (fetchWithTimeout as any).mockRejectedValue(new Error('Network error'));

    // First call fails
    await expect(getGraphData(lang)).rejects.toThrow('Network error');

    // Reset mock to success
    const mockData = { success: true };
    (fetchWithTimeout as any).mockResolvedValue({
      json: async () => mockData,
    });

    // Second call should try to fetch again because the failed one was removed
    const result = await getGraphData(lang);

    expect(result).toEqual(mockData);
    // Note: We expect 2 calls in total: one failed, one success
    expect(fetchWithTimeout).toHaveBeenCalledTimes(2);
  });
});
