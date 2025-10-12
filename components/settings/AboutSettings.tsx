'use client';

export function AboutSettings() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-neutral-gray/30 dark:text-neutral-gray/30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-lg font-medium text-neutral-gray dark:text-neutral-gray italic">
          Coming soon
        </p>
        <p className="text-sm text-neutral-gray/70 dark:text-neutral-gray/70 mt-2">
          Application information will be available here
        </p>
      </div>
    </div>
  );
}
