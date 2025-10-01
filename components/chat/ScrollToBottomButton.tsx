'use client';

interface ScrollToBottomButtonProps {
  onClick: () => void;
}

export function ScrollToBottomButton({ onClick }: ScrollToBottomButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-8 p-3 bg-pure-white dark:bg-dark-gray border border-pure-black/10 dark:border-pure-white/10 text-electric-yellow hover:bg-pure-black/5 dark:hover:bg-pure-white/5 rounded-full shadow-claude-lg transition-all hover:scale-110"
      aria-label="Scroll to bottom"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </button>
  );
}
