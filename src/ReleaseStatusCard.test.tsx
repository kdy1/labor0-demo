import { afterEach, describe, expect, it } from "@rstest/core";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import * as React from "react";
import { ReleaseStatusCard } from "./ReleaseStatusCard";
import { type ReleaseCheck, type ReleaseStatus, releaseStatus } from "./releaseStatus";

afterEach(cleanup);

const check = (
  category: ReleaseCheck["category"],
  label: string,
  required: boolean,
  status: ReleaseCheck["status"],
): ReleaseCheck => ({ category, label, required, status });

const reviewChecks: readonly ReleaseCheck[] = [
  check("build", "TypeScript", true, "passed"),
  check("build", "Preview image", false, "pending"),
  check("test", "Component tests", true, "pending"),
  check("test", "Browser smoke tests", false, "failed"),
  check("security", "Dependency audit", true, "failed"),
  check("security", "License review", false, "passed"),
];

const statusWithChecks = (checks: readonly ReleaseCheck[]): ReleaseStatus => ({
  ...releaseStatus,
  checks,
});

describe("ReleaseStatusCard", () => {
  it("retains the release metadata and renders the required-check outcome", () => {
    render(<ReleaseStatusCard status={statusWithChecks(reviewChecks)} />);

    expect(screen.getByRole("heading", { name: "August release candidate" })).toBeTruthy();
    expect(screen.getByText("main")).toBeTruthy();
    expect(screen.getByText("Aug 11, 2026, 8:52 AM")).toBeTruthy();
    expect(screen.getByText("Blocked")).toBeTruthy();
    expect(screen.getAllByText("Passed")).toHaveLength(2);
    expect(screen.getAllByText("Pending")).toHaveLength(2);
    expect(screen.getAllByText("Failed")).toHaveLength(2);
    expect(screen.getAllByText("required")).toHaveLength(3);
    expect(screen.getAllByText("optional")).toHaveLength(3);
  });

  it("preserves semantic category sections and named check lists", () => {
    render(<ReleaseStatusCard status={statusWithChecks(reviewChecks)} />);

    for (const category of ["Build", "Test", "Security"]) {
      expect(screen.getByRole("heading", { name: category }).tagName).toBe("H3");
      expect(screen.getByRole("list", { name: `${category} checks` })).toBeTruthy();
    }
  });

  it("shows deterministic counts, required blockers, and all checks", () => {
    render(<ReleaseStatusCard status={statusWithChecks(reviewChecks)} />);

    expect(screen.getByText("6 checks")).toBeTruthy();
    const overview = screen.getByRole("heading", { name: "Readiness review" }).closest("section");
    expect(overview).toBeTruthy();
    expect(within(overview as HTMLElement).getAllByText("2")).toHaveLength(3);
    expect(screen.getByText("Component tests — Pending")).toBeTruthy();
    expect(screen.getByText("Dependency audit — Failed")).toBeTruthy();
    expect(screen.queryByText("Browser smoke tests — Failed")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("6 checks shown");
  });

  it("supports native button filters with counts, pressed state, and keyboard clicks", () => {
    render(<ReleaseStatusCard status={statusWithChecks(reviewChecks)} />);

    const all = screen.getByRole("button", { name: "All 6" });
    const attention = screen.getByRole("button", { name: "Needs attention 4" });
    const passed = screen.getByRole("button", { name: "Passed 2" });

    expect(all.getAttribute("type")).toBe("button");
    expect(all.getAttribute("aria-pressed")).toBe("true");
    expect(attention.getAttribute("aria-pressed")).toBe("false");
    attention.focus();
    fireEvent.click(attention);
    expect(document.activeElement).toBe(attention);
    expect(attention.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("status").textContent).toBe("4 checks shown");
    expect(screen.getByText("No build checks match this filter.")).toBeTruthy();
    expect(screen.getAllByText("Pending")).toHaveLength(2);
    expect(screen.getAllByText("Failed")).toHaveLength(2);

    fireEvent.click(passed);
    expect(passed.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("status").textContent).toBe("2 checks shown");
    expect(screen.getAllByText("Passed")).toHaveLength(2);
    expect(screen.getByText("No test checks match this filter.")).toBeTruthy();
  });

  it("renders empty check sets with ready status and zero filter counts", () => {
    render(<ReleaseStatusCard status={statusWithChecks([])} />);

    expect(screen.getByText("Ready")).toBeTruthy();
    expect(screen.getByText("None. No required checks need attention.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "All 0" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Needs attention 0" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Passed 0" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("0 checks shown");
    expect(screen.getByText("No build checks match this filter.")).toBeTruthy();
    expect(screen.getByText("No test checks match this filter.")).toBeTruthy();
    expect(screen.getByText("No security checks match this filter.")).toBeTruthy();
  });
});
