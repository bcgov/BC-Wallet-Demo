'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation'

type TenantContextType = {
  tenantId: string | undefined;
  setTenantId: (id: string | undefined) => void;
};

const TenantContext = createContext<TenantContextType>({ tenantId: undefined, setTenantId: () => {}, });

let latestTenantId: string | undefined = undefined;

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const [tenantId, setTenantId] = useState<string | undefined>();
  const [ready, setReady] = useState(false);

  const pathname = usePathname()

  useEffect(() => {
    const pathParts = pathname?.split('/');
    const tenantIdFromPath = pathParts?.[2];
    
    if (tenantIdFromPath && tenantIdFromPath !== tenantId) {
      console.log('Setting tenantId from path:', tenantIdFromPath);
      latestTenantId = tenantIdFromPath;
      setTenantId(tenantIdFromPath);
    }
    
    // Only set ready to true once the session status is not "loading"
    if (status !== 'loading') {
      setReady(true);
    }
  }, [pathname, status, tenantId]);

  if (!ready) {
    return null;
  }

  return (
    <TenantContext.Provider value={{ tenantId, setTenantId }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
export const getTenantId = () => latestTenantId;
