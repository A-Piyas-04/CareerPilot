import {
  NavigationTransitionProvider,
  NavigationTransitionShell,
} from "@/components/navigation/navigation-transition";
import { WorkspaceChrome } from "@/components/layout";
import { WorkspaceAssistLayer } from "@/components/reminders/WorkspaceAssistLayer";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavigationTransitionProvider>
      <WorkspaceChrome>
        <WorkspaceAssistLayer />
        <NavigationTransitionShell>{children}</NavigationTransitionShell>
      </WorkspaceChrome>
    </NavigationTransitionProvider>
  );
}
