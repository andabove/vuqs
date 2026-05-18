import * as v from "valibot";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { parseAsBoolean, parseAsInteger, parseAsJson, parseAsString } from "./parsers";
import { useQueryState } from "./useQueryState";

// ---------------------------------------------------------------------------
// Mock @vueuse/router
//
// We capture the arguments passed to useRouteQuery on each call so we can
// inspect the transform functions independently of Vue Router internals.
// ---------------------------------------------------------------------------

interface CapturedTransform {
  name: string;
  defaultValue: unknown;
  options: {
    mode: string;
    transform: {
      get: (v: unknown) => unknown;
      set: (v: unknown) => unknown;
    };
  };
}

let lastCall: CapturedTransform;

vi.mock("@vueuse/router", () => ({
  useRouteQuery: vi.fn((name: string, defaultValue: unknown, options: CapturedTransform["options"]) => {
    lastCall = { name, defaultValue, options };
    return ref(options.transform.get(null));
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// transform.get — reading from the URL
// ---------------------------------------------------------------------------

describe("useQueryState transform.get", () => {
  it("returns null when the param is absent (null)", () => {
    useQueryState("q", parseAsString);
    expect(lastCall.options.transform.get(null)).toBeNull();
  });

  it("returns null when the param is absent (undefined)", () => {
    useQueryState("q", parseAsString);
    expect(lastCall.options.transform.get(undefined)).toBeNull();
  });

  it("returns the parsed value for a valid string", () => {
    useQueryState("q", parseAsString);
    expect(lastCall.options.transform.get("hello")).toBe("hello");
  });

  it("returns the parsed integer for a valid string", () => {
    useQueryState("page", parseAsInteger);
    expect(lastCall.options.transform.get("42")).toBe(42);
  });

  it("returns null when the value cannot be parsed", () => {
    useQueryState("page", parseAsInteger);
    expect(lastCall.options.transform.get("abc")).toBeNull();
  });

  it("takes the first item when the raw value is an array", () => {
    useQueryState("q", parseAsString);
    expect(lastCall.options.transform.get(["first", "second"])).toBe("first");
  });

  it("returns null when the raw value is an empty array", () => {
    useQueryState("q", parseAsString);
    expect(lastCall.options.transform.get([])).toBeNull();
  });

  describe("with a default value", () => {
    it("returns the default when the param is absent", () => {
      useQueryState("page", parseAsInteger.withDefault(1));
      expect(lastCall.options.transform.get(null)).toBe(1);
    });

    it("returns the default when the value cannot be parsed", () => {
      useQueryState("page", parseAsInteger.withDefault(1));
      expect(lastCall.options.transform.get("abc")).toBe(1);
    });

    it("returns the parsed value when it is valid", () => {
      useQueryState("page", parseAsInteger.withDefault(1));
      expect(lastCall.options.transform.get("5")).toBe(5);
    });
  });
});

// ---------------------------------------------------------------------------
// transform.set — writing to the URL
// ---------------------------------------------------------------------------

describe("useQueryState transform.set", () => {
  it("returns null when setting null (removes the param)", () => {
    useQueryState("q", parseAsString);
    expect(lastCall.options.transform.set(null)).toBeNull();
  });

  it("returns the serialized string for a valid value", () => {
    useQueryState("q", parseAsString);
    expect(lastCall.options.transform.set("hello")).toBe("hello");
  });

  it("returns the serialized number string", () => {
    useQueryState("page", parseAsInteger);
    expect(lastCall.options.transform.set(42)).toBe("42");
  });

  describe("with a default value", () => {
    it("returns null when setting the value to the default (cleans the URL)", () => {
      useQueryState("page", parseAsInteger.withDefault(1));
      expect(lastCall.options.transform.set(1)).toBeNull();
    });

    it("returns null when explicitly setting null", () => {
      useQueryState("page", parseAsInteger.withDefault(1));
      expect(lastCall.options.transform.set(null)).toBeNull();
    });

    it("returns serialized string for a non-default value", () => {
      useQueryState("page", parseAsInteger.withDefault(1));
      expect(lastCall.options.transform.set(5)).toBe("5");
    });
  });

  describe("with an object default using deep equality (parseAsJson)", () => {
    it("returns null when setting a value deeply equal to the default", () => {
      const schema = v.object({ active: v.boolean() });
      const parseFn = (raw: unknown) => {
        const r = v.safeParse(schema, raw);
        return r.success ? r.output : null;
      };
      const parser = parseAsJson(parseFn).withDefault({ active: false });
      useQueryState("filter", parser);
      // A different object reference with the same shape should still clean the URL
      expect(lastCall.options.transform.set({ active: false })).toBeNull();
    });

    it("returns serialized JSON for a value that differs from the default", () => {
      const schema = v.object({ active: v.boolean() });
      const parseFn = (raw: unknown) => {
        const r = v.safeParse(schema, raw);
        return r.success ? r.output : null;
      };
      const parser = parseAsJson(parseFn).withDefault({ active: false });
      useQueryState("filter", parser);
      expect(lastCall.options.transform.set({ active: true })).toBe('{"active":true}');
    });
  });
});

// ---------------------------------------------------------------------------
// useRouteQuery call arguments
// ---------------------------------------------------------------------------

describe("useQueryState call arguments", () => {
  it("passes the param name to useRouteQuery", () => {
    useQueryState("myParam", parseAsString);
    expect(lastCall.name).toBe("myParam");
  });

  it("uses replace mode by default", () => {
    useQueryState("q", parseAsString);
    expect(lastCall.options.mode).toBe("replace");
  });

  it("uses push mode when specified via withOptions", () => {
    useQueryState("q", parseAsString.withOptions({ mode: "push" }));
    expect(lastCall.options.mode).toBe("push");
  });

  it("uses push mode when specified on a parser with default", () => {
    useQueryState("q", parseAsString.withDefault("foo").withOptions({ mode: "push" }));
    expect(lastCall.options.mode).toBe("push");
  });

  it("passes null as the raw default to useRouteQuery", () => {
    useQueryState("q", parseAsString);
    expect(lastCall.defaultValue).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// returned ref initial value
// ---------------------------------------------------------------------------

describe("useQueryState returned ref", () => {
  it("initial value is null when param is absent and there is no default", () => {
    const state = useQueryState("q", parseAsString);
    expect(state.value).toBeNull();
  });

  it("initial value is the default when param is absent and a default is set", () => {
    const state = useQueryState("page", parseAsInteger.withDefault(1));
    expect(state.value).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// resolveRawString edge cases (tested via transform.get)
// ---------------------------------------------------------------------------

describe("resolveRawString (via transform.get)", () => {
  it("null → null", () => {
    useQueryState("q", parseAsBoolean);
    expect(lastCall.options.transform.get(null)).toBeNull();
  });

  it("undefined → null", () => {
    useQueryState("q", parseAsBoolean);
    expect(lastCall.options.transform.get(undefined)).toBeNull();
  });

  it("string → parsed directly", () => {
    useQueryState("q", parseAsBoolean);
    expect(lastCall.options.transform.get("true")).toBe(true);
  });

  it("string[] → uses first element", () => {
    useQueryState("q", parseAsBoolean);
    expect(lastCall.options.transform.get(["false", "true"])).toBe(false);
  });

  it("empty string[] → null", () => {
    useQueryState("q", parseAsBoolean);
    expect(lastCall.options.transform.get([])).toBeNull();
  });
});
