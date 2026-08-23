import { AppShell } from "@/components/app-shell";
import { ViewProvider } from "../view-context";

export default function AppPage() {
  return (
    <ViewProvider>
      <AppShell />
    </ViewProvider>
  );
}
