import { describe, expect, test } from "bun:test";
import { serializeModuleValue } from "../src/server/module-serialization.js";

describe("serializeModuleValue", () => {
  test("preserves values while escaping unsafe generated-module characters", () => {
    const value = "</script>\u2028line\u2029";
    const serialized = serializeModuleValue(value);

    expect(serialized).toBe('"\\u003C\\u002Fscript\\u003E\\u2028line\\u2029"');
    expect(JSON.parse(serialized)).toBe(value);
  });

  test("serializes structured values", () => {
    const serialized = serializeModuleValue({ title: "<Folio>", order: 1 });

    expect(JSON.parse(serialized)).toEqual({ title: "<Folio>", order: 1 });
  });

  test("rejects undefined values", () => {
    expect(() => serializeModuleValue(undefined)).toThrow(
      "Cannot serialize undefined module value",
    );
  });
});
