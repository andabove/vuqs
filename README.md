# vuqs

Monorepo for [@andabove/vuqs](packages/vuqs/) — type-safe URL query state for Vue 3.

## Packages

| Path                                  | Description                          |
| ------------------------------------- | ------------------------------------ |
| [`packages/vuqs`](packages/vuqs/)     | Publishable library                  |
| [`apps/playground`](apps/playground/) | Interactive demo (Vite + Vue Router) |

## Development

```bash
pnpm install
pnpm dev          # start playground at http://localhost:5173
pnpm test         # run library unit tests
pnpm typecheck    # typecheck library + playground
pnpm build        # build library to packages/vuqs/dist
pnpm lint         # oxlint
pnpm fmt:check    # oxfmt (use pnpm fmt to fix)
```

## Playground

The playground imports the library source directly (via Vite alias) so changes hot-reload without rebuilding. Use it to verify query param parsing, defaults, array serialization, and history push mode.

See [packages/vuqs/README.md](packages/vuqs/README.md) for full API documentation.
