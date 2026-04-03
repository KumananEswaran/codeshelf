export const FREE_LIMITS = {
  MAX_ITEMS: 50,
  MAX_COLLECTIONS: 3,
} as const;

export const PRO_TYPES = new Set(["file", "image"]);

export function requiresPro(typeName: string): boolean {
  return PRO_TYPES.has(typeName);
}

export function canCreateItem(currentCount: number, isPro: boolean): boolean {
  return isPro || currentCount < FREE_LIMITS.MAX_ITEMS;
}

export function canCreateCollection(
  currentCount: number,
  isPro: boolean
): boolean {
  return isPro || currentCount < FREE_LIMITS.MAX_COLLECTIONS;
}
