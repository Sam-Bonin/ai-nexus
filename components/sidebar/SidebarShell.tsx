'use client';

import { useEffect, useState } from 'react';
import { Conversation, Project } from '@/types/chat';
import { storage } from '@/lib/storage';
import { SidebarHeader } from './SidebarHeader';
import { ProjectSection } from './ProjectSection';
import { ConversationListItem } from './ConversationListItem';
import ProjectModal from './ProjectModal';
import MoveConversationModal from './MoveConversationModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { SettingsMenu } from '@/components/settings/SettingsMenu';

interface SidebarShellProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onConversationsUpdate?: () => void;
  isOpen: boolean;
}

export function SidebarShell({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onConversationsUpdate,
  isOpen,
}: SidebarShellProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [movingConversation, setMovingConversation] = useState<Conversation | null>(null);
  const [deleteProjectModalOpen, setDeleteProjectModalOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);

  useEffect(() => {
    setProjects(storage.getProjects());
  }, [conversations]);

  useEffect(() => {
    const savedExpandedState = new Set<string>();
    storage.getProjects().forEach(project => {
      const isExpanded = localStorage.getItem(`claude-project-expanded-${project.id}`);
      if (isExpanded === 'true') {
        savedExpandedState.add(project.id);
      }
    });
    const miscExpanded = localStorage.getItem('claude-project-expanded-miscellaneous');
    if (miscExpanded === 'true') {
      savedExpandedState.add('miscellaneous');
    }
    setExpandedProjects(savedExpandedState);
  }, []);

  const toggleProjectExpand = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
        localStorage.setItem(`claude-project-expanded-${projectId}`, 'false');
      } else {
        next.add(projectId);
        localStorage.setItem(`claude-project-expanded-${projectId}`, 'true');
      }
      return next;
    });
  };

  const filteredConversations = searchQuery
    ? conversations.filter(conversation =>
        conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const conversationsByProject = projects.map(project => ({
    project,
    conversations: filteredConversations.filter(conversation => conversation.projectId === project.id),
  }));

  const miscellaneousConversations = filteredConversations.filter(conversation => conversation.projectId === null);

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

  const handleDeleteProjectRequest = (project: Project) => {
    setDeletingProject(project);
    setDeleteProjectModalOpen(true);
  };

  const handleDeleteProjectConfirm = () => {
    if (deletingProject) {
      storage.deleteProject(deletingProject.id);
      setProjects(storage.getProjects());
      onConversationsUpdate?.();
    }
  };

  const handleMoveConversationRequest = (conversation: Conversation) => {
    setMovingConversation(conversation);
    setMoveModalOpen(true);
  };

  const handleMoveConversation = (projectId: string | null) => {
    if (movingConversation) {
      storage.updateConversationProject(movingConversation.id, projectId);
      onConversationsUpdate?.();
    }
  };

  const hasConversations = conversations.length > 0;
  const hasProjects = projects.length > 0;

  return (
    <aside
      className={`relative h-full flex flex-col flex-shrink-0 bg-pure-white dark:bg-dark-gray transition-[transform,width] duration-300 ease-in-out ${
        isOpen ? 'w-72 translate-x-0 border-r border-pure-black/10 dark:border-pure-white/10 shadow-claude-md' : 'w-72 -translate-x-full md:w-0 md:translate-x-0 md:border-r-0 md:shadow-none'
      } font-sans overflow-hidden`}
    >
      <SidebarHeader
        onNewChat={onNewChat}
        onCreateProject={handleCreateProject}
        showSearch={hasConversations}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex-1 overflow-y-auto p-2 [scrollbar-width:none] [-ms-overflow-style:'none'] [&::-webkit-scrollbar]:hidden">
        {!hasConversations && !hasProjects ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No conversations yet</p>
            <p className="text-xs text-neutral-gray dark:text-neutral-gray">Start a new chat to get started</p>
          </div>
        ) : !hasProjects && hasConversations ? (
          <div className="px-4 py-6 text-center mb-4 bg-theme-primary/10 rounded-claude-md border border-theme-primary/20">
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">Create projects to auto-organize</p>
            <p className="text-xs text-neutral-gray dark:text-neutral-gray mb-3">Group conversations by topic for easy access</p>
            <button onClick={handleCreateProject} className="text-xs text-theme-primary hover:text-theme-primary-hover font-medium transition-colors">
              + Create your first project
            </button>
          </div>
        ) : null}

        {conversationsByProject.map(({ project, conversations: projectConversations }) => {
          if (searchQuery && projectConversations.length === 0) {
            return null;
          }

          return (
            <ProjectSection
              key={project.id}
              project={project}
              conversations={projectConversations}
              activeConversationId={activeConversationId}
              isExpanded={expandedProjects.has(project.id)}
              onToggle={() => toggleProjectExpand(project.id)}
              onSelectConversation={onSelectConversation}
              onRenameConversation={onRenameConversation}
              onDeleteConversation={onDeleteConversation}
              onMoveConversation={handleMoveConversationRequest}
              onEditProject={handleEditProject}
              onDeleteProject={handleDeleteProjectRequest}
            />
          );
        })}

        {miscellaneousConversations.length > 0 && (
          <div className="mb-1 mt-4">
            <div className="flex items-center gap-2 px-3 mb-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pure-black/10 dark:via-pure-white/10 to-transparent" />
              <span className="text-xs font-normal text-neutral-gray/70 dark:text-cloudy-400">Uncategorized</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pure-black/10 dark:via-pure-white/10 to-transparent" />
            </div>

            <button
              onClick={() => {
                toggleProjectExpand('miscellaneous');
              }}
              className={`w-full text-left px-3 py-2 rounded-claude-sm transition-colors cursor-pointer border-l-4 border-dashed border-cloudy-400 dark:border-cloudy-500 flex items-center justify-between group ${
                expandedProjects.has('miscellaneous')
                  ? 'bg-cloudy-100/30 dark:bg-cloudy-900/10'
                  : 'hover:bg-cloudy-100/20 dark:hover:bg-cloudy-900/10'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <svg
                  className="w-4 h-4 text-cloudy-500 dark:text-cloudy-400 transition-transform duration-200 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ transform: expandedProjects.has('miscellaneous') ? 'rotate(90deg)' : 'rotate(0deg)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <svg className="w-4 h-4 text-cloudy-500 dark:text-cloudy-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <span className="text-sm font-medium text-cloudy-600 dark:text-cloudy-300 tracking-tight truncate">Miscellaneous</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cloudy-200/40 dark:bg-cloudy-700/30 text-xs font-medium text-cloudy-700 dark:text-cloudy-300 flex-shrink-0 border border-cloudy-300/30 dark:border-cloudy-600/30">
                {miscellaneousConversations.length}
              </span>
            </button>

            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{ maxHeight: expandedProjects.has('miscellaneous') ? '1000px' : '0' }}
            >
              <div className="space-y-1 pt-1">
                {miscellaneousConversations.map(conversation => (
                  <div key={conversation.id} className="ml-6">
                    <ConversationListItem
                      conversation={conversation}
                      isActive={activeConversationId === conversation.id}
                      onSelect={onSelectConversation}
                      onRename={onRenameConversation}
                      onDelete={onDeleteConversation}
                      onMove={handleMoveConversationRequest}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Footer */}
      <div className="p-4 border-t border-pure-black/10 dark:border-pure-white/10">
        <button
          onClick={() => setSettingsMenuOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-pure-black/5 dark:hover:bg-pure-white/5 rounded-claude-sm transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm font-medium">Settings</span>
        </button>
      </div>

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
        currentProjectId={movingConversation?.projectId ?? null}
        conversationTitle={movingConversation?.title ?? ''}
      />

      <DeleteConfirmationModal
        isOpen={deleteProjectModalOpen}
        onClose={() => setDeleteProjectModalOpen(false)}
        onConfirm={handleDeleteProjectConfirm}
        title="Delete project"
        message="Deleting this project will move its conversations to the Miscellaneous section."
      />

      <SettingsMenu
        isOpen={settingsMenuOpen}
        onClose={() => setSettingsMenuOpen(false)}
      />
    </aside>
  );
}
