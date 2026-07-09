import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApproveClaimMutation, useRejectClaimMutation, useClaimsQuery } from '../ClaimRepository';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  runTransaction: vi.fn(),
  getFirestore: vi.fn(),
  initializeFirestore: vi.fn(),
  persistentLocalCache: vi.fn(),
  persistentMultipleTabManager: vi.fn(),
}));

// Mock Firebase app and auth
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
}));
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
}));

// Mock the app store (pending sync counter) — irrelevant to these tests
vi.mock('@/store/useAppStore', () => ({
  useAppStore: { getState: () => ({ incrementPendingSync: vi.fn() }) },
}));

// Mock the workflow engine so we can assert events fire without wiring real listeners
vi.mock('@/core/services/WorkflowEngine', () => ({
  workflowEngine: { emit: vi.fn() },
}));

import { getDocs, runTransaction } from 'firebase/firestore';
import { workflowEngine } from '@/core/services/WorkflowEngine';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

// Minimal fake transaction that mimics Firestore's transaction.get/update API
// against an in-memory claim, so we can test the status-guard logic without
// a real Firestore emulator.
function makeFakeTransaction(claimData: Record<string, any> | null) {
  const update = vi.fn();
  const transaction = {
    get: vi.fn().mockResolvedValue({
      exists: () => claimData !== null,
      data: () => claimData,
    }),
    update,
  };
  return { transaction, update };
}

describe('ClaimRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('useClaimsQuery fetches and maps claims correctly', async () => {
    const mockDocs = [
      {
        id: 'c1',
        data: () => ({
          patient: 'Jane Doe',
          amount: 250,
          date: '2026-01-01',
          type: 'Standard',
          status: 'Pending',
        }),
      },
    ];
    (getDocs as any).mockResolvedValueOnce({ docs: mockDocs });

    const { result } = renderHook(() => useClaimsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].id).toBe('c1');
    expect(result.current.data?.[0].status).toBe('Pending');
  });

  it('useApproveClaimMutation approves a Pending claim and emits claim:approved', async () => {
    const { transaction, update } = makeFakeTransaction({ status: 'Pending' });
    (runTransaction as any).mockImplementation(async (_db: any, updateFn: any) => updateFn(transaction));

    const { result } = renderHook(() => useApproveClaimMutation(), { wrapper });
    result.current.mutate('c1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(update).toHaveBeenCalledWith(undefined, { status: 'Approved' });
    expect(workflowEngine.emit).toHaveBeenCalledWith('claim:approved', { id: 'c1' });
  });

  it('useApproveClaimMutation rejects (throws) when the claim is already finalized', async () => {
    const { transaction, update } = makeFakeTransaction({ status: 'Approved' });
    (runTransaction as any).mockImplementation(async (_db: any, updateFn: any) => updateFn(transaction));

    const { result } = renderHook(() => useApproveClaimMutation(), { wrapper });
    result.current.mutate('c1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(update).not.toHaveBeenCalled();
    expect(workflowEngine.emit).not.toHaveBeenCalled();
  });

  it('useApproveClaimMutation throws when the claim does not exist', async () => {
    const { transaction, update } = makeFakeTransaction(null);
    (runTransaction as any).mockImplementation(async (_db: any, updateFn: any) => updateFn(transaction));

    const { result } = renderHook(() => useApproveClaimMutation(), { wrapper });
    result.current.mutate('missing-claim');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(update).not.toHaveBeenCalled();
  });

  it('useRejectClaimMutation rejects a Pending claim and emits claim:rejected', async () => {
    const { transaction, update } = makeFakeTransaction({ status: 'Pending' });
    (runTransaction as any).mockImplementation(async (_db: any, updateFn: any) => updateFn(transaction));

    const { result } = renderHook(() => useRejectClaimMutation(), { wrapper });
    result.current.mutate('c1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(update).toHaveBeenCalledWith(undefined, { status: 'Rejected' });
    expect(workflowEngine.emit).toHaveBeenCalledWith('claim:rejected', { id: 'c1' });
  });

  it('useRejectClaimMutation rejects (throws) when the claim is already finalized', async () => {
    const { transaction, update } = makeFakeTransaction({ status: 'Rejected' });
    (runTransaction as any).mockImplementation(async (_db: any, updateFn: any) => updateFn(transaction));

    const { result } = renderHook(() => useRejectClaimMutation(), { wrapper });
    result.current.mutate('c1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(update).not.toHaveBeenCalled();
  });
});
