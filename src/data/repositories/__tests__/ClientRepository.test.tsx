import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useClientsQuery } from '../ClientRepository';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  getFirestore: vi.fn(),
  initializeFirestore: vi.fn(),
  persistentLocalCache: vi.fn(),
  persistentMultipleTabManager: vi.fn()
}));

// Mock Firebase app and auth
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn()
}));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn()
}));
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn()
}));

import { getDocs } from 'firebase/firestore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('ClientRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('useClientsQuery should fetch and map clients correctly', async () => {
    // Mock the Firestore snapshot
    const mockDocs = [
      {
        id: '1',
        data: () => ({
          firstName: 'John',
          lastName: 'Doe',
          ndisNumber: '12345',
          status: 'Active',
          risk: 'Low',
          funding: { totalBudget: 1000, utilized: 200, remaining: 800 },
          flags: [],
          nextReview: '2025-01-01'
        })
      }
    ];

    (getDocs as any).mockResolvedValueOnce({ docs: mockDocs });

    const { result } = renderHook(() => useClientsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].id).toBe('1');
    expect(result.current.data?.[0].firstName).toBe('John');
  });
});
