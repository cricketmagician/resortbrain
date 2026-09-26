'use client';

// lib/guest/network.ts
// Drives the offline banner and the guest error copy that distinguishes "offline" from "slow".

import { useEffect, useState } from 'react';

export type NetworkState = 'online' | 'offline' | 'slow';

interface NetworkInformation extends EventTarget {
  saveData?: boolean;
  effectiveType?: string;
}

function readState(): NetworkState {
  if (typeof navigator === 'undefined') return 'online';
  if (navigator.onLine === false) return 'offline';
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (connection && (connection.saveData || /2g/.test(connection.effectiveType ?? ''))) return 'slow';
  return 'online';
}

export function useNetworkStatus(): NetworkState {
  const [state, setState] = useState<NetworkState>(readState);

  useEffect(() => {
    function update() {
      setState(readState());
    }
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    connection?.addEventListener('change', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      connection?.removeEventListener('change', update);
    };
  }, []);

  return state;
}
