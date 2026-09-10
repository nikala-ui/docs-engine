const unsafeJavaScriptCharacters: Record<string, string> = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\u005C",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "\t": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

/**
 * Serialize a value for inclusion in a generated JavaScript module.
 * JSON.stringify alone does not escape characters that can be interpreted as
 * markup or JavaScript separators when generated code is embedded elsewhere.
 */
export function serializeModuleValue(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new TypeError("Cannot serialize undefined module value");
  }

  return serialized.replace(/[<>\/\b\f\n\r\t\0\u2028\u2029]/g, (character) =>
    unsafeJavaScriptCharacters[character],
  );
}
