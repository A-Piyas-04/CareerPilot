"use client";

import type { ReactNode } from "react";

import {
  resumeWorkspaceBand,
  resumeWorkspaceBody,
  resumeWorkspaceShell,
} from "../resume-ui";

type ResumeWorkspacePanelProps = {
  activeResume: ReactNode;
  children: ReactNode;
};

/** Unified center column: active resume band + CV input (upload / build / manual) */
export function ResumeWorkspacePanel({
  activeResume,
  children,
}: ResumeWorkspacePanelProps) {
  return (
    <div className={resumeWorkspaceShell}>
      <div className={resumeWorkspaceBand}>{activeResume}</div>
      <div className={resumeWorkspaceBody}>
        <div className="w-full space-y-5">{children}</div>
      </div>
    </div>
  );
}
