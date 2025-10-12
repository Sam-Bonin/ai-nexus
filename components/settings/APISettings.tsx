'use client';

export function APISettings() {
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
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
        <p className="text-lg font-medium text-neutral-gray dark:text-neutral-gray italic">
          Coming soon
        </p>
        <p className="text-sm text-neutral-gray/70 dark:text-neutral-gray/70 mt-2">
          API configuration and keys will be available here
        </p>
      </div>
    </div>
  );
}
