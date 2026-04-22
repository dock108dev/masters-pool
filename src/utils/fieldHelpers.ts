import type { AvailableGolfer, GolferBucket, Player, PoolFieldResponse } from '../types/domain';

function lastNameSort(a: AvailableGolfer, b: AvailableGolfer): number {
  const lastA = a.player_name.includes(',')
    ? a.player_name.split(',')[0].trim()
    : a.player_name.split(' ').slice(-1)[0] ?? '';
  const lastB = b.player_name.includes(',')
    ? b.player_name.split(',')[0].trim()
    : b.player_name.split(' ').slice(-1)[0] ?? '';
  return lastA.localeCompare(lastB);
}

export function fieldToGolfers(field: PoolFieldResponse): AvailableGolfer[] {
  if (field.players) return [...field.players].sort(lastNameSort);
  if (field.buckets) return field.buckets.flatMap((b) => b.players).sort(lastNameSort);
  return [];
}

export function playerToGolfer(p: Player): AvailableGolfer {
  return { dg_id: p.id, player_name: p.name, ranking: p.worldRank };
}

export function fieldToBuckets(field: PoolFieldResponse): GolferBucket[] | null {
  if (!field.buckets) return null;
  return field.buckets.map((b) => ({
    bucket_number: b.bucket_number,
    label: b.label,
    golfers: [...b.players].sort(lastNameSort),
  }));
}
