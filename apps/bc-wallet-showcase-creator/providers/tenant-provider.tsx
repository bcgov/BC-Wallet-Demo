'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { decodeJwt } from '@/lib/utils';

type TenantContextType = {
  tenantId: string | null;
};

const TenantContext = createContext<TenantContextType>({ tenantId: null });

let latestTenantId: string | undefined = undefined;

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (session?.accessToken) {
      try {
        const token = decodeJwt(session.accessToken);
        console.log('Decoded Token ==> ', token);
        setTenantId(token.azp || null);
        latestTenantId = token.azp || null;
      } catch (error) {
        console.error('Failed to decode token:', error);
      }
    }
    setReady(true);
  }, [session, status]);

  if (!ready) {
    return null;
  }

  return (
    <TenantContext.Provider value={{ tenantId }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
export const getTenantId = () => latestTenantId;
