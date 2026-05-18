# @andabove/vuqs

Type-safe URL query state for Vue 3 — like `ref`, but stored in the URL.

A Vue 3 port of [nuqs](https://github.com/47ng/nuqs) by François Best.

## Install

```bash
pnpm add @andabove/vuqs
```

**Peer dependencies** — install these if you don't already have them:

```bash
pnpm add vue@^3.5 vue-router@^4 @vueuse/router
```

## Usage

`useQueryState` returns a `Ref` bound to a URL query parameter. Reading the ref gives you the current parsed value; writing the ref updates the URL.

```ts
import { useQueryState, parseAsString } from "@andabove/vuqs";

// Ref<string | null> — null when ?q is absent
const search = useQueryState("q", parseAsString);

// Read
console.log(search.value); // 'hello' or null

// Write — updates the URL automatically
search.value = "hello";

// Remove the param from the URL
search.value = null;
```

### With a default value

Use `.withDefault(value)` to get a `Ref<T>` (never null) and keep URLs clean when the value matches the default:

```ts
import { useQueryState, parseAsInteger } from "@andabove/vuqs";

// Ref<number> — URL is clean when page === 1 (no ?page=1 in the URL)
const page = useQueryState("page", parseAsInteger.withDefault(1));

page.value++; // ?page=2
page.value = 1; // removes ?page from the URL
page.value = null; // also removes ?page, resets to default (1)
```

### History mode

By default, query updates replace the current history entry. Use `mode: "push"` to add a new entry so the back button restores the previous value:

```ts
import { useQueryState, parseAsString, parseAsStringLiteral } from "@andabove/vuqs";

const tab = useQueryState("tab", parseAsString.withOptions({ mode: "push" }));

// Or chain it with a default:
const sort = useQueryState(
  "sort",
  parseAsStringLiteral(["asc", "desc"] as const)
    .withDefault("asc")
    .withOptions({ mode: "push" }),
);
```

## Built-in parsers

| Parser                         | Type      | Notes                                                              |
| ------------------------------ | --------- | ------------------------------------------------------------------ |
| `parseAsString`                | `string`  | Identity — accepts any string                                      |
| `parseAsInteger`               | `number`  | `parseInt` base 10, rounds on serialize                            |
| `parseAsFloat`                 | `number`  | `parseFloat`, full precision                                       |
| `parseAsBoolean`               | `boolean` | Strict: only `"true"` / `"false"`                                  |
| `parseAsStringLiteral(values)` | `Literal` | Validates against a `readonly` array of string literals            |
| `parseAsStringEnum(values)`    | `Enum`    | Validates against a TypeScript string enum                         |
| `parseAsArrayOf(parser, sep?)` | `T[]`     | Comma-separated by default; separator is URI-encoded inside values |
| `parseAsJson(parseFn)`         | `T`       | JSON with validator-agnostic parse function                        |

### `parseAsStringLiteral` example

```ts
import { useQueryState, parseAsStringLiteral } from "@andabove/vuqs";

const colors = ["red", "green", "blue"] as const;

const color = useQueryState("color", parseAsStringLiteral(colors).withDefault("red"));
// Ref<'red' | 'green' | 'blue'>
```

### `parseAsStringEnum` example

```ts
import { useQueryState, parseAsStringEnum } from "@andabove/vuqs";

enum Direction {
  Up = "up",
  Down = "down",
}

const dir = useQueryState("dir", parseAsStringEnum<Direction>(Object.values(Direction)).withDefault(Direction.Up));
```

### `parseAsArrayOf` example

```ts
import { useQueryState, parseAsArrayOf, parseAsInteger } from "@andabove/vuqs";

// ?ids=1,2,3  →  [1, 2, 3]
const ids = useQueryState("ids", parseAsArrayOf(parseAsInteger).withDefault([]));
```

### `parseAsJson` example

`parseAsJson` is validator-agnostic — you supply any `(raw: unknown) => T | null` function. This works with Zod, Valibot, or plain conditionals.

```ts
import { useQueryState, parseAsJson } from "@andabove/vuqs";
import * as v from "valibot";

const schema = v.object({ q: v.string(), page: v.number() });

const filters = useQueryState(
  "filters",
  parseAsJson((raw) => {
    const r = v.safeParse(schema, raw);
    return r.success ? r.output : null;
  }),
);
```

```ts
// With Zod
import { z } from "zod";

const schema = z.object({ q: z.string() });

const filters = useQueryState(
  "filters",
  parseAsJson((raw) => {
    const r = schema.safeParse(raw);
    return r.success ? r.data : null;
  }),
);
```

## Custom parsers

Use `createParser` to build a custom parser that gets the full `.withDefault()` / `.withOptions()` builder API:

```ts
import { createParser, useQueryState } from "@andabove/vuqs";

const parseAsHexColor = createParser({
  parse(query) {
    return /^[0-9a-f]{6}$/i.test(query) ? query : null;
  },
  serialize(value) {
    return value;
  },
});

const color = useQueryState("color", parseAsHexColor.withDefault("ff0000"));
```

## Feature comparison with nuqs

vuqs covers the core use case. Some nuqs features that are React/Next.js specific are not applicable in Vue.

| Feature                                  | vuqs    | nuqs               |
| ---------------------------------------- | ------- | ------------------ |
| `useQueryState` (single key)             | yes     | yes                |
| `useQueryStates` (batched multi-key)     | planned | yes                |
| Custom parsers via `createParser`        | yes     | yes                |
| `parseAsJson` (validator-agnostic)       | yes     | yes (generic cast) |
| History push / replace                   | yes     | yes                |
| `shallow` / server notify                | n/a     | Next.js only       |
| Server cache / `createSearchParamsCache` | n/a     | Next.js only       |
| `createLoader` / `createSerializer`      | planned | yes                |
| `useTransition` loading states           | n/a     | React only         |
| Testing adapter                          | planned | yes                |

## Attribution

Inspired by [nuqs](https://github.com/47ng/nuqs) by [François Best](https://github.com/franky47) (MIT). This is an independent Vue 3 port.

## License

MIT — see [LICENSE](./LICENSE)
