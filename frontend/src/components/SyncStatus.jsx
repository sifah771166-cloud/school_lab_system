import { useEffect, useState } from 'react';
import offlineQueueService from '../services/offlineQueueService';

function formatLastSync(lastSync) {
  if (!lastSync) return 'Never';

  try {
    const date = new Date(lastSync);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return 'Unknown';
  }
}

export default function SyncStatus() {
  const [status, setStatus] = useState({
    isOnline: navigator.onLine,
    queueSize: 0,
    isSyncing: false,
    lastSync: null,
    lastResult: null,
  });

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      const queueStatus = await offlineQueueService.getQueueStatus();
      if (!mounted || !queueStatus) return;

      setStatus({
        isOnline: queueStatus.isOnline,
        queueSize: queueStatus.queueSize,
        isSyncing: queueStatus.isSyncing,
        lastSync: queueStatus.lastSync,
        lastResult: null,
      });
    };

    refresh();

    const unsubscribe = offlineQueueService.subscribe((event) => {
      if (!mounted) return;

      if (event.event === 'online') {
        setStatus((prev) => ({ ...prev, isOnline: true }));
      }

      if (event.event === 'offline') {
        setStatus((prev) => ({ ...prev, isOnline: false }));
      }

      if (event.event === 'queued') {
        setStatus((prev) => ({
          ...prev,
          queueSize: prev.queueSize + 1,
          lastResult: 'Queued for sync',
        }));
      }

      if (event.event === 'queue-processing') {
        setStatus((prev) => ({
          ...prev,
          isSyncing: true,
          lastResult: `Processing ${event.total ?? 0} item(s)...`,
        }));
      }

      if (event.event === 'queue-processed') {
        setStatus((prev) => ({
          ...prev,
          isSyncing: false,
          queueSize: Math.max(0, prev.queueSize - (event.success || 0)),
          lastSync: new Date().toISOString(),
          lastResult: `Synced ${event.success || 0}, failed ${event.failed || 0}`,
        }));
      }

      if (event.event === 'queue-error') {
        setStatus((prev) => ({
          ...prev,
          isSyncing: false,
          lastResult: 'Sync failed',
        }));
      }

      refresh();
    });

    const interval = setInterval(refresh, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const { isOnline, queueSize, isSyncing, lastSync, lastResult } = status;

  const handleSyncNow = async () => {
    if (!isOnline || isSyncing) return;

    setStatus((prev) => ({ ...prev, isSyncing: true }));
    try {
      const result = await offlineQueueService.processQueue();
      const queueStatus = await offlineQueueService.getQueueStatus();
      if (queueStatus) {
        setStatus((prev) => ({
          ...prev,
          queueSize: queueStatus.queueSize,
          isSyncing: queueStatus.isSyncing,
          lastSync: queueStatus.lastSync || new Date().toISOString(),
          lastResult: result?.skipped
            ? 'Skipped (offline or already syncing)'
            : `Manual sync: ${result?.success || 0} success, ${result?.failed || 0} failed`,
        }));
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
      setStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastResult: 'Manual sync failed',
      }));
    }
  };

  const dotColor = !isOnline
    ? 'bg-yellow-500'
    : isSyncing
      ? 'bg-blue-500'
      : queueSize > 0
        ? 'bg-purple-500'
        : 'bg-green-500';

  const text = !isOnline
    ? 'Offline'
    : isSyncing
      ? 'Syncing...'
      : queueSize > 0
        ? `${queueSize} pending`
        : 'Synced';

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur border border-gray-200 dark:border-gray-700 rounded-lg shadow-md px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
          <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{text}</span>
        </div>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
          Last sync: {formatLastSync(lastSync)}
        </p>
        {lastResult && (
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
            {lastResult}
          </p>
        )}
        <button
          type="button"
          onClick={handleSyncNow}
          disabled={!isOnline || isSyncing || queueSize === 0}
          className="mt-2 w-full text-[10px] px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Sync now
        </button>
      </div>
    </div>
  );
}
