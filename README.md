# Labor0 release-readiness review

A small Rsbuild and React application for reviewing whether a release is ready
to ship. It presents the release checks and makes their status available both
visually and to assistive technology.

## Readiness model

Checks are grouped into Build, Test, and Security. Each check is either
required or optional. Required checks must pass for the release to be ready;
optional checks provide useful signal but do not block readiness. A check can
be passed, pending, or failed. A failed required check is a deterministic
blocker, while pending required work remains in progress.

`deriveReleaseReadiness` rolls the checks up to `ready`, `inProgress`, or
`blocked`: an empty check set is `ready`; failed required checks produce
`blocked`; otherwise pending required checks produce `inProgress`; all other
sets are `ready`.

The All, Needs attention, and Passed filters show the corresponding checks and
communicate both the visible count and the announced count, so the filtered
view is clear visually and for screen-reader users.

## Development

```sh
pnpm install
pnpm dev
```

Run `pnpm typecheck`, `pnpm test`, and `pnpm build` before opening a pull
request.
