export type ReleaseCheck = {
  label: string;
  status: "passed" | "pending";
};

export type ReleaseStatus = {
  branch: string;
  checks: readonly ReleaseCheck[];
  releaseName: string;
  updatedAt: string | null;
};

export type ReleaseFreshness = "Current" | "Stale" | "Unknown";

const freshnessWindowMilliseconds = 15 * 60 * 1000;

export const parseReleaseTimestamp = (
  timestamp: string | null | undefined,
): Date | null => {
  if (typeof timestamp !== "string") {
    return null;
  }

  const parsedTimestamp = new Date(timestamp);

  return Number.isNaN(parsedTimestamp.getTime()) ? null : parsedTimestamp;
};

export const classifyReleaseFreshness = (
  timestamp: string | null | undefined,
  referenceTime: Date,
): ReleaseFreshness => {
  const parsedTimestamp = parseReleaseTimestamp(timestamp);

  if (
    !parsedTimestamp ||
    Number.isNaN(referenceTime.getTime())
  ) {
    return "Unknown";
  }

  return referenceTime.getTime() - parsedTimestamp.getTime() <=
    freshnessWindowMilliseconds
    ? "Current"
    : "Stale";
};

export const releaseStatus: ReleaseStatus = {
  branch: "main",
  checks: [
    { label: "TypeScript", status: "passed" },
    { label: "Component tests", status: "passed" },
    { label: "Production build", status: "passed" },
  ],
  releaseName: "August release candidate",
  updatedAt: "2026-08-11T08:52:00.000Z",
};
