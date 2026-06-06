export type WorkspaceNotificationKind = "ai-nudge" | "due-reminder";

export type WorkspaceNotification = {
  id: string;
  kind: WorkspaceNotificationKind;
  title: string;
  message: string;
  actionHref: string;
  actionLabel: string;
  sortKey: number;
};

export function aiNotificationId(id: string) {
  return `ai:${id}`;
}

export function reminderNotificationId(id: string) {
  return `reminder:${id}`;
}
