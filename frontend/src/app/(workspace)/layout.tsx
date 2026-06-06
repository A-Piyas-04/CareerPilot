import {
  NavigationTransitionProvider,
  NavigationTransitionShell,
} from "@/components/navigation/navigation-transition";
import { WorkspaceChrome } from "@/components/layout";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavigationTransitionProvider>
      <WorkspaceChrome>
        <NavigationTransitionShell>{children}</NavigationTransitionShell>
      </WorkspaceChrome>
    </NavigationTransitionProvider>
  );
}
