import { AppNav } from "@/components/nav/AppNav";
import {
  NavigationTransitionProvider,
  NavigationTransitionShell,
} from "@/components/navigation/navigation-transition";
import { WorkspaceAssistLayer } from "@/components/reminders/WorkspaceAssistLayer";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavigationTransitionProvider>
      <AppNav />
      <WorkspaceAssistLayer />
      <NavigationTransitionShell>{children}</NavigationTransitionShell>
    </NavigationTransitionProvider>
  );
}
