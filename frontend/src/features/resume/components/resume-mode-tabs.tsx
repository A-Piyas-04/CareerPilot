"use client";

import { FileText, PenLine, Upload } from "lucide-react";

import {
  resumeSegmentGroup,
  resumeSegmentIndicator,
  resumeSegmentTab,
} from "../resume-ui";

export type CvInputMode = "upload" | "build" | "manual";

type ResumeModeTabsProps = {
  inputMode: CvInputMode;
  onChange: (mode: CvInputMode) => void;
};

const TABS: { id: CvInputMode; label: string; icon: typeof Upload }[] = [
  { id: "upload", label: "Upload CV", icon: Upload },
  { id: "build", label: "Build CV", icon: PenLine },
  { id: "manual", label: "Manual", icon: FileText },
];

const MODE_INDEX: Record<CvInputMode, number> = {
  upload: 0,
  build: 1,
  manual: 2,
};

/** Width of one tab slot; matches flex gap-1 + p-1 on the group */
const INDICATOR_WIDTH = "calc((100% - 1rem) / 3)";

export function ResumeModeTabs({ inputMode, onChange }: ResumeModeTabsProps) {
  const activeIndex = MODE_INDEX[inputMode];

  return (
    <div
      className={resumeSegmentGroup}
      role="tablist"
      aria-label="CV input method"
    >
      <span
        aria-hidden
        className={resumeSegmentIndicator}
        style={{
          width: INDICATOR_WIDTH,
          transform: `translateX(calc(${activeIndex} * (100% + 0.25rem)))`,
        }}
      />
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={resumeSegmentTab(inputMode === id)}
          role="tab"
          type="button"
          aria-selected={inputMode === id}
          onClick={() => onChange(id)}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </button>
      ))}
    </div>
  );
}
