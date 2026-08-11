import type { ReactElement } from "react";
import * as React from "react";
import {
  deriveReleaseReadiness,
  releaseCheckCategories,
  type ReleaseCheck,
  type ReleaseReadinessSummary,
  type ReleaseStatus,
} from "./releaseStatus";

type ReleaseStatusCardProps = {
  status: ReleaseStatus;
};

type CheckFilter = "all" | "needsAttention" | "passed";

const filters: readonly { label: string; value: CheckFilter }[] = [
  { label: "All", value: "all" },
  { label: "Needs attention", value: "needsAttention" },
  { label: "Passed", value: "passed" },
];

const summaryLabels: Readonly<Record<ReleaseReadinessSummary, string>> = {
  blocked: "Blocked",
  inProgress: "In progress",
  ready: "Ready",
};

const formatUpdatedAt = (updatedAt: string): string =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(updatedAt));

const filterChecks = (
  checks: readonly ReleaseCheck[],
  filter: CheckFilter,
): readonly ReleaseCheck[] =>
  checks.filter((check) => {
    if (filter === "all") {
      return true;
    }

    return filter === "passed"
      ? check.status === "passed"
      : check.status === "pending" || check.status === "failed";
  });

const CheckRow = ({ check }: { check: ReleaseCheck }): ReactElement => (
  <li className="release-card__check">
    <span className="release-card__check-label">{check.label}</span>
    <span className="release-card__check-details">
      <span className={`release-card__check-status release-card__check-status--${check.status}`}>
        {check.status.charAt(0).toUpperCase() + check.status.slice(1)}
      </span>
      <span className="release-card__check-requirement">{check.requirement}</span>
    </span>
  </li>
);

export const ReleaseStatusCard = ({
  status,
}: ReleaseStatusCardProps): ReactElement => {
  const readiness = deriveReleaseReadiness(status);
  const [filter, setFilter] = React.useState<CheckFilter>("all");
  const visibleChecks = filterChecks(
    releaseCheckCategories.flatMap((category) => readiness.categories[category]),
    filter,
  );
  const visibleCheckSet = new Set(visibleChecks);
  const filterCounts: Readonly<Record<CheckFilter, number>> = {
    all: readiness.counts.total,
    needsAttention: readiness.counts.pending + readiness.counts.failed,
    passed: readiness.counts.passed,
  };

  return (
    <article className="release-card" aria-labelledby="release-title">
      <header className="release-card__header">
        <div>
          <p className="release-card__label">Release readiness</p>
          <h1 id="release-title">{status.releaseName}</h1>
        </div>
        <strong
          className={`release-card__state release-card__state--${readiness.summary}`}
        >
          {summaryLabels[readiness.summary]}
        </strong>
      </header>

      <dl className="release-card__metadata">
        <div>
          <dt>Branch</dt>
          <dd>
            <code>{status.branch}</code>
          </dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>
            <time dateTime={status.updatedAt}>
              {formatUpdatedAt(status.updatedAt)}
            </time>
          </dd>
        </div>
      </dl>

      <section className="release-card__overview" aria-labelledby="readiness-title">
        <div className="release-card__section-heading">
          <h2 id="readiness-title">Readiness review</h2>
          <span>{readiness.counts.total} checks</span>
        </div>
        <dl className="release-card__counts">
          <div>
            <dt>Passed</dt>
            <dd>{readiness.counts.passed}</dd>
          </div>
          <div>
            <dt>Pending</dt>
            <dd>{readiness.counts.pending}</dd>
          </div>
          <div>
            <dt>Failed</dt>
            <dd>{readiness.counts.failed}</dd>
          </div>
        </dl>
        <div className="release-card__blockers" aria-labelledby="blockers-title">
          <h3 id="blockers-title">Blockers</h3>
          {readiness.blockers.length > 0 ? (
            <ol>
              {readiness.blockers.map((check) => (
                <li key={`${check.category}-${check.label}`}>
                  {check.label} — {check.status === "failed" ? "Failed" : "Pending"}
                </li>
              ))}
            </ol>
          ) : (
            <p>None. All checks have passed.</p>
          )}
        </div>
      </section>

      <section className="release-card__check-review" aria-labelledby="checks-title">
        <div className="release-card__section-heading">
          <h2 id="checks-title">Checks</h2>
          <span>{visibleChecks.length} shown</span>
        </div>
        <div className="release-card__filters" aria-label="Filter checks">
          {filters.map(({ label, value }) => (
            <button
              aria-pressed={filter === value}
              className="release-card__filter"
              key={value}
              onClick={() => setFilter(value)}
              type="button"
            >
              {label} <span>{filterCounts[value]}</span>
            </button>
          ))}
        </div>
        <p aria-live="polite" className="release-card__live-status" role="status">
          {visibleChecks.length} {visibleChecks.length === 1 ? "check" : "checks"} shown
        </p>

        <div className="release-card__groups">
          {releaseCheckCategories.map((category) => {
            const checks = readiness.categories[category].filter((check) =>
              visibleCheckSet.has(check),
            );

            return (
              <section
                aria-labelledby={`checks-${category.toLowerCase()}`}
                className="release-card__group"
                key={category}
              >
                <h3 id={`checks-${category.toLowerCase()}`}>{category}</h3>
                <ul className="release-card__checks" aria-label={`${category} checks`}>
                  {checks.length > 0 ? (
                    checks.map((check) => (
                      <CheckRow check={check} key={check.label} />
                    ))
                  ) : (
                    <li className="release-card__empty">
                      No {category.toLowerCase()} checks match this filter.
                    </li>
                  )}
                </ul>
              </section>
            );
          })}
        </div>
      </section>
    </article>
  );
};
