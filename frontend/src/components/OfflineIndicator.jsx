import { useNetworkStatus, useSyncStatus } from '../hooks/useNetworkStatus';

export default function OfflineIndicator() {
  const isOnline = useNetworkStatus();
  const { queueSize } = useSyncStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-40 animate-slide-down">
      <div className="bg-yellow-50 dark:bg-yellow-900 border-b border-yellow-200 dark:border-yellow-800">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
              </svg>
              <div className="text-sm font-medium text-yellow-800 dark:text-yellow-100">
                <span>Offline mode</span>
                {queueSize > 0 && (
                  <span className="ml-2 text-yellow-700 dark:text-yellow-200">
                    ({queueSize} {queueSize === 1 ? 'action' : 'actions'} pending)
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400 flex-shrink-0">
              Changes will sync when online
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
