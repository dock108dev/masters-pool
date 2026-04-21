import type { ClubConfig, GolferBucket } from '../types/domain';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  if (!email.trim()) {
    errors.push('Email is required.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Please enter a valid email address.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateDisplayName(name: string): ValidationResult {
  const errors: string[] = [];
  const trimmed = name.trim();
  if (!trimmed) {
    errors.push('Display name is required.');
  } else if (trimmed.length < 2) {
    errors.push('Display name must be at least 2 characters.');
  } else if (trimmed.length > 100) {
    errors.push('Display name must be 100 characters or fewer.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateRvccPicks(
  selectedDgIds: number[],
  config: ClubConfig
): ValidationResult {
  const errors: string[] = [];
  if (selectedDgIds.length !== config.pickCount) {
    errors.push(`You must select exactly ${config.pickCount} golfers. Currently selected: ${selectedDgIds.length}.`);
  }
  const unique = new Set(selectedDgIds);
  if (unique.size !== selectedDgIds.length) {
    errors.push('Duplicate golfer selections are not allowed.');
  }
  return { valid: errors.length === 0, errors };
}

function buildGolferBucketMap(buckets: GolferBucket[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const bucket of buckets) {
    for (const g of bucket.golfers) {
      map.set(g.dg_id, bucket.bucket_number);
    }
  }
  return map;
}

export function validateCrestmontPicks(
  selectedDgIds: number[],
  buckets: GolferBucket[],
  config: ClubConfig
): ValidationResult {
  const errors: string[] = [];

  if (selectedDgIds.length !== config.pickCount) {
    errors.push(`You must select exactly ${config.pickCount} golfers (1 from each bucket). Currently selected: ${selectedDgIds.length}.`);
  }

  const golferBucketMap = buildGolferBucketMap(buckets);

  const bucketsUsed = new Set<number>();
  for (const dgId of selectedDgIds) {
    const bucketNumber = golferBucketMap.get(dgId);
    if (bucketNumber === undefined) {
      errors.push(`Golfer with dg_id ${dgId} not found in any bucket.`);
    } else if (bucketsUsed.has(bucketNumber)) {
      const bucket = buckets.find((b) => b.bucket_number === bucketNumber);
      errors.push(`Only 1 golfer may be selected from ${bucket?.label ?? `Bucket ${bucketNumber}`}.`);
    } else {
      bucketsUsed.add(bucketNumber);
    }
  }

  const unique = new Set(selectedDgIds);
  if (unique.size !== selectedDgIds.length) {
    errors.push('Duplicate golfer selections are not allowed.');
  }

  return { valid: errors.length === 0, errors };
}

export function validateEntryForm(
  email: string,
  displayName: string,
  selectedDgIds: number[],
  config: ClubConfig,
  buckets: GolferBucket[] | null,
): ValidationResult {
  const allErrors: string[] = [];

  const emailResult = validateEmail(email);
  allErrors.push(...emailResult.errors);

  const nameResult = validateDisplayName(displayName);
  allErrors.push(...nameResult.errors);

  if (config.useBuckets && buckets) {
    const picksResult = validateCrestmontPicks(selectedDgIds, buckets, config);
    allErrors.push(...picksResult.errors);
  } else {
    const picksResult = validateRvccPicks(selectedDgIds, config);
    allErrors.push(...picksResult.errors);
  }

  return { valid: allErrors.length === 0, errors: allErrors };
}

/** Like validateEntryForm but email is optional — only format-checked when non-empty. */
export function validatePublicEntryForm(
  email: string,
  displayName: string,
  selectedDgIds: number[],
  config: ClubConfig,
  buckets: GolferBucket[] | null,
): ValidationResult {
  const allErrors: string[] = [];

  if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    allErrors.push('Please enter a valid email address.');
  }

  const nameResult = validateDisplayName(displayName);
  allErrors.push(...nameResult.errors);

  if (config.useBuckets && buckets) {
    allErrors.push(...validateCrestmontPicks(selectedDgIds, buckets, config).errors);
  } else {
    allErrors.push(...validateRvccPicks(selectedDgIds, config).errors);
  }

  return { valid: allErrors.length === 0, errors: allErrors };
}

/** Returns per-slot error messages; null means the slot is filled. */
export function validateSlotSelections(slotSelections: (number | null)[]): (string | null)[] {
  return slotSelections.map((id) =>
    id === null ? 'Please select a golfer for this slot.' : null
  );
}

export function canAddGolfer(
  dgId: number,
  selectedDgIds: number[],
  config: ClubConfig,
  buckets: GolferBucket[] | null,
  golferBucketNumber?: number
): { allowed: boolean; reason?: string } {
  if (selectedDgIds.includes(dgId)) {
    return { allowed: false, reason: 'Already selected.' };
  }

  if (!config.useBuckets) {
    if (selectedDgIds.length >= config.pickCount) {
      return { allowed: false, reason: `Maximum of ${config.pickCount} golfers already selected.` };
    }
    return { allowed: true };
  }

  if (buckets && golferBucketNumber !== undefined) {
    const golferBucketMap = buildGolferBucketMap(buckets);
    const alreadyPickedFromBucket = selectedDgIds.some(
      (id) => golferBucketMap.get(id) === golferBucketNumber
    );
    if (alreadyPickedFromBucket) {
      return { allowed: false, reason: 'Already selected a golfer from this bucket.' };
    }
  }

  if (selectedDgIds.length >= config.pickCount) {
    return { allowed: false, reason: `Maximum of ${config.pickCount} golfers already selected.` };
  }

  return { allowed: true };
}
