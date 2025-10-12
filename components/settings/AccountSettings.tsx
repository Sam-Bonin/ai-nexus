'use client';

export function AccountSettings() {
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
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <p className="text-lg font-medium text-neutral-gray dark:text-neutral-gray italic">
          Coming soon
        </p>
        <p className="text-sm text-neutral-gray/70 dark:text-neutral-gray/70 mt-2">
          Account management features will be available here
        </p>
      </div>
    </div>
  );
}
