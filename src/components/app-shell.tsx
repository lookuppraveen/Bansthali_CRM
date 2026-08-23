"use client";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { ViewRouter } from "./view-router";

export function AppShell() {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)" }}
    >
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto app-scroll" style={{ padding: "26px 30px 60px" }}>
          <ViewRouter />
        </main>
      </div>
    </div>
  );
}
