export const releaseCheckCategories = ["build", "test", "security"] as const;

export type ReleaseCheckCategory = (typeof releaseCheckCategories)[number];

export type ReleaseCheckStatus = "passed" | "pending" | "failed";

export type ReleaseCheck = {
  readonly category: ReleaseCheckCategory;
  readonly label: string;
  readonly required: boolean;
  readonly status: ReleaseCheckStatus;
};

export type ReleaseStatus = {
  readonly branch: string;
  readonly checks: readonly ReleaseCheck[];
  readonly releaseName: string;
  readonly updatedAt: string;
};

export type ReleaseReadinessOutcome = "ready" | "inProgress" | "blocked";

export type ReleaseReadinessCounts = {
  readonly total: number;
  readonly required: number;
  readonly optional: number;
  readonly passed: number;
  readonly pending: number;
  readonly failed: number;
};

export type ReleaseReadiness = {
  readonly outcome: ReleaseReadinessOutcome;
  readonly counts: ReleaseReadinessCounts;
  readonly blockers: readonly ReleaseCheck[];
};

const categoryOrder: Readonly<Record<ReleaseCheckCategory, number>> = {
  build: 0,
  test: 1,
  security: 2,
};

const statusOrder: Readonly<Record<ReleaseCheckStatus, number>> = {
  failed: 0,
  pending: 1,
  passed: 2,
};

const compareText = (left: string, right: string): number => {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
};

const compareBlockers = (left: ReleaseCheck, right: ReleaseCheck): number =>
  categoryOrder[left.category] - categoryOrder[right.category] ||
  compareText(left.label, right.label) ||
  statusOrder[left.status] - statusOrder[right.status];

/**
 * Required passed checks are ready; required pending checks are in progress;
 * and required failed checks are blocked. Optional checks never block readiness.
 * With multiple checks, blocked takes precedence over in progress and ready.
 */
export const deriveReleaseReadiness = (
  checks: readonly ReleaseCheck[],
): ReleaseReadiness => {
  let required = 0;
  let passed = 0;
  let pending = 0;
  let failed = 0;
  const blockers: ReleaseCheck[] = [];

  for (const check of checks) {
    if (check.required) {
      required += 1;
    }

    if (check.status === "passed") {
      passed += 1;
    } else if (check.status === "pending") {
      pending += 1;
    } else {
      failed += 1;
    }

    if (check.required && check.status !== "passed") {
      blockers.push(check);
    }
  }

  const hasRequiredFailure = blockers.some(
    (check) => check.status === "failed",
  );
  const outcome: ReleaseReadinessOutcome = hasRequiredFailure
    ? "blocked"
    : blockers.length > 0
      ? "inProgress"
      : "ready";

  return {
    outcome,
    counts: {
      total: checks.length,
      required,
      optional: checks.length - required,
      passed,
      pending,
      failed,
    },
    blockers: blockers.sort(compareBlockers),
  };
};

export const releaseStatus: ReleaseStatus = {
  branch: "main",
  checks: [
    { category: "build", label: "TypeScript", required: true, status: "passed" },
    { category: "build", label: "Preview image", required: false, status: "pending" },
    { category: "test", label: "Component tests", required: true, status: "pending" },
    { category: "test", label: "Browser smoke tests", required: false, status: "failed" },
    { category: "security", label: "Dependency audit", required: true, status: "failed" },
    { category: "security", label: "License review", required: false, status: "passed" },
  ],
  releaseName: "August release candidate",
  updatedAt: "2026-08-11T08:52:00.000Z",
};
