import { afterEach, describe, expect, it } from "@rstest/core";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { ReleaseStatusCard } from "./ReleaseStatusCard";
import { releaseStatus } from "./releaseStatus";

afterEach(cleanup);

describe("ReleaseStatusCard", () => {
  it("shows the derived release review alongside release metadata", () => {
    render(<ReleaseStatusCard status={releaseStatus} />);

    expect(
      screen.getByRole("heading", { name: "August release candidate" }),
    ).toBeTruthy();
    expect(screen.getByText("main")).toBeTruthy();
    expect(screen.getByText("Aug 11, 2026, 8:52 AM")).toBeTruthy();
    expect(screen.getByText("Blocked")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Needs attention 2" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Passed 2" })).toBeTruthy();
    expect(screen.getByText("Dependency audit — Failed")).toBeTruthy();
    expect(screen.getByText("Component tests — Pending")).toBeTruthy();
  });

  it("filters checks with accessible count buttons and preserves empty groups", () => {
    render(<ReleaseStatusCard status={releaseStatus} />);

    const attentionFilter = screen.getByRole("button", {
      name: "Needs attention 2",
    });
    fireEvent.click(attentionFilter);

    expect(attentionFilter.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("status").textContent).toBe("2 checks shown");
    expect(screen.getByRole("list", { name: "Build checks" })).toBeTruthy();
    expect(
      screen.getByText("No build checks match this filter."),
    ).toBeTruthy();
    expect(screen.getAllByText("Pending")).toHaveLength(2);
    expect(screen.getAllByText("Failed")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Passed 2" }));

    expect(screen.getByRole("status").textContent).toBe("2 checks shown");
    expect(screen.getAllByText("Passed")).toHaveLength(4);
    expect(screen.getByText("No test checks match this filter.")).toBeTruthy();
  });
});
