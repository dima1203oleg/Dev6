
import { useState, useEffect } from 'react';

export function useFirebaseSync() {
  return {
    isOnline: true,
    isSynced: true,
    hasPendingWrites: false,
    fromCache: false,
    lastSyncedAt: new Date(),
    syncError: null,
    isChecking: false,
    latencyMs: 42,
    reconnect: () => console.log('Reconnecting...'),
  };
}
