export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function parseObject(value: unknown): ValidationResult<Record<string, unknown>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, message: "Body must be a JSON object" };
  }
  return { ok: true, data: value as Record<string, unknown> };
}

export function requireFields(obj: Record<string, unknown>, fields: string[]): ValidationResult<Record<string, unknown>> {
  for (const field of fields) {
    if (!(field in obj)) {
      return { ok: false, message: `Missing required field: ${field}` };
    }
  }
  return { ok: true, data: obj };
}
