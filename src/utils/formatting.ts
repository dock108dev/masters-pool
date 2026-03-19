import type { GolferStatus } from '../types/domain';

export function formatScore(score: number | null): string {
  if (score === null) return '-';
  if (score === 0) return 'E';
  if (score > 0) return `+${score}`;
  return `${score}`;
}

export function formatGolferStatus(status: GolferStatus): string {
  switch (status) {
    case 'active':
      return '';
    case 'cut':
      return 'CUT';
    case 'wd':
      return 'WD';
    case 'dq':
      return 'DQ';
  }
}

export function formatPosition(position: number | null): string {
  if (position === null) return '-';
  return `${position}`;
}

export function formatLastUpdated(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatGolferCell(golferName: string, displayScore: string, thru: string, status: GolferStatus): string {
  if (status === 'cut') return `${golferName} (CUT)`;
  if (status === 'wd') return `${golferName} (WD)`;
  if (status === 'dq') return `${golferName} (DQ)`;
  return `${golferName} (${displayScore} / ${thru})`;
}
