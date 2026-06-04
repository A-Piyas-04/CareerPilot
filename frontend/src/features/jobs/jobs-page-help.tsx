"use client";

import {
  PageHelpButton,
  type PageHelpStep,
} from "@/components/layout/page-help-button";

export type JobsHelpStep = PageHelpStep;

type JobsPageHelpButtonProps = {
  description: string;
  steps: JobsHelpStep[];
};

export function JobsPageHelpButton({
  description,
  steps,
}: JobsPageHelpButtonProps) {
  return (
    <PageHelpButton
      dialogTitle="How Job Hunter works"
      ariaLabel="How Job Hunter works"
      description={description}
      steps={steps}
    />
  );
}
