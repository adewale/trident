/** Node 24 readline treats literal U+2028/U+2029 as separators. Escape them so
 * a Unicode source remains exactly one request in every worker implementation. */
export const wireLine = (value: unknown): string => JSON.stringify(value).replace(/[\u2028\u2029]/g, c => `\\u${c.charCodeAt(0).toString(16)}`) + '\n'
