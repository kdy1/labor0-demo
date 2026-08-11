import { afterEach, describe, expect, it } from "@rstest/core";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import * as React from "react";
import { ReleaseStatusCard } from "./ReleaseStatusCard";
import {
  deriveReleaseReadiness,
  type ReleaseCheck,
  type ReleaseStatus,
  releaseStatus,
} from "./releaseStatus";

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

const activateFilterWithKeyboard = (
  button: HTMLElement,
  key: "Enter" | " ",
): void => {
  button.focus();
  expect(document.activeElement).toBe(button);

  // jsdom does not perform the browser's native button click default action.
  fireEvent.keyDown(button, { code: key === " " ? "Space" : key, key });
  fireEvent.keyUp(button, { code: key === " " ? "Space" : key, key });
  fireEvent.click(button);
};

describe("deriveReleaseReadiness", () => {
  it.each([
    {
      checks: [],
      outcome: "ready",
      blockers: [],
    },
    {
      checks: [check("build", "Preview", false, "pending")],
      outcome: "ready",
      blockers: [],
    },
    {
      checks: [check("test", "Component tests", true, "pending")],
      outcome: "inProgress",
      blockers: ["Component tests"],
    },
    {
      checks: [check("security", "Dependency audit", true, "failed")],
      outcome: "blocked",
      blockers: ["Dependency audit"],
    },
  ])("derives the $outcome outcome", ({ checks, outcome, blockers }) => {
    const readiness = deriveReleaseReadiness(checks);

    expect(readiness.outcome).toBe(outcome);
    expect(readiness.blockers.map(({ label }) => label)).toEqual(blockers);
  });

  it("counts every status and requirement and sorts required blockers deterministically", () => {
    const readiness = deriveReleaseReadiness([
      reviewChecks[4],
      reviewChecks[2],
      reviewChecks[1],
      reviewChecks[5],
      reviewChecks[3],
      reviewChecks[0],
    ]);

    expect(readiness.counts).toEqual({
      total: 6,
      required: 3,
      optional: 3,
      passed: 2,
      pending: 2,
      failed: 2,
    });
    expect(
      readiness.blockers.map(({ label, status }) => `${label} — ${status}`),
    ).toEqual(["Component tests — pending", "Dependency audit — failed"]);
  });
});

describe("ReleaseStatusCard", () => {
  it("retains the release metadata and renders derived status text", () => {
    render(<ReleaseStatusCard status={statusWithChecks(reviewChecks)} />);

    expect(
      screen.getByRole("heading", { name: "August release candidate" }),
    ).toBeTruthy();
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
      const group = screen.getByRole("heading", { name: category });
      expect(group.tagName).toBe("H3");
      expect(
        screen.getByRole("list", { name: `${category} checks` }),
      ).toBeTruthy();
    }
  });

  it("shows deterministic counts, blockers, and all checks", () => {
    render(<ReleaseStatusCard status={statusWithChecks(reviewChecks)} />);

    expect(screen.getByText("6 checks")).toBeTruthy();
    const overview = screen
      .getByRole("heading", { name: "Readiness review" })
      .closest("section");
    expect(overview).toBeTruthy();
    expect(within(overview as HTMLElement).getAllByText("2")).toHaveLength(3);
    expect(screen.getByText("Component tests — Pending")).toBeTruthy();
    expect(screen.getByText("Dependency audit — Failed")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("6 checks shown");
  });

  it("supports all filters with visible counts, pressed state, and keyboard activation", () => {
    render(<ReleaseStatusCard status={statusWithChecks(reviewChecks)} />);

    const all = screen.getByRole("button", { name: "All 6" });
    const attention = screen.getByRole("button", {
      name: "Needs attention 4",
    });
    const passed = screen.getByRole("button", { name: "Passed 2" });

    expect(all.getAttribute("aria-pressed")).toBe("true");
    expect(attention.getAttribute("aria-pressed")).toBe("false");
    expect(passed.getAttribute("aria-pressed")).toBe("false");

    activateFilterWithKeyboard(attention, "Enter");
    expect(attention.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("status").textContent).toBe("4 checks shown");
    expect(screen.getByText("No build checks match this filter.")).toBeTruthy();
    expect(screen.getAllByText("Pending")).toHaveLength(2);
    expect(screen.getAllByText("Failed")).toHaveLength(2);
    expect(screen.queryByText("No security checks match this filter.")).toBeNull();

    activateFilterWithKeyboard(passed, " ");
    expect(passed.getAttribute("aria-pressed")).toBe("true");
    expect(attention.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("status").textContent).toBe("2 checks shown");
    expect(screen.getAllByText("Passed")).toHaveLength(2);
    expect(screen.getByText("No test checks match this filter.")).toBeTruthy();

    activateFilterWithKeyboard(all, "Enter");
    expect(all.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("status").textContent).toBe("6 checks shown");
  });

  it("renders empty check sets with ready status and zero filter counts", () => {
    render(<ReleaseStatusCard status={statusWithChecks([])} />);

    expect(screen.getByText("Ready")).toBeTruthy();
    expect(screen.getByText("None. All checks have passed.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "All 0" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Needs attention 0" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Passed 0" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("0 checks shown");
    expect(screen.getByText("No build checks match this filter.")).toBeTruthy();
    expect(screen.getByText("No test checks match this filter.")).toBeTruthy();
    expect(screen.getByText("No security checks match this filter.")).toBeTruthy();
  });
});
