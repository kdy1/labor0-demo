# Labor0 release readiness demo

A small Rsbuild and React application for reviewing release checks. Readiness
is derived only from required checks: a required failure blocks the release,
and a required pending check leaves it in progress. Optional checks remain
visible in the review but never block readiness.

The card groups checks by Build, Test, and Security; exposes native-button
filters with announced result counts; and includes text labels alongside color
status cues.

## Development

```sh
pnpm install
pnpm dev
```

Run `pnpm typecheck`, `pnpm test`, and `pnpm build` before opening a pull
request. The test suite includes the readiness truth table, deterministic
blocker ordering, and accessible filter behavior.
