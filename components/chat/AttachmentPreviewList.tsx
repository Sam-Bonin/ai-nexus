'use client';

import Image from 'next/image';
import { FileAttachment } from '@/types/chat';

interface AttachmentPreviewListProps {
  attachments: FileAttachment[];
  onRemove: (index: number) => void;
}

export function AttachmentPreviewList({ attachments, onRemove }: AttachmentPreviewListProps) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {attachments.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className="relative group bg-pure-black/5 dark:bg-pure-white/5 border border-pure-black/10 dark:border-pure-white/10 rounded-claude-sm p-2 pr-8 flex items-center gap-2"
        >
          {file.type.startsWith('image/') ? (
            <Image
              src={`data:${file.type};base64,${file.data}`}
              alt={file.name}
              width={40}
              height={40}
              unoptimized
              className="w-10 h-10 object-cover rounded"
            />
          ) : (
            <div className="w-10 h-10 bg-theme-primary/20 rounded flex items-center justify-center">
              <svg className="w-6 h-6 text-theme-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-pure-black dark:text-pure-white truncate">{file.name}</p>
            <p className="text-xs text-neutral-gray dark:text-neutral-gray">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute top-1 right-1 p-1 bg-vibrant-coral hover:bg-vibrant-coral/80 text-pure-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
