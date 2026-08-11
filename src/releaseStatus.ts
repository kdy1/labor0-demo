export const releaseCheckCategories = ["Build", "Test", "Security"] as const;

export type ReleaseCheckCategory = (typeof releaseCheckCategories)[number];
export type ReleaseCheckStatus = "passed" | "pending" | "failed";
export type ReleaseCheckRequirement = "required" | "optional";

export type ReleaseCheck = {
  category: ReleaseCheckCategory;
  label: string;
  requirement: ReleaseCheckRequirement;
  status: ReleaseCheckStatus;
};

export type ReleaseStatus = {
  branch: string;
  checks: readonly ReleaseCheck[];
  releaseName: string;
  updatedAt: string;
};

export type ReleaseReadinessSummary = "ready" | "inProgress" | "blocked";

export type ReleaseReadiness = {
  blockers: readonly ReleaseCheck[];
  categories: Readonly<Record<ReleaseCheckCategory, readonly ReleaseCheck[]>>;
  counts: Readonly<Record<ReleaseCheckStatus, number>> & { total: number };
  summary: ReleaseReadinessSummary;
};

const checkStatusOrder: Readonly<Record<ReleaseCheckStatus, number>> = {
  failed: 0,
  pending: 1,
  passed: 2,
};

const categoryOrder: Readonly<Record<ReleaseCheckCategory, number>> = {
  Build: 0,
  Test: 1,
  Security: 2,
};

const compareChecks = (left: ReleaseCheck, right: ReleaseCheck): number =>
  checkStatusOrder[left.status] - checkStatusOrder[right.status] ||
  categoryOrder[left.category] - categoryOrder[right.category] ||
  left.label.localeCompare(right.label);

export const deriveReleaseReadiness = (
  status: ReleaseStatus,
): ReleaseReadiness => {
  const categories: Record<ReleaseCheckCategory, ReleaseCheck[]> = {
    Build: [],
    Test: [],
    Security: [],
  };
  const counts: Record<ReleaseCheckStatus, number> & { total: number } = {
    failed: 0,
    passed: 0,
    pending: 0,
    total: status.checks.length,
  };

  for (const check of status.checks) {
    categories[check.category].push(check);
    counts[check.status] += 1;
  }

  const blockers = status.checks
    .filter((check) => check.status !== "passed")
    .toSorted(compareChecks);

  return {
    blockers,
    categories,
    counts,
    summary:
      counts.failed > 0
        ? "blocked"
        : counts.pending > 0
          ? "inProgress"
          : "ready",
  };
};

export const releaseStatus: ReleaseStatus = {
  branch: "main",
  checks: [
    {
      category: "Build",
      label: "TypeScript",
      requirement: "required",
      status: "passed",
    },
    {
      category: "Build",
      label: "Production build",
      requirement: "required",
      status: "passed",
    },
    {
      category: "Test",
      label: "Component tests",
      requirement: "required",
      status: "pending",
    },
    {
      category: "Security",
      label: "Dependency audit",
      requirement: "optional",
      status: "failed",
    },
  ],
  releaseName: "August release candidate",
  updatedAt: "2026-08-11T08:52:00.000Z",
};
