import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PendingTransfer {
  repoId: number;
  newOwner: string;
  initiatedAt: number;
}

interface TransferState {
  pendingTransfers: Record<number, PendingTransfer>;
  addPendingTransfer: (repoId: number, newOwner: string) => void;
  removePendingTransfer: (repoId: number) => void;
  isTransferPending: (repoId: number) => boolean;
  getPendingTransfer: (repoId: number) => PendingTransfer | undefined;
}

export const useTransferStore = create<TransferState>()(
  persist(
    (set, get) => ({
      pendingTransfers: {},
      addPendingTransfer: (repoId, newOwner) =>
        set((state) => ({
          pendingTransfers: {
            ...state.pendingTransfers,
            [repoId]: {
              repoId,
              newOwner,
              initiatedAt: Date.now(),
            },
          },
        })),
      removePendingTransfer: (repoId) =>
        set((state) => {
          const next = { ...state.pendingTransfers };
          delete next[repoId];
          return { pendingTransfers: next };
        }),
      isTransferPending: (repoId) => {
        return !!get().pendingTransfers[repoId];
      },
      getPendingTransfer: (repoId) => {
        return get().pendingTransfers[repoId];
      },
    }),
    {
      name: 'gitsweep-pending-transfers',
    }
  )
);
