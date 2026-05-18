import * as v from "valibot";
import { describe, expect, it } from "vitest";

import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsFloat,
  parseAsInteger,
  parseAsJson,
  parseAsString,
  parseAsStringEnum,
  parseAsStringLiteral,
} from "./parsers";

describe("parseAsString", () => {
  it("parses any string as-is", () => {
    expect(parseAsString.parse("hello")).toBe("hello");
    expect(parseAsString.parse("")).toBe("");
  });

  it("serializes to the same string", () => {
    expect(parseAsString.serialize("hello")).toBe("hello");
  });

  it("withDefault sets defaultValue", () => {
    const parser = parseAsString.withDefault("foo");
    expect(parser.defaultValue).toBe("foo");
    expect(parser.parse("bar")).toBe("bar");
  });

  it("withOptions sets mode", () => {
    const parser = parseAsString.withOptions({ mode: "push" });
    expect(parser.options.mode).toBe("push");
  });

  it("chaining withDefault then withOptions preserves both", () => {
    const parser = parseAsString.withDefault("foo").withOptions({ mode: "push" });
    expect(parser.defaultValue).toBe("foo");
    expect(parser.options.mode).toBe("push");
  });

  it("chaining withOptions does not reset previously set options", () => {
    const parser = parseAsString.withOptions({ mode: "push" }).withOptions({});
    expect(parser.options.mode).toBe("push");
  });

  it("chaining withOptions merges new options over old ones", () => {
    const parser = parseAsString.withOptions({ mode: "replace" }).withOptions({ mode: "push" });
    expect(parser.options.mode).toBe("push");
  });

  it("uses referential equality by default", () => {
    expect(parseAsString.eq("a", "a")).toBe(true);
    expect(parseAsString.eq("a", "b")).toBe(false);
  });
});

describe("parseAsInteger", () => {
  it("parses a valid integer string", () => {
    expect(parseAsInteger.parse("42")).toBe(42);
    expect(parseAsInteger.parse("-1")).toBe(-1);
    expect(parseAsInteger.parse("0")).toBe(0);
  });

  it("returns null for empty string", () => {
    expect(parseAsInteger.parse("")).toBeNull();
  });

  it("returns null for non-numeric strings", () => {
    expect(parseAsInteger.parse("abc")).toBeNull();
  });

  it("truncates float strings to integer", () => {
    expect(parseAsInteger.parse("3.14")).toBe(3);
    expect(parseAsInteger.parse("3,14")).toBe(3);
  });

  it("serializes a number to string", () => {
    expect(parseAsInteger.serialize(42)).toBe("42");
    expect(parseAsInteger.serialize(-1)).toBe("-1");
  });

  it("rounds when serializing a float", () => {
    expect(parseAsInteger.serialize(3.14)).toBe("3");
    expect(parseAsInteger.serialize(3.7)).toBe("4");
    expect(parseAsInteger.serialize(-1.5)).toBe("-1");
  });

  it("withDefault sets defaultValue", () => {
    const parser = parseAsInteger.withDefault(1);
    expect(parser.defaultValue).toBe(1);
  });
});

describe("parseAsFloat", () => {
  it("parses a valid float string", () => {
    expect(parseAsFloat.parse("3.14")).toBeCloseTo(3.14);
    expect(parseAsFloat.parse("0")).toBe(0);
    expect(parseAsFloat.parse("-2.5")).toBe(-2.5);
  });

  it("returns null for empty string", () => {
    expect(parseAsFloat.parse("")).toBeNull();
  });

  it("returns null for non-numeric strings", () => {
    expect(parseAsFloat.parse("abc")).toBeNull();
  });

  it("serializes a float to string", () => {
    expect(parseAsFloat.serialize(3.14)).toBe("3.14");
  });
});

describe("parseAsBoolean", () => {
  it("parses 'true' to true", () => {
    expect(parseAsBoolean.parse("true")).toBe(true);
  });

  it("parses 'false' to false", () => {
    expect(parseAsBoolean.parse("false")).toBe(false);
  });

  it("returns null for empty string", () => {
    expect(parseAsBoolean.parse("")).toBeNull();
  });

  it("returns null for other strings (strict mode)", () => {
    expect(parseAsBoolean.parse("yes")).toBeNull();
    expect(parseAsBoolean.parse("1")).toBeNull();
    expect(parseAsBoolean.parse("TRUE")).toBeNull();
    expect(parseAsBoolean.parse("False")).toBeNull();
  });

  it("serializes true/false to string", () => {
    expect(parseAsBoolean.serialize(true)).toBe("true");
    expect(parseAsBoolean.serialize(false)).toBe("false");
  });

  it("withDefault sets defaultValue", () => {
    const parser = parseAsBoolean.withDefault(false);
    expect(parser.defaultValue).toBe(false);
  });
});

