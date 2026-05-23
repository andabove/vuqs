import type { Parser, ParserWithDefault } from "./types";
import { useRouteQuery } from "@vueuse/router";
import type { Ref } from "vue";

type RouteQueryValueRaw = null | undefined | string | string[];

/**
 * Normalises the raw query value from Vue Router into a single string or null.
 * Arrays arise when the same key appears multiple times in the URL (?x=a&x=b);
 * we take only the first value in that case.
 */
function resolveRawString(v: RouteQueryValueRaw): string | null {
  if (v === null || v === undefined) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

/**
 * Binds a typed ref to a URL query parameter.
 *
 * When a parser with a default is provided the ref type is `Ref<T>` and the
 * query param is removed from the URL whenever the value equals the default,
 * keeping URLs clean (e.g. `/products` instead of `/products?filter=all`).
 *
 * When no default is provided the ref type is `Ref<T | null>`, where null
 * means the param is absent from the URL.
 *
 * @example
 * // Ref<string | null> — null when ?q is absent
 * const search = useQueryState('q', parseAsString)
 *
 * // Ref<number> — URL is clean when page === 1
 * const page = useQueryState('page', parseAsInteger.withDefault(1))
 */
export function useQueryState<T>(name: string, parser: ParserWithDefault<T>): Ref<T>;
export function useQueryState<T>(name: string, parser: Parser<T>): Ref<T | null>;
export function useQueryState<T>(
  name: string,
  parser: Parser<T> | ParserWithDefault<T>,
): Ref<T | null> {
  const hasDefault = parser.defaultValue !== undefined;
  const defaultValue = hasDefault ? (parser as ParserWithDefault<T>).defaultValue : null;
  const mode = parser.options.mode ?? "replace";

  return useRouteQuery<RouteQueryValueRaw, T | null>(name, null, {
    mode,
    transform: {
      get(v: RouteQueryValueRaw): T | null {
        const str = resolveRawString(v);
        // Absent param → fall back to the parser's default (or null if none).
        if (str === null) return defaultValue;
        // Invalid value → fall back rather than surfacing null to the consumer.
        const parsed = parser.parse(str);
        return parsed ?? defaultValue;
      },
      set(v: T | null): RouteQueryValueRaw {
        // Returning null removes the param from the URL entirely.
        if (v === null) return null;
        // Setting back to the default produces a clean URL with no param.
        if (hasDefault && parser.eq(v, defaultValue as T)) return null;
        return parser.serialize(v);
      },
    },
  }) as Ref<T | null>;
}
