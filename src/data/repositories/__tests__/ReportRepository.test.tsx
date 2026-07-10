import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReportsQuery, useCreateReportMutation, useSendReportMutation } from '../ReportRepository';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  doc: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  getFirestore: vi.fn(),
  initializeFirestore: vi.fn(),
  persistentLocalCache: vi.fn(),
  persistentMultipleTabManager: vi.fn(),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
}));
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
}));

import { getDocs, addDoc, updateDoc } from 'firebase/firestore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('ReportRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('useReportsQuery falls back to seed data when the collection is empty', async () => {
    (getDocs as any).mockResolvedValueOnce({ empty: true, docs: [] });

    const { result } = renderHook(() => useReportsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBeGreaterThan(0);
    expect(result.current.data?.[0].id).toMatch(/^seed-/);
  });

  it('useReportsQuery maps real Firestore docs when present', async () => {
    const mockDocs = [
      {
        id: 'r1',
        data: () => ({
          name: 'Real Report',
          type: 'Clinical',
          date: '2026-07-01',
          recipient: 'NDIS Commission',
          status: 'Draft',
        }),
      },
    ];
    (getDocs as any).mockResolvedValueOnce({ empty: false, docs: mockDocs });

    const { result } = renderHook(() => useReportsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].id).toBe('r1');
    expect(result.current.data?.[0].name).toBe('Real Report');
  });

  it('useCreateReportMutation calls addDoc with the new report', async () => {
    (addDoc as any).mockResolvedValueOnce({ id: 'new-id' });

    const { result } = renderHook(() => useCreateReportMutation(), { wrapper });
    result.current.mutate({
      name: 'New Report',
      type: 'Compliance',
      date: '2026-07-11',
      recipient: 'Clinical Lead',
      status: 'Draft',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(addDoc).toHaveBeenCalledTimes(1);
  });

  it('useSendReportMutation updates status to Sent for a real report id', async () => {
    (updateDoc as any).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useSendReportMutation(), { wrapper });
    result.current.mutate('r1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateDoc).toHaveBeenCalledWith(undefined, { status: 'Sent' });
  });

  it('useSendReportMutation is a no-op for seed rows (no backing Firestore doc)', async () => {
    const { result } = renderHook(() => useSendReportMutation(), { wrapper });
    result.current.mutate('seed-0');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateDoc).not.toHaveBeenCalled();
  });
});
