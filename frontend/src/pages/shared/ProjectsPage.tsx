import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  Check,
  Folder,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { projectsApi } from '../../api/projectsApi';
import { Project, CreateProjectPayload } from '../../types/project';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  PageHeader,
  SearchInput,
  LoadingSpinner,
  EmptyState,
  Button,
  Input,
  Textarea,
  Modal,
  Card,
  Pagination,
} from '../../components/ui';

const COLOR_PRESETS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isManager = user?.role === 'manager';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [colorCode, setColorCode] = useState<string>('#6366F1');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await projectsApi.getProjects();
      setProjects(data);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to fetch projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setColorCode(COLOR_PRESETS[0]);
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || '');
    setColorCode(project.color_code || COLOR_PRESETS[0]);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingProject(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { showToast('Project name is required', 'warning'); return; }
    setSubmitting(true);
    try {
      const payload: CreateProjectPayload = { name: name.trim(), description: description.trim() || undefined, color_code: colorCode };
      if (editingProject) {
        await projectsApi.updateProject(editingProject.id, payload);
        showToast(`Project "${name}" updated!`, 'success');
      } else {
        await projectsApi.createProject(payload);
        showToast(`Project "${name}" created!`, 'success');
      }
      closeModal();
      fetchProjects();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save project', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProject) return;
    setDeleting(true);
    try {
      await projectsApi.deleteProject(deletingProject.id);
      showToast(`Project "${deletingProject.name}" deleted.`, 'success');
      setDeletingProject(null);
      fetchProjects();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete project', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredProjects.length / pageSize) || 1;
  const paginatedProjects = filteredProjects.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<FolderKanban className="w-5 h-5" />}
        title="Projects & Categories"
        subtitle={isManager ? 'Create and manage project tags used for report classification.' : 'View available project categories for your weekly reports.'}
        action={
          isManager ? (
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
              New Project
            </Button>
          ) : undefined
        }
      />

      {/* Overview + Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 font-mono">{projects.length}</p>
            <p className="text-[11px] text-zinc-400">Total Projects</p>
          </div>
          <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-700" />
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{filteredProjects.length}</p>
            <p className="text-[11px] text-zinc-400">Shown</p>
          </div>
        </div>
        <SearchInput
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search projects..."
          containerClassName="w-full sm:w-72"
        />
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="flex justify-center pt-12"><LoadingSpinner message="Loading projects..." /></div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-12 h-12" />}
          title={searchQuery ? 'No matching projects found' : 'No projects created yet'}
          description={isManager ? 'Create your first project to organize team reports.' : 'No projects available yet. Ask your manager to add some.'}
          action={isManager ? <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>Create Project</Button> : undefined}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center shadow-sm" style={{ backgroundColor: `${project.color_code || '#6366f1'}20` }}>
                    <Folder className="w-5 h-5" style={{ color: project.color_code || '#6366f1' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color_code || '#6366f1' }} />
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate">{project.name}</h3>
                    </div>
                    {project.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{project.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <Layers className="w-3.5 h-3.5 text-primary-500" />
                  <span>{project.reports_count ?? 0} reports tagged</span>
                </div>

                {isManager && (
                  <div className="flex gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <Button variant="secondary" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => openEditModal(project)} className="flex-1">Edit</Button>
                    <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setDeletingProject(project)} className="flex-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">Delete</Button>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredProjects.length}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setPage(1);
              }}
              pageSizeOptions={[6, 12, 24]}
            />
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingProject ? 'Edit Project' : 'Create New Project'}
        titleIcon={<FolderKanban className="w-5 h-5" />}
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" loading={submitting} icon={editingProject ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />} onClick={(e: any) => handleSubmit(e)}>
              {editingProject ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Project Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q3 Client Platform"
            autoFocus
          />
          <Textarea
            label="Description (optional)"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe this project or category..."
          />
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Color Label
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setColorCode(color)}
                  className={`w-7 h-7 rounded-lg border-2 transition-all ${colorCode === color ? 'border-zinc-900 dark:border-white scale-110 shadow-md' : 'border-transparent hover:border-zinc-400 dark:hover:border-zinc-500'}`}
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {colorCode === color && <Check className="w-3 h-3 text-white mx-auto" />}
                </button>
              ))}
              <input
                type="color"
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
                className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                title="Custom color"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        title="Confirm Project Deletion"
        titleIcon={<AlertTriangle className="w-5 h-5 text-rose-500" />}
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeletingProject(null)}>Cancel</Button>
            <Button variant="danger" loading={deleting} icon={<Trash2 className="w-4 h-4" />} onClick={handleDelete}>Delete Project</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Are you sure you want to delete <strong className="text-zinc-900 dark:text-white">"{deletingProject?.name}"</strong>?
          </p>
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-400">
            This action cannot be undone. Reports previously tagged with this project will lose their project association.
          </div>
        </div>
      </Modal>
    </div>
  );
};
