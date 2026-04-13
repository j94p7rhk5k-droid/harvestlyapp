import type { Category, CategoryType } from '@/types';

/**
 * Find the best existing category for an imported transaction.
 *
 * Strategy (in order):
 *   1. Exact case-insensitive name match (any type).
 *   2. Substring match within the same type.
 *   3. Token-overlap match within the same type.
 *   4. Substring or token match across all types (last resort).
 *
 * Returns `null` if no acceptable match exists. Callers must never
 * auto-create a new category when this returns null — surface the
 * unmatched transaction to the user instead.
 */
export function findBestCategoryMatch(
  name: string | undefined,
  type: CategoryType | undefined,
  categories: Category[],
): Category | null {
  if (!name || categories.length === 0) return null;
  const lower = name.toLowerCase().trim();
  if (!lower) return null;

  // 1. Exact case-insensitive match on the given type first, then any type.
  const sameType = type ? categories.filter((c) => c.type === type) : [];
  const otherType = categories.filter((c) => c.type !== type);

  const exactSame = sameType.find((c) => c.name.toLowerCase() === lower);
  if (exactSame) return exactSame;
  const exactAny = categories.find((c) => c.name.toLowerCase() === lower);
  if (exactAny) return exactAny;

  // 2. Substring match within the same type.
  const substrSame = sameType.find((c) => {
    const cn = c.name.toLowerCase();
    return cn.includes(lower) || lower.includes(cn);
  });
  if (substrSame) return substrSame;

  // 3. Token-overlap within the same type.
  const tokens = lower.split(/\s+|[,\-/&]/).filter((t) => t.length >= 3);
  const scoreAgainst = (pool: Category[]): Category | null => {
    if (tokens.length === 0 || pool.length === 0) return null;
    const scored = pool
      .map((c) => {
        const cn = c.name.toLowerCase();
        const hits = tokens.filter((t) => cn.includes(t)).length;
        return { cat: c, score: hits };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored[0]?.cat ?? null;
  };

  const tokenSame = scoreAgainst(sameType);
  if (tokenSame) return tokenSame;

  // 4. Last resort — try across all other types with substring / tokens.
  const substrOther = otherType.find((c) => {
    const cn = c.name.toLowerCase();
    return cn.includes(lower) || lower.includes(cn);
  });
  if (substrOther) return substrOther;

  const tokenOther = scoreAgainst(otherType);
  if (tokenOther) return tokenOther;

  return null;
}
