export const singleOrNull = <T>(array: T[]): T | null => {
  return array.length === 1 ? (array[0] ?? null) : null;
};

export const compactMap = <T, U>(
  array: T[],
  callback: (item: T, index: number, array: T[]) => U | null | undefined,
): U[] => {
  return array.map(callback).filter((item) => item != null);
};

export const uniqued = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};
