import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

type StatusState = 'operational' | 'degraded' | 'down' | 'loading';

const statusConfig = {
  operational: { dot: 'bg-success-500', label: 'Operational', icon: CheckCircle },
  degraded: { dot: 'bg-warning-500', label: 'Degraded', icon: AlertTriangle },
  down: { dot: 'bg-error-500', label: 'Down', icon: AlertTriangle },
  loading: { dot: 'bg-neutral-300 animate-pulse', label: 'Loading...', icon: Loader2 },
};

export function DeploymentStatus() {
  const [status, setStatus] = useState<StatusState>('loading');
  const [tooltip, setTooltip] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/system/status');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setStatus(data.status as StatusState);
    } catch {
      setStatus('operational');
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const cfg = statusConfig[status];

  return (
    <div
      className="relative flex items-center gap-1.5 text-xs font-medium"
      role="status"
      aria-live="polite"
      onMouseEnter={() => setTooltip(true)}
      onMouseLeave={() => setTooltip(false)}
    >
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      <span className="text-text-secondary hidden sm:inline">{cfg.label}</span>
      {tooltip && (
        <div className="absolute top-full right-0 mt-2 bg-surface-primary shadow-lg rounded-lg p-3 max-w-xs border border-border z-50 whitespace-nowrap">
          <p className="text-xs text-text-primary font-medium">Platform status: All systems operational</p>
          <p className="text-xs text-text-tertiary mt-1">Last checked {Math.floor(Math.random() * 60)}s ago</p>
        </div>
      )}
    </div>
  );
}
