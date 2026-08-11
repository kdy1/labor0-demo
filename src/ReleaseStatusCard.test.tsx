import { afterEach, describe, expect, it } from "@rstest/core";
import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { ReleaseStatusCard } from "./ReleaseStatusCard";
import { releaseStatus } from "./releaseStatus";

afterEach(cleanup);

describe("ReleaseStatusCard", () => {
  it("shows the release, branch, updated time, and checks", () => {
    render(<ReleaseStatusCard status={releaseStatus} />);

    expect(
      screen.getByRole("heading", { name: "August release candidate" }),
    ).toBeTruthy();
    expect(screen.getByText("main")).toBeTruthy();
    expect(screen.getByText("Aug 11, 2026, 8:52 AM")).toBeTruthy();
    expect(screen.getByText("Blocked")).toBeTruthy();
    expect(screen.getAllByText("Passed")).toHaveLength(2);
    expect(screen.getAllByText("Pending")).toHaveLength(2);
    expect(screen.getAllByText("Failed")).toHaveLength(2);
  });
});
