'use client';

export function PrivacySettings() {
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
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <p className="text-lg font-medium text-neutral-gray dark:text-neutral-gray italic">
          Coming soon
        </p>
        <p className="text-sm text-neutral-gray/70 dark:text-neutral-gray/70 mt-2">
          Privacy and security settings will be available here
        </p>
      </div>
    </div>
  );
}
