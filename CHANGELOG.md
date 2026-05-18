# Changelog

## 0.1.0 — 2026-05-18

Initial public release.

### Added

- `useQueryState(key, parser)` — binds a typed Vue `Ref` to a URL query parameter via Vue Router. Supports `Ref<T>` (with default) and `Ref<T | null>` (without).
- Built-in parsers: `parseAsString`, `parseAsInteger`, `parseAsFloat`, `parseAsBoolean`
- Collection parsers: `parseAsArrayOf(itemParser, separator?)`
- Enum / literal parsers: `parseAsStringLiteral(values)`, `parseAsStringEnum(values)`
- JSON parser: `parseAsJson<T>(parseFn)` — validator-agnostic; pass any `(raw: unknown) => T | null` function (Zod, Valibot, etc.)
- `createParser(config)` — public factory for building custom parsers with the full builder API
- Builder pattern: `.withDefault(value)` and `.withOptions({ mode })` on all parsers
- History mode option: `mode: "replace" | "push"` (defaults to `"replace"`)
