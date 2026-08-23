import { AppShell } from "@/components/app-shell";
import { ViewProvider } from "./view-context";

export default function HomePage() {
  return (
    <ViewProvider>
      <AppShell />
    </ViewProvider>
  );
}
