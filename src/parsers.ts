import type { Parser, ParserWithDefault, QueryStateOptions } from "./types";
import type { GenericSchema, InferOutput } from "valibot";
import * as v from "valibot";

interface ParserConfig<T> {
  parse: (value: string) => T | null;
  serialize: (value: T) => string;
  eq?: (a: T, b: T) => boolean;
}

/**
 * Creates a typed parser you can pass to `useQueryState`.
 * Exported so consumers can build custom parsers.
 */
export function createParser<T>(config: ParserConfig<T>, opts: QueryStateOptions = {}): Parser<T> {
  const eq = config.eq ?? ((a, b) => a === b);
  return {
    parse: config.parse,
    serialize: config.serialize,
    eq,
    defaultValue: undefined,
    options: opts,
    withDefault(defaultValue: T): ParserWithDefault<T> {
      return createParserWithDefault(config, defaultValue, opts);
    },
    withOptions(options: QueryStateOptions): Parser<T> {
      return createParser(config, { ...opts, ...options });
    },
  };
}

function createParserWithDefault<T>(
  config: ParserConfig<T>,
  defaultVal: T,
  opts: QueryStateOptions = {},
): ParserWithDefault<T> {
  const eq = config.eq ?? ((a, b) => a === b);
  return {
    parse: config.parse,
    serialize: config.serialize,
    eq,
    defaultValue: defaultVal,
    options: opts,
    withDefault(defaultValue: T): ParserWithDefault<T> {
      return createParserWithDefault(config, defaultValue, opts);
    },
    withOptions(options: QueryStateOptions): ParserWithDefault<T> {
      return createParserWithDefault(config, defaultVal, { ...opts, ...options });
    },
  };
}

// ---------------------------------------------------------------------------
// Primitive parsers
// ---------------------------------------------------------------------------

/** Accepts any string as-is. A noop for serialization. */
export const parseAsString: Parser<string> = createParser({
  parse: (value) => value,
  serialize: (value) => value,
});

/** Parses with `parseInt` (base 10). Returns null for non-numeric strings. */
export const parseAsInteger: Parser<number> = createParser({
  parse: (value) => {
    const n = parseInt(value, 10);
    return isNaN(n) ? null : n;
  },
  serialize: (value) => String(Math.round(value)),
});

/** Parses with `parseFloat`. Returns null for non-numeric strings. */
export const parseAsFloat: Parser<number> = createParser({
  parse: (value) => {
    const n = parseFloat(value);
    return isNaN(n) ? null : n;
  },
  serialize: (value) => String(value),
});

/**
 * Parses "true" and "false" only. Any other string (e.g. "1", "yes")
 * returns null rather than coercing, keeping the URL as the source of truth.
 */
export const parseAsBoolean: Parser<boolean> = createParser({
  parse: (value) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return null;
  },
  serialize: (value) => String(value),
});

// ---------------------------------------------------------------------------
// String literal / enum parsers
// ---------------------------------------------------------------------------

/**
 * Validates the query value against a readonly list of string literals.
 * Returns null if the value is not in the list.
 *
 * @example
 * const sort = useQueryState('sort', parseAsStringLiteral(['asc', 'desc'] as const))
 */
export function parseAsStringLiteral<const Literal extends string>(validValues: readonly Literal[]): Parser<Literal> {
  return createParser<Literal>({
    parse: (query) => (validValues.includes(query as Literal) ? (query as Literal) : null),
    serialize: (value) => value,
  });
}

/**
 * Validates the query value against a TypeScript string enum.
 * Returns null if the value is not a member of the enum.
 *
 * @example
 * enum Status { Active = 'active', Inactive = 'inactive' }
 * const status = useQueryState('status', parseAsStringEnum<Status>(Object.values(Status)))
 */
export function parseAsStringEnum<Enum extends string>(validValues: Enum[]): Parser<Enum> {
  return parseAsStringLiteral(validValues as readonly Enum[]) as Parser<Enum>;
}

// ---------------------------------------------------------------------------
// JSON parser
// ---------------------------------------------------------------------------

/**
 * Serializes/deserializes a JSON value in the query string, validated
 * against a Valibot schema. Returns null if the string is not valid JSON or
 * does not satisfy the schema.
 *
 * Uses deep equality (`JSON.stringify` comparison) for the `eq` check so
 * that setting to the default value still cleans the URL correctly.
 *
 * @example
 * const filter = useQueryState('filter', parseAsJson(v.object({ q: v.string() })))
 */
export function parseAsJson<TSchema extends GenericSchema>(schema: TSchema): Parser<InferOutput<TSchema>> {
  type T = InferOutput<TSchema>;
  return createParser<T>({
    parse: (str) => {
      try {
        const obj: unknown = JSON.parse(str);
        const result = v.safeParse(schema, obj);
        return result.success ? result.output : null;
      } catch {
        return null;
      }
    },
    serialize: (value) => JSON.stringify(value),
    eq: (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b),
  });
}

// ---------------------------------------------------------------------------
// Array parser
// ---------------------------------------------------------------------------

/**
 * Encodes an array as a comma-separated query string value.
 * The separator character is URI-encoded inside item values so it is safe
 * to use in items that contain the separator character.
 *
 * An empty array serializes to an empty string, and an empty string parses
 * back to an empty array.
 *
 * @example
 * const tags = useQueryState('tags', parseAsArrayOf(parseAsString))
 * // ?tags=a,b,c  →  ['a', 'b', 'c']
 */
export function parseAsArrayOf<ItemType>(
  itemParser: Parser<ItemType> | ParserWithDefault<ItemType>,
  separator = ",",
): Parser<ItemType[]> {
  const encodedSeparator = encodeURIComponent(separator);
  return createParser<ItemType[]>({
    parse: (query) => {
      if (query === "") return [];
      return query
        .split(separator)
        .map((item) => itemParser.parse(item.replaceAll(encodedSeparator, separator)))
        .filter((value): value is ItemType => value !== null);
    },
    serialize: (values) =>
      values.map((value) => itemParser.serialize(value).replaceAll(separator, encodedSeparator)).join(separator),
    eq: (a, b) => {
      if (a === b) return true;
      if (a.length !== b.length) return false;
      const itemEq = itemParser.eq.bind(itemParser);
      return a.every((value, index) => itemEq(value, b[index]!));
    },
  });
}
