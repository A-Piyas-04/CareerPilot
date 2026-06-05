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

/** Unified center column: active resume band + CV input (upload / manual) */
export function ResumeWorkspacePanel({
  activeResume,
  children,
}: ResumeWorkspacePanelProps) {
  return (
    <div className={resumeWorkspaceShell}>
      <div className={`${resumeWorkspaceBand} cp-resume-band-dots`}>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-800/90">
          Your profile
        </p>
        {activeResume}
      </div>
      <div className={resumeWorkspaceBody}>
        <div className="w-full space-y-5">{children}</div>
      </div>
    </div>
  );
}
