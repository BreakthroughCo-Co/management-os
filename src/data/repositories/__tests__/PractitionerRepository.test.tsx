import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useToggleTaskMutation, usePractitionersQuery } from '../PractitionerRepository';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  runTransaction: vi.fn(),
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

import { getDocs, runTransaction } from 'firebase/firestore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

function makeFakeTransaction(practitionerData: Record<string, any> | null) {
  const update = vi.fn();
  const transaction = {
    get: vi.fn().mockResolvedValue({
      exists: () => practitionerData !== null,
      data: () => practitionerData,
    }),
    update,
  };
  return { transaction, update };
}

describe('PractitionerRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('usePractitionersQuery falls back to mock data when Firestore is empty', async () => {
    (getDocs as any).mockResolvedValueOnce({ docs: [], empty: true });

    const { result } = renderHook(() => usePractitionersQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Falls back to the built-in MOCK_PRACTITIONERS seed data
    expect(result.current.data?.length).toBeGreaterThan(0);
  });

  it('useToggleTaskMutation flips the matching task and leaves others untouched', async () => {
    const practitioner = {
      onboardingTasks: [
        { id: 't1', text: 'Task One', done: true },
        { id: 't2', text: 'Task Two', done: false },
      ],
    };
    const { transaction, update } = makeFakeTransaction(practitioner);
    (runTransaction as any).mockImplementation(async (_db: any, updateFn: any) => updateFn(transaction));

    const { result } = renderHook(() => useToggleTaskMutation(), { wrapper });
    result.current.mutate({ practitionerId: 'p1', taskId: 't2' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(update).toHaveBeenCalledTimes(1);
    const [, payload] = update.mock.calls[0];
    expect(payload.onboardingTasks).toEqual([
      { id: 't1', text: 'Task One', done: true },
      { id: 't2', text: 'Task Two', done: true },
    ]);
  });

  it('useToggleTaskMutation reads and writes inside the same transaction (atomic against races)', async () => {
    // This is the regression test for the lost-update bug: the read (get)
    // and write (update) must happen on the SAME transaction object, which
    // is what makes Firestore retry the whole operation if the document
    // changed between read and write — a plain getDoc()+updateDoc() pair
    // cannot do this.
    const practitioner = {
      onboardingTasks: [{ id: 't1', text: 'Task One', done: false }],
    };
    const { transaction, update } = makeFakeTransaction(practitioner);
    (runTransaction as any).mockImplementation(async (_db: any, updateFn: any) => updateFn(transaction));

    const { result } = renderHook(() => useToggleTaskMutation(), { wrapper });
    result.current.mutate({ practitionerId: 'p1', taskId: 't1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(transaction.get).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('useToggleTaskMutation does nothing if the practitioner does not exist', async () => {
    const { transaction, update } = makeFakeTransaction(null);
    (runTransaction as any).mockImplementation(async (_db: any, updateFn: any) => updateFn(transaction));

    const { result } = renderHook(() => useToggleTaskMutation(), { wrapper });
    result.current.mutate({ practitionerId: 'missing', taskId: 't1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(update).not.toHaveBeenCalled();
  });

  it('useToggleTaskMutation does nothing if the task id does not match', async () => {
    const practitioner = {
      onboardingTasks: [{ id: 't1', text: 'Task One', done: false }],
    };
    const { transaction, update } = makeFakeTransaction(practitioner);
    (runTransaction as any).mockImplementation(async (_db: any, updateFn: any) => updateFn(transaction));

    const { result } = renderHook(() => useToggleTaskMutation(), { wrapper });
    result.current.mutate({ practitionerId: 'p1', taskId: 'does-not-exist' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(update).not.toHaveBeenCalled();
  });
});
