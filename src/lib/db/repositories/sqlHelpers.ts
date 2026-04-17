export function inClause(
  values: ReadonlyArray<string | number>,
  startAt = 1
): { sql: string; params: Array<string | number> } {
  if (values.length === 0) {
    return { sql: "(NULL)", params: [] };
  }
  const placeholders = values.map((_, i) => `$${startAt + i}`).join(", ");
  return { sql: `(${placeholders})`, params: [...values] };
}
