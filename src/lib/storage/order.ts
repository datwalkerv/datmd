/** Sort key between two neighbours (either may be missing at a list edge). */
export function between(prev?: number, next?: number): number {
  if (prev === undefined && next === undefined) return 0;
  if (prev === undefined) return next! - 1;
  if (next === undefined) return prev + 1;
  return (prev + next) / 2;
}

/**
 * Order for `id` dropped at `targetIndex` of `list` (already sorted, may contain `id` itself).
 * Mirrors dnd-kit's arrayMove: the item lands at targetIndex in the resulting list.
 */
export function orderForDrop(list: { id: string; order: number }[], id: string, targetIndex: number): number {
  const rest = list.filter((d) => d.id !== id);
  const i = Math.max(0, Math.min(targetIndex, rest.length));
  return between(rest[i - 1]?.order, rest[i]?.order);
}
