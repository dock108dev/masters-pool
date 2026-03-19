import type { ClubConfig, AvailableGolfer, GolferBucket } from '../types/domain';

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
  if (!name.trim()) {
    errors.push('Display name is required.');
  } else if (name.trim().length < 2) {
    errors.push('Display name must be at least 2 characters.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateRvccPicks(
  selectedGolferIds: string[],
  config: ClubConfig
): ValidationResult {
  const errors: string[] = [];
  if (selectedGolferIds.length !== config.pickCount) {
    errors.push(`You must select exactly ${config.pickCount} golfers. Currently selected: ${selectedGolferIds.length}.`);
  }
  const unique = new Set(selectedGolferIds);
  if (unique.size !== selectedGolferIds.length) {
    errors.push('Duplicate golfer selections are not allowed.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateCrestmontPicks(
  selectedGolferIds: string[],
  buckets: GolferBucket[],
  config: ClubConfig
): ValidationResult {
  const errors: string[] = [];

  if (selectedGolferIds.length !== config.pickCount) {
    errors.push(`You must select exactly ${config.pickCount} golfers (1 from each bucket). Currently selected: ${selectedGolferIds.length}.`);
  }

  const golferBucketMap = new Map<string, number>();
  for (const bucket of buckets) {
    for (const g of bucket.golfers) {
      golferBucketMap.set(g.id, bucket.bucketIndex);
    }
  }

  const bucketsUsed = new Set<number>();
  for (const id of selectedGolferIds) {
    const bucketIndex = golferBucketMap.get(id);
    if (bucketIndex === undefined) {
      errors.push(`Golfer ID "${id}" not found in any bucket.`);
    } else if (bucketsUsed.has(bucketIndex)) {
      errors.push(`Only 1 golfer may be selected from ${buckets[bucketIndex]?.label ?? `Bucket ${bucketIndex}`}.`);
    } else {
      bucketsUsed.add(bucketIndex);
    }
  }

  const unique = new Set(selectedGolferIds);
  if (unique.size !== selectedGolferIds.length) {
    errors.push('Duplicate golfer selections are not allowed.');
  }

  return { valid: errors.length === 0, errors };
}

export function validateUpload(
  file: File | undefined,
  config: ClubConfig
): ValidationResult {
  const errors: string[] = [];
  if (config.uploadRequired && !file) {
    errors.push('File upload is required.');
  }
  if (file && file.size > 10 * 1024 * 1024) {
    errors.push('File must be under 10MB.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateEntryForm(
  email: string,
  displayName: string,
  selectedGolferIds: string[],
  config: ClubConfig,
  buckets: GolferBucket[] | null,
  uploadFile: File | undefined
): ValidationResult {
  const allErrors: string[] = [];

  const emailResult = validateEmail(email);
  allErrors.push(...emailResult.errors);

  const nameResult = validateDisplayName(displayName);
  allErrors.push(...nameResult.errors);

  if (config.useBuckets && buckets) {
    const picksResult = validateCrestmontPicks(selectedGolferIds, buckets, config);
    allErrors.push(...picksResult.errors);
  } else {
    const picksResult = validateRvccPicks(selectedGolferIds, config);
    allErrors.push(...picksResult.errors);
  }

  if (config.uploadEnabled) {
    const uploadResult = validateUpload(uploadFile, config);
    allErrors.push(...uploadResult.errors);
  }

  return { valid: allErrors.length === 0, errors: allErrors };
}

export function canAddGolfer(
  golferId: string,
  selectedGolferIds: string[],
  _availableGolfers: AvailableGolfer[],
  config: ClubConfig,
  buckets: GolferBucket[] | null,
  golferBucketIndex?: number
): { allowed: boolean; reason?: string } {
  if (selectedGolferIds.includes(golferId)) {
    return { allowed: false, reason: 'Already selected.' };
  }

  if (!config.useBuckets) {
    if (selectedGolferIds.length >= config.pickCount) {
      return { allowed: false, reason: `Maximum of ${config.pickCount} golfers already selected.` };
    }
    return { allowed: true };
  }

  if (buckets && golferBucketIndex !== undefined) {
    const golferBucketMap = new Map<string, number>();
    for (const bucket of buckets) {
      for (const g of bucket.golfers) {
        golferBucketMap.set(g.id, bucket.bucketIndex);
      }
    }
    const alreadyPickedFromBucket = selectedGolferIds.some(
      (id) => golferBucketMap.get(id) === golferBucketIndex
    );
    if (alreadyPickedFromBucket) {
      return { allowed: false, reason: `Already selected a golfer from this bucket.` };
    }
  }

  if (selectedGolferIds.length >= config.pickCount) {
    return { allowed: false, reason: `Maximum of ${config.pickCount} golfers already selected.` };
  }

  return { allowed: true };
}
