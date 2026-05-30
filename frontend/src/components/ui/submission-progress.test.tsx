import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SubmissionProgress } from "./submission-progress";

describe("SubmissionProgress", () => {
  it("renders nothing when inactive", () => {
    const { container } = render(
      <SubmissionProgress
        isActive={false}
        mode="steps"
        steps={["One", "Two"]}
        activeStepIndex={0}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("exposes progressbar role and label when active", () => {
    render(
      <SubmissionProgress
        isActive
        mode="steps"
        steps={["Uploading", "Processing"]}
        activeStepIndex={1}
      />,
    );

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-busy", "true");
    expect(bar).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("Processing")).toBeInTheDocument();
  });

  it("renders indeterminate mode with label", () => {
    render(
      <SubmissionProgress
        isActive
        mode="indeterminate"
        label="Saving changes"
      />,
    );

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText("Saving changes")).toBeInTheDocument();
  });
});
