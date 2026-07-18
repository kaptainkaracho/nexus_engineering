// Pagination helpers for list endpoints.
// Centralizes parsing, validation, and clamping so every paginated route
// behaves consistently and safely (no negative offsets, capped page sizes).

export const MAX_PAGE_SIZE = 1000
export const DEFAULT_PAGE_SIZE = 100

export interface PaginationParams {
  limit: number
  offset: number
}

/**
 * Parse `limit` / `offset` from an unknown query value.
 * Defaults: limit=100, offset=0. Clamps limit to [1, MAX_PAGE_SIZE] and
 * offset to >= 0. Throws on non-numeric values so callers can 400.
 */
export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const rawLimit = query.limit
  const rawOffset = query.offset

  let limit = DEFAULT_PAGE_SIZE
  if (rawLimit !== undefined && rawLimit !== null && rawLimit !== '') {
    const parsed = Number(rawLimit)
    if (!Number.isFinite(parsed)) {
      throw new Error('limit must be a number')
    }
    limit = Math.floor(parsed)
  }

  let offset = 0
  if (rawOffset !== undefined && rawOffset !== null && rawOffset !== '') {
    const parsed = Number(rawOffset)
    if (!Number.isFinite(parsed)) {
      throw new Error('offset must be a number')
    }
    offset = Math.floor(parsed)
  }

  if (offset < 0) offset = 0
  if (limit < 1) limit = 1
  if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE

  return { limit, offset }
}

/** Build the standard pagination envelope for a slice of `total` items. */
export function buildPaginationMeta(
  limit: number,
  offset: number,
  total: number,
): { limit: number; offset: number; total: number; hasMore: boolean } {
  return {
    limit,
    offset,
    total,
    hasMore: offset + limit < total,
  }
}

/** Slice an array using validated pagination params (no N+1 — single slice). */
export function paginate<T>(items: T[], { limit, offset }: PaginationParams): T[] {
  return items.slice(offset, offset + limit)
}