describe("parseAsStringLiteral", () => {
  const parser = parseAsStringLiteral(["asc", "desc"] as const);

  it("parses a valid literal", () => {
    expect(parser.parse("asc")).toBe("asc");
    expect(parser.parse("desc")).toBe("desc");
  });

  it("returns null for values not in the list", () => {
    expect(parser.parse("")).toBeNull();
    expect(parser.parse("ASC")).toBeNull();
    expect(parser.parse("random")).toBeNull();
  });

  it("serializes to string", () => {
    expect(parser.serialize("asc")).toBe("asc");
    expect(parser.serialize("desc")).toBe("desc");
  });

  it("withDefault sets defaultValue", () => {
    const withDef = parser.withDefault("asc");
    expect(withDef.defaultValue).toBe("asc");
  });
});

describe("parseAsStringEnum", () => {
  enum Direction {
    Asc = "asc",
    Desc = "desc",
  }

  const parser = parseAsStringEnum<Direction>(Object.values(Direction));

  it("parses a valid enum value", () => {
    expect(parser.parse("asc")).toBe("asc");
    expect(parser.parse("desc")).toBe("desc");
  });

  it("returns null for values not in the enum", () => {
    expect(parser.parse("")).toBeNull();
    expect(parser.parse("ASC")).toBeNull();
    expect(parser.parse("random")).toBeNull();
  });

  it("serializes to string", () => {
    expect(parser.serialize(Direction.Asc)).toBe("asc");
    expect(parser.serialize(Direction.Desc)).toBe("desc");
  });

  it("withDefault sets defaultValue", () => {
    const withDef = parser.withDefault(Direction.Asc);
    expect(withDef.defaultValue).toBe("asc");
  });
});

describe("parseAsJson", () => {
  const schema = v.object({ foo: v.string(), bar: v.number() });
  const parseFn = (raw: unknown) => {
    const r = v.safeParse(schema, raw);
    return r.success ? r.output : null;
  };
  const parser = parseAsJson(parseFn);

  it("parses valid JSON matching the schema", () => {
    expect(parser.parse('{"foo":"abc","bar":42}')).toEqual({ foo: "abc", bar: 42 });
  });

  it("returns null for empty string", () => {
    expect(parser.parse("")).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parser.parse("not-json")).toBeNull();
  });

  it("returns null when JSON does not satisfy the schema", () => {
    expect(parser.parse('{"foo":"abc","bar":"not-a-number"}')).toBeNull();
  });

  it("serializes to JSON string", () => {
    expect(parser.serialize({ foo: "abc", bar: 42 })).toBe('{"foo":"abc","bar":42}');
  });

  it("uses deep equality for eq", () => {
    expect(parser.eq({ foo: "a", bar: 1 }, { foo: "a", bar: 1 })).toBe(true);
    expect(parser.eq({ foo: "a", bar: 1 }, { foo: "b", bar: 1 })).toBe(false);
  });

  it("withDefault sets defaultValue", () => {
    const def = { foo: "default", bar: 0 };
    const withDef = parser.withDefault(def);
    expect(withDef.defaultValue).toEqual(def);
  });
});

describe("parseAsArrayOf", () => {
  const parser = parseAsArrayOf(parseAsString);

  it("parses a comma-separated string into an array", () => {
    expect(parser.parse("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("parses an empty string to an empty array", () => {
    expect(parser.parse("")).toEqual([]);
  });

  it("serializes an array to a comma-separated string", () => {
    expect(parser.serialize(["a", "b", "c"])).toBe("a,b,c");
  });

  it("serializes an empty array to empty string", () => {
    expect(parser.serialize([])).toBe("");
  });

  it("encodes the separator character inside item values", () => {
    expect(parser.serialize(["a", ",", "b"])).toBe("a,%2C,b");
    expect(parser.parse("a,%2C,b")).toEqual(["a", ",", "b"]);
  });

  it("filters out items that fail to parse", () => {
    const intParser = parseAsArrayOf(parseAsInteger);
    expect(intParser.parse("1,abc,3")).toEqual([1, 3]);
  });

  it("works with a custom separator", () => {
    const pipedParser = parseAsArrayOf(parseAsString, "|");
    expect(pipedParser.parse("a|b|c")).toEqual(["a", "b", "c"]);
    expect(pipedParser.serialize(["a", "b", "c"])).toBe("a|b|c");
  });

  it("uses element-wise equality for eq", () => {
    expect(parser.eq(["a", "b"], ["a", "b"])).toBe(true);
    expect(parser.eq(["a", "b"], ["a", "c"])).toBe(false);
    expect(parser.eq(["a"], ["a", "b"])).toBe(false);
    expect(parser.eq([], [])).toBe(true);
  });

  it("withDefault sets defaultValue", () => {
    const withDef = parser.withDefault([]);
    expect(withDef.defaultValue).toEqual([]);
  });
});
