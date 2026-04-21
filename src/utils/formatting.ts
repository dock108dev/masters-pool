export function formatScore(score: number | null): string {
  if (score === null) return '-';
  if (score === 0) return 'E';
  if (score > 0) return `+${score}`;
  return `${score}`;
}

export function formatThru(thru: number | null): string {
  if (thru === null) return '-';
  if (thru === 18) return 'F';
  return `${thru}`;
}

export function formatLastUpdated(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    // Fixed zone so "last scored" matches tournament context and is stable in CI vs local dev
    timeZone: 'America/New_York',
  });
}
