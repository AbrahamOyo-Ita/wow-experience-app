"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { loadAdminBundle, type AdminBundle } from "@/actions/admin";
import { setAdminLookups } from "@/lib/admin";

type AdminDataValue = AdminBundle & {
  loading: boolean;
  refresh: () => Promise<void>;
};

const empty: AdminBundle = {
  profile: null,
  contacts: [],
  consents: [],
  rsvps: [],
  attendance: [],
  volunteers: [],
  campaigns: [],
  templates: [],
  automations: [],
  auditLogs: [],
  editions: [],
  whatsappSession: null,
  adminUsers: [],
};

const AdminDataContext = createContext<AdminDataValue>({
  ...empty,
  loading: true,
  refresh: async () => undefined,
});

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [bundle, setBundle] = useState<AdminBundle>(empty);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await loadAdminBundle();
    setAdminLookups({ contacts: next.contacts, consents: next.consents });
    setBundle(next);
  }, []);

  useEffect(() => {
    let active = true;
    const id = window.setTimeout(() => {
      refresh().finally(() => {
        if (active) setLoading(false);
      });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(id);
    };
  }, [refresh]);

  return (
    <AdminDataContext.Provider value={{ ...bundle, loading, refresh }}>
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  return useContext(AdminDataContext);
}
