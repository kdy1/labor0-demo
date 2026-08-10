import type { ReactElement } from "react";
import * as React from "react";
import {
  classifyReleaseFreshness,
  parseReleaseTimestamp,
  type ReleaseStatus,
} from "./releaseStatus";

type ReleaseStatusCardProps = {
  referenceTime: Date;
  status: ReleaseStatus;
};

const formatUpdatedAt = (updatedAt: Date): string =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(updatedAt);

export const ReleaseStatusCard = ({
  referenceTime,
  status,
}: ReleaseStatusCardProps): ReactElement => {
  const updatedAt = parseReleaseTimestamp(status.updatedAt);
  const freshness = classifyReleaseFreshness(status.updatedAt, referenceTime);

  return (
    <article className="release-card" aria-labelledby="release-title">
      <header className="release-card__header">
        <div>
          <p className="release-card__label">Release status</p>
          <h1 id="release-title">{status.releaseName}</h1>
        </div>
        <strong className="release-card__state">Ready for review</strong>
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
          <dd className="release-card__updated">
            {updatedAt ? (
              <time dateTime={updatedAt.toISOString()}>
                {formatUpdatedAt(updatedAt)}
              </time>
            ) : (
              <span>Not available</span>
            )}
            <span className="release-card__freshness">{freshness}</span>
          </dd>
        </div>
      </dl>

      <section aria-labelledby="checks-title">
        <div className="release-card__section-heading">
          <h2 id="checks-title">Required checks</h2>
          <span>{status.checks.length} checks</span>
        </div>
        <ul className="release-card__checks">
          {status.checks.map((check) => (
            <li key={check.label}>
              <span>{check.label}</span>
              <strong>{check.status === "passed" ? "Passed" : "Pending"}</strong>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
};
