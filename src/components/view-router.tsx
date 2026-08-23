"use client";

import { useView } from "@/app/view-context";
import { DashboardView } from "@/views/dashboard";
import { LeadsView } from "@/views/leads";
import { Lead360View } from "@/views/lead360";
import { FunnelView } from "@/views/funnel";
import { WorkbenchView } from "@/views/workbench";
import { OpsView } from "@/views/ops";
import { ErpView } from "@/views/erp";
import { AnalyticsView } from "@/views/analytics";
import { StudentView } from "@/views/student";
import { ParentView } from "@/views/parent";
import { AiView } from "@/views/ai";
import { AdminView } from "@/views/admin";

export function ViewRouter() {
  const { view } = useView();

  switch (view) {
    case "dashboard":
      return <DashboardView />;
    case "leads":
      return <LeadsView />;
    case "lead360":
      return <Lead360View />;
    case "funnel":
      return <FunnelView />;
    case "workbench":
      return <WorkbenchView />;
    case "ops":
      return <OpsView />;
    case "erp":
      return <ErpView />;
    case "analytics":
      return <AnalyticsView />;
    case "student":
      return <StudentView />;
    case "parent":
      return <ParentView />;
    case "ai":
      return <AiView />;
    case "admin":
      return <AdminView />;
    default:
      return null;
  }
}
