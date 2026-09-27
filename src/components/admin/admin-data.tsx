"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { loadAdminBundle, type AdminBundle } from "@/actions/admin";
import { setAdminLookups } from "@/lib/admin";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

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
  newsletters: [],
  newsletterSubscribers: [],
  ministers: [],
  articles: [],
  faqs: [],
  templates: [],
  automations: [],
  auditLogs: [],
  editions: [],
  whatsappSession: null,
  adminUsers: [],
  systemHealth: {
    databaseConfigured: false,
    emailConfigured: false,
    emailCustomDomain: false,
    emailWebhookConfigured: false,
    cronConfigured: false,
    whatsAppConfigured: false,
    appUrl: "",
    sender: "",
  },
};

const AdminDataContext = createContext<AdminDataValue>({
  ...empty,
  loading: true,
  refresh: async () => undefined,
});

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [bundle, setBundle] = useState<AdminBundle>(empty);
  const [loading, setLoading] = useState(true);
  const refreshInFlight = useRef<Promise<void> | null>(null);
  const refreshQueued = useRef(false);
  const supabase = useMemo(
    () => (isSupabaseConfigured() ? createClient() : null),
    [],
  );

  const refresh = useCallback(async () => {
    if (refreshInFlight.current) {
      refreshQueued.current = true;
      await refreshInFlight.current;
      return;
    }

    do {
      refreshQueued.current = false;
      const task = (async () => {
        const next = await loadAdminBundle();
        setAdminLookups({ contacts: next.contacts, consents: next.consents });
        setBundle(next);
      })();
      refreshInFlight.current = task;
      try {
        await task;
      } finally {
        refreshInFlight.current = null;
      }
    } while (refreshQueued.current);
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

  useEffect(() => {
    if (!supabase) return;

    let debounceId: number | undefined;
    let fallbackId: number | undefined;
    const queueRefresh = () => {
      window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => void refresh(), 350);
    };
    const stopFallback = () => {
      window.clearInterval(fallbackId);
      fallbackId = undefined;
    };
    const startFallback = () => {
      if (fallbackId) return;
      fallbackId = window.setInterval(() => void refresh(), 10_000);
    };

    const channel = supabase
      .channel(`admin-live-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        queueRefresh,
      )
      .subscribe((status, error) => {
        if (status === "SUBSCRIBED") {
          stopFallback();
          return;
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          console.error("Admin live updates unavailable; using polling fallback", { status, error });
          startFallback();
        }
      });

    return () => {
      window.clearTimeout(debounceId);
      stopFallback();
      void supabase.removeChannel(channel);
    };
  }, [refresh, supabase]);

  return (
    <AdminDataContext.Provider value={{ ...bundle, loading, refresh }}>
      {bundle.error ? (
        <div className="border-b border-red/30 bg-red/5 px-4 py-2 text-sm text-red" role="alert">
          {bundle.error}
        </div>
      ) : null}
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  return useContext(AdminDataContext);
}
