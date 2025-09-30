'use client';

import { useState, useEffect } from 'react';
import { Conversation, Project } from '@/types/chat';
import { storage } from '@/lib/storage';
import { exportConversationAsMarkdown, exportConversationAsJSON, downloadFile } from '@/lib/utils';
import ProjectSection from './ProjectSection';
import ProjectModal from './ProjectModal';
import MoveConversationModal from './MoveConversationModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  isOpen,
  onToggle,
}: SidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Project management modals
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [movingConversation, setMovingConversation] = useState<Conversation | null>(null);
  const [deleteProjectModalOpen, setDeleteProjectModalOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  // Load projects and expand state from localStorage
  useEffect(() => {
    setProjects(storage.getProjects());

    // Load expanded state from localStorage
    const savedExpandedState = new Set<string>();
    storage.getProjects().forEach(project => {
      const isExpanded = localStorage.getItem(`claude-project-expanded-${project.id}`);
      if (isExpanded === 'true') {
        savedExpandedState.add(project.id);
      }
    });
    setExpandedProjects(savedExpandedState);
  }, [conversations]); // Reload when conversations change

  const toggleProjectExpand = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
        localStorage.setItem(`claude-project-expanded-${projectId}`, 'false');
      } else {
        newSet.add(projectId);
        localStorage.setItem(`claude-project-expanded-${projectId}`, 'true');
      }
      return newSet;
    });
  };

  // Filter conversations based on search query
  const filteredConversations = searchQuery
    ? conversations.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  // Group conversations by project
  const conversationsByProject = projects.map(project => ({
    project,
    conversations: filteredConversations.filter(c => c.projectId === project.id),
  }));

  // Miscellaneous conversations (projectId === null)
  const miscellaneousConversations = filteredConversations.filter(c => c.projectId === null);

  // Handle export
  const handleExport = (conversation: Conversation, format: 'markdown' | 'json') => {
    const content = format === 'markdown'
      ? exportConversationAsMarkdown(conversation)
      : exportConversationAsJSON(conversation);

    const extension = format === 'markdown' ? 'md' : 'json';
    const filename = `${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;

    downloadFile(content, filename, format === 'markdown' ? 'text/markdown' : 'application/json');
    setMenuOpenId(null);
  };

  const handleRenameStart = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
    setMenuOpenId(null);
  };

  const handleRenameSubmit = (id: string) => {
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  // Project management handlers
  const handleCreateProject = () => {
    setEditingProject(null);
    setProjectModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectModalOpen(true);
  };

  const handleSaveProject = (project: Project) => {
    storage.saveProject(project);
    setProjects(storage.getProjects());
  };

  const handleDeleteProjectClick = (project: Project) => {
    setDeletingProject(project);
    setDeleteProjectModalOpen(true);
  };

  const handleDeleteProjectConfirm = () => {
    if (deletingProject) {
      storage.deleteProject(deletingProject.id);
      setProjects(storage.getProjects());
      // Refresh conversations to show they've moved to Miscellaneous
      onNewChat(); // This will trigger a refresh in the parent
    }
  };

  const handleMoveConversationClick = (conversation: Conversation) => {
    setMovingConversation(conversation);
    setMoveModalOpen(true);
  };

  const handleMoveConversation = (projectId: string | null) => {
    if (movingConversation) {
      storage.updateConversationProject(movingConversation.id, projectId);
      // No need to update state here - parent will refresh via onSelectConversation
    }
  };

  const hasConversations = conversations.length > 0;
  const hasProjects = projects.length > 0;

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`h-full bg-pure-white dark:bg-dark-gray border-r border-pure-black/10 dark:border-pure-white/10 transition-all duration-300 ${
          isOpen ? 'w-72' : 'w-0'
        } flex flex-col shadow-claude-md font-sans overflow-hidden`}
      >
        {/* Header */}
        <div className="p-4 border-b border-pure-black/10 dark:border-pure-white/10">
          <div className="mb-4">
            <img
              src="/logo-light.png"
              alt="AI Nexus"
              className="w-52 h-auto block dark:hidden"
            />
            <img
              src="/logo-dark.png"
              alt="AI Nexus"
              className="w-52 h-auto hidden dark:block"
            />
            <p className="text-xs text-neutral-gray dark:text-cloudy-400 mt-2 font-medium">Universal AI Interface</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onNewChat}
              className="flex-1 px-4 py-2 bg-electric-yellow hover:bg-electric-yellow-600 text-pure-black rounded-claude-sm transition-colors font-medium flex items-center justify-center gap-2 shadow-claude-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
            <button
              onClick={handleCreateProject}
              className="px-3 py-2 bg-pure-black/5 dark:bg-pure-white/5 hover:bg-pure-black/10 dark:hover:bg-pure-white/10 text-pure-black dark:text-pure-white rounded-claude-sm transition-colors font-medium shadow-claude-sm"
              title="Create Project"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Search input */}
          {hasConversations && (
            <div className="mt-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full px-3 py-2 pl-9 bg-white dark:bg-dark-gray border border-pure-black/10 dark:border-pure-white/10 rounded-claude-sm text-sm text-pure-black dark:text-pure-white placeholder:text-cloudy-500 dark:placeholder:text-cloudy-400 focus:outline-none focus:ring-2 focus:ring-electric-yellow/50 focus:border-electric-yellow"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cloudy-500 dark:text-cloudy-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Projects and conversations list */}
        <div className="flex-1 overflow-y-auto p-2">
          {!hasConversations && !hasProjects ? (
            <div className="px-4 py-8 text-center">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                No conversations yet
              </p>
              <p className="text-xs text-neutral-gray dark:text-neutral-gray">
                Start a new chat to get started
              </p>
            </div>
          ) : !hasProjects && hasConversations ? (
            <div className="px-4 py-6 text-center mb-4 bg-electric-yellow/5 dark:bg-electric-yellow/10 rounded-claude-md border border-electric-yellow/20">
              <div className="text-3xl mb-2">📁</div>
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">
                Create projects to auto-organize
              </p>
              <p className="text-xs text-neutral-gray dark:text-neutral-gray mb-3">
                Group conversations by topic for easy access
              </p>
              <button
                onClick={handleCreateProject}
                className="text-xs text-electric-yellow hover:text-vibrant-coral font-medium transition-colors"
              >
                + Create your first project
              </button>
            </div>
          ) : null}

          {/* Project sections */}
          {conversationsByProject.map(({ project, conversations: projectConvs }) => {
            // Hide empty projects during search
            if (searchQuery && projectConvs.length === 0) return null;

            return (
              <ProjectSection
                key={project.id}
                project={project}
                conversations={projectConvs}
                activeConversationId={activeConversationId}
                isExpanded={expandedProjects.has(project.id)}
                onToggle={() => toggleProjectExpand(project.id)}
                onSelectConversation={onSelectConversation}
                onRenameConversation={onRenameConversation}
                onDeleteConversation={onDeleteConversation}
                onMoveConversation={handleMoveConversationClick}
                onEditProject={handleEditProject}
                onDeleteProject={handleDeleteProjectClick}
              />
            );
          })}

          {/* Miscellaneous section */}
          {miscellaneousConversations.length > 0 && (
            <div className="mb-1 mt-2">
              {/* Miscellaneous Header */}
              <button
                onClick={() => toggleProjectExpand('miscellaneous')}
                className={`w-full text-left px-3 py-2 rounded-claude-sm transition-colors cursor-pointer border-l-4 border-neutral-gray flex items-center justify-between group ${
                  expandedProjects.has('miscellaneous')
                    ? 'bg-white dark:bg-pure-white/5 shadow-claude-sm'
                    : 'hover:bg-pure-black/5 dark:hover:bg-pure-white/5'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <svg
                    className="w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    style={{ transform: expandedProjects.has('miscellaneous') ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-sm font-semibold text-pure-black dark:text-pure-white tracking-tight truncate">
                    📦 Miscellaneous
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-neutral-gray/10 dark:bg-neutral-gray/20 text-xs font-medium text-pure-black dark:text-pure-white flex-shrink-0">
                  {miscellaneousConversations.length}
                </span>
              </button>

              {/* Miscellaneous conversations */}
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: expandedProjects.has('miscellaneous') ? '1000px' : '0',
                }}
              >
                <div className="space-y-1 pt-1">
                  {miscellaneousConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`group relative rounded-claude-sm transition-colors ml-6 ${
                        conversation.id === activeConversationId
                          ? 'bg-white dark:bg-pure-white/5 shadow-claude-sm border border-electric-yellow/20'
                          : 'hover:bg-white/50 dark:hover:bg-pure-white/5'
                      }`}
                    >
                      {editingId === conversation.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleRenameSubmit(conversation.id);
                          }}
                          className="p-2"
                        >
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => handleRenameSubmit(conversation.id)}
                            autoFocus
                            className="w-full px-2 py-1 text-sm bg-white dark:bg-dark-bg border border-electric-yellow rounded-claude-sm focus:outline-none focus:ring-2 focus:ring-electric-yellow/50"
                          />
                        </form>
                      ) : (
                        <>
                          <button
                            onClick={() => onSelectConversation(conversation.id)}
                            className="w-full text-left p-3 pr-10 block"
                          >
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {conversation.title}
                            </div>
                            <div className="text-xs text-neutral-gray dark:text-neutral-gray mt-1">
                              {new Date(conversation.updatedAt).toLocaleDateString()}
                            </div>
                          </button>

                          {/* Menu button */}
                          <div className="absolute top-2 right-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(menuOpenId === conversation.id ? null : conversation.id);
                              }}
                              className="p-1 rounded-claude-sm hover:bg-pure-black/5 dark:hover:bg-pure-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                              </svg>
                            </button>

                            {/* Dropdown menu */}
                            {menuOpenId === conversation.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setMenuOpenId(null)}
                                />
                                <div className="absolute right-0 mt-1 w-48 bg-pure-white dark:bg-dark-gray rounded-claude-md shadow-claude-lg border border-pure-black/10 dark:border-pure-white/10 py-1 z-20">
                                  <button
                                    onClick={() => handleRenameStart(conversation)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
                                  >
                                    Rename
                                  </button>
                                  <button
                                    onClick={() => handleExport(conversation, 'markdown')}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
                                  >
                                    Export as Markdown
                                  </button>
                                  <button
                                    onClick={() => handleExport(conversation, 'json')}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
                                  >
                                    Export as JSON
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleMoveConversationClick(conversation);
                                      setMenuOpenId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
                                  >
                                    Move to project...
                                  </button>
                                  <button
                                    onClick={() => {
                                      onDeleteConversation(conversation.id);
                                      setMenuOpenId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-electric-yellow dark:text-electric-yellow hover:bg-pure-black/5 dark:hover:bg-pure-white/5 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* No results */}
          {searchQuery && filteredConversations.length === 0 && (
            <p className="text-center text-cloudy-600 dark:text-cloudy-200 text-sm mt-8">
              No conversations found
            </p>
          )}
        </div>
      </aside>

      {/* Modals */}
      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSave={handleSaveProject}
        project={editingProject}
      />

      <MoveConversationModal
        isOpen={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        onMove={handleMoveConversation}
        projects={projects}
        currentProjectId={movingConversation?.projectId || null}
        conversationTitle={movingConversation?.title || ''}
      />

      <DeleteConfirmationModal
        isOpen={deleteProjectModalOpen}
        onClose={() => setDeleteProjectModalOpen(false)}
        onConfirm={handleDeleteProjectConfirm}
        title="Delete Project"
        message={`Are you sure you want to delete "${deletingProject?.name}"? All conversations in this project will be moved to Miscellaneous.`}
        confirmText="Delete Project"
      />
    </>
  );
}