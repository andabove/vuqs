import { describe, expect, it } from "vitest";

import { parseAsBoolean, parseAsFloat, parseAsInteger, parseAsString } from "./parsers";

describe("parseAsString", () => {
  it("parses any string as-is", () => {
    expect(parseAsString.parse("hello")).toBe("hello");
    expect(parseAsString.parse("")).toBe("");
  });

  it("serializes to the same string", () => {
    expect(parseAsString.serialize("hello")).toBe("hello");
  });

  it("withDefault returns the default when parse receives empty string", () => {
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
});

describe("parseAsInteger", () => {
  it("parses a valid integer string", () => {
    expect(parseAsInteger.parse("42")).toBe(42);
    expect(parseAsInteger.parse("-1")).toBe(-1);
    expect(parseAsInteger.parse("0")).toBe(0);
  });

  it("returns null for non-integer strings", () => {
    expect(parseAsInteger.parse("abc")).toBeNull();
    expect(parseAsInteger.parse("1.5")).toBe(1);
  });

  it("serializes a number to string", () => {
    expect(parseAsInteger.serialize(42)).toBe("42");
    expect(parseAsInteger.serialize(-1)).toBe("-1");
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

  it("returns null for other strings", () => {
    expect(parseAsBoolean.parse("yes")).toBeNull();
    expect(parseAsBoolean.parse("1")).toBeNull();
    expect(parseAsBoolean.parse("")).toBeNull();
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
