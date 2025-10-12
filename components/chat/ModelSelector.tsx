'use client';

import { useEffect, useRef, useState } from 'react';
import { ModelId } from '@/types/chat';
import { AVAILABLE_MODELS } from './modelOptions';

interface ModelSelectorProps {
  selectedModel: ModelId;
  onSelect: (model: ModelId) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  sonnet: 'Sonnet',
  opus: 'Opus',
};

export function ModelSelector({ selectedModel, onSelect }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHoveredCategory(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedModelName = AVAILABLE_MODELS.find(model => model.id === selectedModel)?.name ?? 'Select model';

  const renderCategory = (category: string) => {
    const models = AVAILABLE_MODELS.filter(model => model.category === category);
    if (models.length === 0) {
      return null;
    }

    return (
      <div
        key={category}
        className="relative"
        onMouseEnter={() => setHoveredCategory(category)}
        onMouseLeave={() => setHoveredCategory(null)}
      >
        <div className="px-4 py-2.5 text-base font-sans text-gray-700 dark:text-gray-300 hover:bg-pure-black/5 dark:hover:bg-pure-white/5 cursor-pointer flex items-center justify-between">
          <span>{CATEGORY_LABELS[category] ?? category}</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        {hoveredCategory === category && (
          <div className="absolute left-full top-0 ml-1 w-40 bg-pure-white dark:bg-dark-gray rounded-claude-md shadow-claude-lg border border-pure-black/10 dark:border-pure-white/10 py-1 animate-fade-in">
            {models.map(model => (
              <button
                key={model.id}
                onClick={() => {
                  onSelect(model.id);
                  setIsOpen(false);
                  setHoveredCategory(null);
                }}
                className={`w-full text-left px-4 py-2.5 text-base font-sans transition-colors ${
                  model.id === selectedModel
                    ? 'bg-theme-primary/10 text-theme-primary'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-pure-black/5 dark:hover:bg-pure-white/5'
                }`}
              >
                {model.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-2 px-3 py-2 text-gray-900 dark:text-gray-100 hover:text-theme-primary rounded-claude-sm hover:bg-pampas/50 dark:hover:bg-dark-bg/50 focus:outline-none transition-colors font-sans cursor-pointer text-base"
      >
        <span>{selectedModelName}</span>
        <svg
          className={`w-4 h-4 text-neutral-gray dark:text-neutral-gray transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-pure-white dark:bg-dark-gray rounded-claude-md shadow-claude-lg border border-pure-black/10 dark:border-pure-white/10 py-1 z-50 animate-fade-in">
          {Object.keys(CATEGORY_LABELS).map(renderCategory)}
        </div>
      )}
    </div>
  );
}
