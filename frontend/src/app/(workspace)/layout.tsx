import { AppNav } from "@/components/nav/AppNav";
import {
  NavigationTransitionProvider,
  NavigationTransitionShell,
} from "@/components/navigation/navigation-transition";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavigationTransitionProvider>
      <AppNav />
      <NavigationTransitionShell>{children}</NavigationTransitionShell>
    </NavigationTransitionProvider>
  );
}
