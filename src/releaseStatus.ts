export type ReleaseCheck = {
  label: string;
  status: "passed" | "pending";
};

export type ReleaseStatus = {
  branch: string;
  checks: readonly ReleaseCheck[];
  releaseName: string;
  updatedAt: string;
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

