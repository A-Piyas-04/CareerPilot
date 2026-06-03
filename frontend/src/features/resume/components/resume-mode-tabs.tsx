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

const TABS: { id: CvInputMode; label: string; shortLabel: string; icon: typeof Upload }[] = [
  { id: "upload", label: "Upload CV", shortLabel: "Upload", icon: Upload },
  { id: "build", label: "Build CV", shortLabel: "Build", icon: PenLine },
  { id: "manual", label: "Manual", shortLabel: "Manual", icon: FileText },
];

const MODE_INDEX: Record<CvInputMode, number> = {
  upload: 0,
  build: 1,
  manual: 2,
};

const INDICATOR_WIDTH = "calc((100% - 0.5rem) / 3)";

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
      {TABS.map(({ id, label, shortLabel, icon: Icon }) => (
        <button
          key={id}
          className={resumeSegmentTab(inputMode === id)}
          role="tab"
          type="button"
          aria-selected={inputMode === id}
          onClick={() => onChange(id)}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{shortLabel}</span>
        </button>
      ))}
    </div>
  );
}
