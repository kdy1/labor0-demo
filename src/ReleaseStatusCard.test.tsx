import { afterEach, describe, expect, it } from "@rstest/core";
import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { ReleaseStatusCard } from "./ReleaseStatusCard";
import {
  classifyReleaseFreshness,
  releaseStatus,
  type ReleaseStatus,
} from "./releaseStatus";

afterEach(cleanup);

const referenceTime = new Date("2026-08-11T09:07:00.000Z");

const renderCard = (status: ReleaseStatus) =>
  render(<ReleaseStatusCard referenceTime={referenceTime} status={status} />);

describe("ReleaseStatusCard", () => {
  it("shows the release, branch, updated time, freshness, and checks", () => {
    const { container } = renderCard(releaseStatus);

    expect(
      screen.getByRole("heading", { name: "August release candidate" }),
    ).toBeTruthy();
    expect(screen.getByText("main")).toBeTruthy();
    expect(screen.getByText("Ready for review")).toBeTruthy();
    expect(screen.getByText("Aug 11, 2026, 8:52 AM")).toBeTruthy();
    expect(screen.getByText("Current")).toBeTruthy();
    expect(container.querySelector("time")?.dateTime).toBe(
      "2026-08-11T08:52:00.000Z",
    );
    expect(screen.getByText("3 checks")).toBeTruthy();
    expect(screen.getByText("TypeScript")).toBeTruthy();
    expect(screen.getByText("Component tests")).toBeTruthy();
    expect(screen.getByText("Production build")).toBeTruthy();
    expect(screen.getAllByText("Passed")).toHaveLength(3);
  });

  it("shows Stale for a valid timestamp older than 15 minutes", () => {
    renderCard({ ...releaseStatus, updatedAt: "2026-08-11T08:51:59.000Z" });

    expect(screen.getByText("Stale")).toBeTruthy();
  });

  it("keeps the exact 15-minute boundary Current", () => {
    renderCard({ ...releaseStatus, updatedAt: "2026-08-11T08:52:00.000Z" });

    expect(screen.getByText("Current")).toBeTruthy();
  });

  it("shows Unknown with accessible fallback text for a missing timestamp", () => {
    const { container } = renderCard({ ...releaseStatus, updatedAt: null });

    expect(screen.getByText("Not available")).toBeTruthy();
    expect(screen.getByText("Unknown")).toBeTruthy();
    expect(container.querySelector("time")).toBeNull();
  });

  it("shows Unknown with accessible fallback text for an invalid timestamp", () => {
    const { container } = renderCard({
      ...releaseStatus,
      updatedAt: "not-a-timestamp",
    });

    expect(screen.getByText("Not available")).toBeTruthy();
    expect(screen.getByText("Unknown")).toBeTruthy();
    expect(container.querySelector("time")).toBeNull();
  });
});

describe("classifyReleaseFreshness", () => {
  it("classifies Current, Stale, and Unknown timestamps against an explicit reference time", () => {
    expect(
      classifyReleaseFreshness("2026-08-11T08:52:00.000Z", referenceTime),
    ).toBe("Current");
    expect(
      classifyReleaseFreshness("2026-08-11T08:51:59.000Z", referenceTime),
    ).toBe("Stale");
    expect(classifyReleaseFreshness(null, referenceTime)).toBe("Unknown");
    expect(classifyReleaseFreshness("not-a-timestamp", referenceTime)).toBe(
      "Unknown",
    );
  });
});
