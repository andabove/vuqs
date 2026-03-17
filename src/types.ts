/**
 * Controls how the router updates the URL when the query param changes.
 * Defaults to "replace" to avoid polluting browser history with every keystroke.
 */
export interface QueryStateOptions {
  mode?: "replace" | "push";
}

/**
 * A parser without a default value. The ref it produces is `T | null`,
 * where null means the query param is absent from the URL.
 *
 * Use `.withDefault(value)` to narrow the type to `T` and get a clean URL
 * when the value equals the default.
 */
export interface Parser<T> {
  parse(value: string): T | null;
  serialize(value: T): string;
  withDefault(defaultValue: T): ParserWithDefault<T>;
  withOptions(options: QueryStateOptions): Parser<T>;
  readonly defaultValue: undefined;
  readonly options: QueryStateOptions;
}

/**
 * A parser with a known default value. The ref it produces is `Ref<T>` —
 * never null. When the value equals the default, the query param is removed
 * from the URL, keeping URLs clean.
 */
export interface ParserWithDefault<T> {
  parse(value: string): T | null;
  serialize(value: T): string;
  withDefault(defaultValue: T): ParserWithDefault<T>;
  withOptions(options: QueryStateOptions): ParserWithDefault<T>;
  readonly defaultValue: T;
  readonly options: QueryStateOptions;
}
