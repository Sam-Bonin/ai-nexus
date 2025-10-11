'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Project } from '@/types/chat';

// Color palette for projects (from style guide)
const PROJECT_COLORS = [
  '#FFD50F', // Electric Yellow
  '#FD765B', // Vibrant Coral
  '#999999', // Neutral Gray
  '#FFC107', // Amber
  '#FF6F91', // Pink
  '#4ECDC4', // Teal
  '#95E1D3', // Mint
  '#F38181', // Light Coral
];

// Deterministic color assignment based on project ID
function assignProjectColor(projectId: string): string {
  const hash = projectId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const index = Math.abs(hash) % PROJECT_COLORS.length;
  return PROJECT_COLORS[index];
}

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  project?: Project | null; // If provided, we're editing; otherwise creating
}

export default function ProjectModal({ isOpen, onClose, onSave, project }: ProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  const isEditing = !!project;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load existing project data when editing
  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description);
      setSelectedColor(project.color);
    } else {
      setName('');
      setDescription('');
      setSelectedColor(PROJECT_COLORS[0]);
    }
    setError('');
  }, [project, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    if (!description.trim()) {
      setError('Project description is required');
      return;
    }

    const now = Date.now();

    if (isEditing) {
      // Update existing project
      onSave({
        ...project,
        name: name.trim(),
        description: description.trim(),
        color: selectedColor,
        updatedAt: now,
      });
    } else {
      // Create new project
      const newProjectId = `project-${now}-${Math.random().toString(36).substr(2, 9)}`;
      onSave({
        id: newProjectId,
        name: name.trim(),
        description: description.trim(),
        color: selectedColor,
        createdAt: now,
        updatedAt: now,
      });
    }

    onClose();
  };

  const handleCancel = () => {
    setError('');
    onClose();
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-pure-black/50 dark:bg-pure-black/70 backdrop-blur-sm z-[120] animate-in fade-in duration-200"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 flex items-center justify-center z-[130] p-4"
        onClick={(e) => {
          // Only close if clicking the container itself, not its children
          if (e.target === e.currentTarget) {
            handleCancel();
          }
        }}
      >
        <div className="bg-pure-white dark:bg-dark-gray rounded-claude-lg shadow-claude-lg border border-pure-black/10 dark:border-pure-white/10 max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
          <h2 className="text-lg font-semibold text-pure-black dark:text-pure-white mb-4">
            {isEditing ? 'Edit Project' : 'Create New Project'}
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Name field */}
            <div className="mb-4">
              <label
                htmlFor="project-name"
                className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
              >
                Project Name
              </label>
              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Frontend Development"
                className="w-full px-3 py-2 bg-white dark:bg-dark-gray border border-pure-black/10 dark:border-pure-white/10 rounded-claude-sm text-sm text-pure-black dark:text-pure-white placeholder:text-cloudy-500 dark:placeholder:text-cloudy-400 focus:outline-none focus:ring-2 focus:ring-electric-yellow/50 focus:border-electric-yellow"
                autoFocus
              />
            </div>

            {/* Description field */}
            <div className="mb-4">
              <label
                htmlFor="project-description"
                className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
              >
                Description
              </label>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Building React applications and components"
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-dark-gray border border-pure-black/10 dark:border-pure-white/10 rounded-claude-sm text-sm text-pure-black dark:text-pure-white placeholder:text-cloudy-500 dark:placeholder:text-cloudy-400 focus:outline-none focus:ring-2 focus:ring-electric-yellow/50 focus:border-electric-yellow resize-none"
              />
              <p className="text-xs text-neutral-gray dark:text-neutral-gray mt-1">
                Be specific - this helps auto-categorize future conversations
              </p>
            </div>

            {/* Color picker */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Project Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      selectedColor === color
                        ? 'ring-2 ring-offset-2 ring-pure-black dark:ring-pure-white ring-offset-white dark:ring-offset-dark-gray scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 px-3 py-2 bg-vibrant-coral/10 border border-vibrant-coral/20 rounded-claude-sm">
                <p className="text-sm text-vibrant-coral">{error}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-transparent hover:bg-pure-black/5 dark:hover:bg-pure-white/5 text-gray-700 dark:text-gray-300 rounded-claude-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-electric-yellow hover:bg-electric-yellow-600 text-pure-black rounded-claude-sm font-medium shadow-claude-sm transition-colors"
              >
                {isEditing ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}