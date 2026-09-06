# Changelog

## 0.1.7 - 2026-09-06

- Fixed the npm build so this package no longer bundles its own copy of
  `@kintools/form-core`; it now depends on the published package instead.

## 0.1.6 - 2026-09-05

- Trimmed the README down to a tagline, a link to kintools.dev/form, and the
  quick-start example (now with a second snippet showing the same form built
  from reusable `<text-field>`/`<submit-button>` elements); dropped the sections
  duplicated by the docs site guides (resolving a field, `watch`,
  `WatchController`, `MultistepController`).

## 0.1.5 - 2026-08-26

- Marked the npm package `sideEffects: false` so bundlers can safely tree-shake
  unused exports.

## 0.1.4 - 2026-08-25

- Fixed the README's `WatchController` example naming its component
  `MyTextField` instead of the canonical `TextField`.

## 0.1.3 - 2026-08-20

- Renamed from `@kin-form/lit` to `@kintools/form-lit`. Now also published to
  npm.

## 0.1.2 - 2026-08-17

- Bump `@kin-form/core` to 0.1.5, which fixes `disabled` not always notifying
  subscribers.

## 0.1.1 - 2026-08-15

- Add a JSR `description` for the package listing.

## 0.1.0 - Initial release
