import { describe, expect, it } from "@rstest/core";
import {
  deriveReleaseReadiness,
  type ReleaseCheck,
  type ReleaseCheckStatus,
  type ReleaseReadinessOutcome,
} from "./releaseStatus";

const makeCheck = (
  status: ReleaseCheckStatus,
  required: boolean,
  overrides: Partial<ReleaseCheck> = {},
): ReleaseCheck => ({
  category: "build",
  label: `${required ? "Required" : "Optional"} ${status}`,
  required,
  status,
  ...overrides,
});

describe("deriveReleaseReadiness", () => {
  const truthTable: readonly {
    readonly description: string;
    readonly checks: readonly ReleaseCheck[];
    readonly expectedOutcome: ReleaseReadinessOutcome;
    readonly expectedBlockers: number;
  }[] = [
    {
      description: "an empty check set",
      checks: [],
      expectedOutcome: "ready",
      expectedBlockers: 0,
    },
    {
      description: "a required passed check",
      checks: [makeCheck("passed", true)],
      expectedOutcome: "ready",
      expectedBlockers: 0,
    },
    {
      description: "a required pending check",
      checks: [makeCheck("pending", true)],
      expectedOutcome: "inProgress",
      expectedBlockers: 1,
    },
    {
      description: "a required failed check",
      checks: [makeCheck("failed", true)],
      expectedOutcome: "blocked",
      expectedBlockers: 1,
    },
    {
      description: "an optional passed check",
      checks: [makeCheck("passed", false)],
      expectedOutcome: "ready",
      expectedBlockers: 0,
    },
    {
      description: "an optional pending check",
      checks: [makeCheck("pending", false)],
      expectedOutcome: "ready",
      expectedBlockers: 0,
    },
    {
      description: "an optional failed check",
      checks: [makeCheck("failed", false)],
      expectedOutcome: "ready",
      expectedBlockers: 0,
    },
  ];

  for (const row of truthTable) {
    it(`rolls up ${row.description}`, () => {
      const result = deriveReleaseReadiness(row.checks);

      expect(result.outcome).toBe(row.expectedOutcome);
      expect(result.blockers).toHaveLength(row.expectedBlockers);
    });
  }

  it("applies failed, pending, and ready precedence only to required checks", () => {
    const requiredPending = makeCheck("pending", true);
    const requiredFailed = makeCheck("failed", true);
    const optionalFailed = makeCheck("failed", false);

    expect(
      deriveReleaseReadiness([requiredPending, optionalFailed]).outcome,
    ).toBe("inProgress");
    expect(
      deriveReleaseReadiness([
        requiredPending,
        requiredFailed,
        optionalFailed,
      ]).outcome,
    ).toBe("blocked");
  });

  it("reports explicit totals across requirement and state dimensions", () => {
    const checks = [
      makeCheck("passed", true),
      makeCheck("pending", true),
      makeCheck("failed", true),
      makeCheck("passed", false),
      makeCheck("pending", false),
      makeCheck("failed", false),
    ];

    expect(deriveReleaseReadiness(checks).counts).toEqual({
      total: 6,
      required: 3,
      optional: 3,
      passed: 2,
      pending: 2,
      failed: 2,
    });
  });

  it("returns explicit zero totals for an empty check set", () => {
    expect(deriveReleaseReadiness([])).toEqual({
      outcome: "ready",
      counts: {
        total: 0,
        required: 0,
        optional: 0,
        passed: 0,
        pending: 0,
        failed: 0,
      },
      blockers: [],
    });
  });

  it("orders blockers by category, label, and then status without mutating input", () => {
    const security = makeCheck("failed", true, {
      category: "security",
      label: "Audit",
    });
    const test = makeCheck("pending", true, {
      category: "test",
      label: "Acceptance",
    });
    const buildZulu = makeCheck("failed", true, {
      category: "build",
      label: "Zulu",
    });
    const buildPending = makeCheck("pending", true, {
      category: "build",
      label: "Compile",
    });
    const buildFailed = makeCheck("failed", true, {
      category: "build",
      label: "Compile",
    });
    const optional = makeCheck("failed", false, {
      category: "build",
      label: "Advisory",
    });
    const checks = [security, test, buildZulu, buildPending, buildFailed, optional];
    const originalOrder = [...checks];

    const blockers = deriveReleaseReadiness(checks).blockers;

    expect(blockers).toEqual([
      buildFailed,
      buildPending,
      buildZulu,
      test,
      security,
    ]);
    expect(checks).toEqual(originalOrder);
    expect(deriveReleaseReadiness([...checks].reverse()).blockers).toEqual(
      blockers,
    );
  });
});
