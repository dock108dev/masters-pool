import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { apiClient } from '../../api/client';

interface Props {
  poolId: number;
}

function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function LockCountdownWidget({ poolId }: Props) {
  const { data } = useApi(
    () => apiClient.getLockStatus(poolId),
    [poolId],
    { pollingInterval: 60_000 },
  );

  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!data || data.locked || !data.lock_time) {
      // Defer via setTimeout so this branch returns a cleanup function that cancels the update on unmount
      const clearId = setTimeout(() => setRemainingSeconds(null), 0);
      return () => clearTimeout(clearId);
    }
    const lockAt = new Date(data.lock_time).getTime();
    const compute = () => {
      setRemainingSeconds(Math.max(0, Math.round((lockAt - Date.now()) / 1000)));
    };
    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [data]);

  if (!data) return null;

  if (data.locked) {
    const lockedAtStr = data.locked_at
      ? ` at ${new Date(data.locked_at).toLocaleTimeString()}`
      : '';
    return (
      <span className="lock-badge lock-badge--locked" data-testid="lock-badge">
        Pool Locked{lockedAtStr}
      </span>
    );
  }

  if (!data.lock_time) {
    return (
      <span className="lock-badge lock-badge--tbd" data-testid="lock-badge">
        Lock time TBD
      </span>
    );
  }

  if (remainingSeconds === null) return null;

  if (remainingSeconds <= 0) {
    return (
      <span className="lock-badge lock-badge--locked" data-testid="lock-badge">
        Pool Locked
      </span>
    );
  }

  return (
    <span className="lock-badge lock-badge--open" data-testid="lock-badge">
      Locks in {formatCountdown(remainingSeconds)}
    </span>
  );
}
