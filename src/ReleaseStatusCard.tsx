import type { ReactElement } from "react";
import * as React from "react";
import {
  deriveReleaseReadiness,
  type ReleaseCheckStatus,
  type ReleaseReadinessOutcome,
  type ReleaseStatus,
} from "./releaseStatus";

type ReleaseStatusCardProps = {
  status: ReleaseStatus;
};

const formatUpdatedAt = (updatedAt: string): string =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(updatedAt));

const outcomeLabels: Readonly<Record<ReleaseReadinessOutcome, string>> = {
  ready: "Ready",
  inProgress: "In progress",
  blocked: "Blocked",
};

const checkStatusLabels: Readonly<Record<ReleaseCheckStatus, string>> = {
  passed: "Passed",
  pending: "Pending",
  failed: "Failed",
};

export const ReleaseStatusCard = ({
  status,
}: ReleaseStatusCardProps): ReactElement => {
  const readiness = deriveReleaseReadiness(status.checks);

  return (
    <article className="release-card" aria-labelledby="release-title">
      <header className="release-card__header">
        <div>
          <p className="release-card__label">Release status</p>
          <h1 id="release-title">{status.releaseName}</h1>
        </div>
        <strong className="release-card__state">
          {outcomeLabels[readiness.outcome]}
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

      <section aria-labelledby="checks-title">
        <div className="release-card__section-heading">
          <h2 id="checks-title">Release checks</h2>
          <span>{readiness.counts.total} checks</span>
        </div>
        <ul className="release-card__checks">
          {status.checks.map((check) => (
            <li key={`${check.category}-${check.label}`}>
              <span>
                {check.label} ({check.category},{" "}
                {check.required ? "required" : "optional"})
              </span>
              <strong>{checkStatusLabels[check.status]}</strong>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
};
