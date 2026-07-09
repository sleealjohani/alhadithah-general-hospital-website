export function localValue<T extends string | number | boolean>(key: string, fallback: T): T {
  const value = localStorage.getItem(key);
  if (value === null) return fallback;
  if (typeof fallback === "number") return Number(value) as T;
  if (typeof fallback === "boolean") return (value === "true") as T;
  return value as T;
}
