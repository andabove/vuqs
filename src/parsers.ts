import type { Parser, ParserWithDefault, QueryStateOptions } from "./types";

/**
 * Internal factory. Each call returns a new immutable parser object so that
 * `.withDefault()` and `.withOptions()` can be chained without mutating the
 * original parser.
 */
function createParser<T>(
  parseFn: (value: string) => T | null,
  serializeFn: (value: T) => string,
  opts: QueryStateOptions = {},
): Parser<T> {
  return {
    parse: parseFn,
    serialize: serializeFn,
    defaultValue: undefined,
    options: opts,
    withDefault(defaultValue: T): ParserWithDefault<T> {
      return createParserWithDefault(parseFn, serializeFn, defaultValue, opts);
    },
    withOptions(options: QueryStateOptions): Parser<T> {
      return createParser(parseFn, serializeFn, { ...opts, ...options });
    },
  };
}

function createParserWithDefault<T>(
  parseFn: (value: string) => T | null,
  serializeFn: (value: T) => string,
  defaultVal: T,
  opts: QueryStateOptions = {},
): ParserWithDefault<T> {
  return {
    parse: parseFn,
    serialize: serializeFn,
    defaultValue: defaultVal,
    options: opts,
    withDefault(defaultValue: T): ParserWithDefault<T> {
      return createParserWithDefault(parseFn, serializeFn, defaultValue, opts);
    },
    withOptions(options: QueryStateOptions): ParserWithDefault<T> {
      return createParserWithDefault(parseFn, serializeFn, defaultVal, { ...opts, ...options });
    },
  };
}

/** Accepts any string as-is. A noop for serialization. */
export const parseAsString: Parser<string> = createParser(
  (v) => v,
  (v) => v,
);

/** Parses with `parseInt` (base 10). Returns null for non-numeric strings. */
export const parseAsInteger: Parser<number> = createParser(
  (v) => {
    const n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  },
  (v) => String(v),
);

/** Parses with `parseFloat`. Returns null for non-numeric strings. */
export const parseAsFloat: Parser<number> = createParser(
  (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  },
  (v) => String(v),
);

/**
 * Parses "true" and "false" only. Any other string (e.g. "1", "yes")
 * returns null rather than coercing, keeping the URL as the source of truth.
 */
export const parseAsBoolean: Parser<boolean> = createParser(
  (v) => {
    if (v === "true") return true;
    if (v === "false") return false;
    return null;
  },
  (v) => String(v),
);
