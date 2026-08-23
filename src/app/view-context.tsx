"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import type { ViewKey } from "@/lib/mock-data";
import { DEFAULT_VIEW, canAccess, type Role } from "@/lib/permissions";

interface ViewState {
  view: ViewKey;
  setView: (v: ViewKey) => void;
  selectedLeadId: number;
  openLead: (id: number) => void;
}

const ViewContext = createContext<ViewState | null>(null);

export function ViewProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const role = session?.user?.role as Role | undefined;

  const [view, setView] = useState<ViewKey>("dashboard");
  const [selectedLeadId, setSelectedLeadId] = useState<number>(1);
  const [initialised, setInitialised] = useState(false);

  // On first session load, pick the role's default view.
  useEffect(() => {
    if (status !== "authenticated" || !role || initialised) return;
    setView(DEFAULT_VIEW[role]);
    setInitialised(true);
  }, [status, role, initialised]);

  // If the current view is not permitted for this role, bounce to their default.
  useEffect(() => {
    if (!role) return;
    if (!canAccess(role, view)) setView(DEFAULT_VIEW[role]);
  }, [role, view]);

  const openLead = (id: number) => {
    setSelectedLeadId(id);
    setView("lead360");
  };

  return (
    <ViewContext.Provider value={{ view, setView, selectedLeadId, openLead }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  const ctx = useContext(ViewContext);
  if (!ctx) throw new Error("useView must be inside ViewProvider");
  return ctx;
}
