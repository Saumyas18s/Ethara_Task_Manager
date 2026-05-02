import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { Plus, Users, Layout as LayoutIcon, Search, Briefcase } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Skeleton, EmptyState } from '../components/UI';
import { motion } from 'framer-motion';

const EMOJIS = ["🚀", "🎨", "💻", "📈", "🛡️", "🔥", "🌈", "🧩", "🏗️", "⚡"];
const COLORS = ["#5B4FCF", "#EF4444", "#10B981", "#F59E0B", "#3B82F6", "#EC4899", "#8B5CF6", "#06B6D4"];

export const ProjectList = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newProject, setNewProject] = useState({ 
    name: '', 
    description: '', 
    color: COLORS[0], 
    emoji: EMOJIS[0] 
  });

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(res => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsModalOpen(false);
      setNewProject({ name: '', description: '', color: COLORS[0], emoji: EMOJIS[0] });
      toast.success('Project created successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create project');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim()) {
      toast.error('Project name is required');
      return;
    }
    if (newProject.name.length < 2) {
      toast.error('Project name must be at least 2 characters');
      return;
    }
    
    const loadingToast = toast.loading('Creating project...');
    createMutation.mutate(newProject, {
      onSettled: () => toast.dismiss(loadingToast),
    });
  };

  const filteredProjects = projects?.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><Skeleton className="h-10 w-48 mb-2" /><Skeleton className="h-4 w-64" /></div>
          <Skeleton className="h-12 w-32 rounded-xl" />
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-56 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-12 max-w-full overflow-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight truncate">Projects</h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium mt-1 truncate">Manage and track your team initiatives.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search projects..." 
              className="w-full pl-10 pr-4 py-2 md:py-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-accent outline-none text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-accent text-white px-5 py-2.5 md:py-3 rounded-xl md:rounded-2xl flex items-center justify-center space-x-2 hover:bg-accent-hover transition-all shadow-lg shadow-accent/20 active:scale-95 whitespace-nowrap"
          >
            <Plus size={20} />
            <span className="font-bold">New Project</span>
          </button>
        </div>
      </header>

      {filteredProjects?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project: any, idx: number) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="min-w-0"
            >
              <Link
                to={`/projects/${project.id}`}
                className="bg-white dark:bg-[#1E1E1E] p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border-2 border-transparent dark:border-gray-800 hover:border-accent/40 transition-all group block relative overflow-hidden h-full flex flex-col"
              >
                <div 
                  className="absolute top-0 left-0 w-full h-1.5" 
                  style={{ backgroundColor: project.color || '#5B4FCF' }} 
                />
                
                <div className="flex justify-between items-start mb-6 shrink-0">
                  <div className="text-2xl md:text-3xl bg-gray-50 dark:bg-gray-800 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-2xl md:rounded-3xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                    {project.emoji || "🚀"}
                  </div>
                  <div className="flex -space-x-3 hover:space-x-1 transition-all duration-300 shrink-0">
                    {project.members?.slice(0, 4).map((member: any) => (
                      <div 
                        key={member.id}
                        title={member.user.name}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white dark:border-[#1E1E1E] bg-accent/10 flex items-center justify-center text-accent text-[10px] md:text-xs font-black shadow-sm"
                      >
                        {member.user.name.charAt(0)}
                      </div>
                    ))}
                    {project._count.members > 4 && (
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white dark:border-[#1E1E1E] bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 text-[10px] font-bold shadow-sm">
                        +{project._count.members - 4}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg md:text-2xl font-black text-gray-900 dark:text-white mb-2 group-hover:text-accent transition-colors truncate">
                    {project.name}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-6 h-10 font-medium leading-relaxed">
                    {project.description || 'No description provided for this project.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-5 border-t dark:border-gray-800 mt-auto">
                  <div className="flex items-center text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em]">
                    <span className="flex items-center mr-4">
                      <LayoutIcon size={14} className="mr-1.5" />
                      {project._count.tasks} Tasks
                    </span>
                  </div>
                  <div className="text-[10px] font-black bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg text-gray-500 dark:text-gray-400 uppercase tracking-widest truncate max-w-[100px]">
                    {project.owner.name.split(' ')[0]}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState 
          title="No projects found" 
          description={searchTerm ? "Try adjusting your search terms." : "Create your first project to get started!"} 
          icon={Briefcase}
          action={
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-accent text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-accent-hover"
            >
              Start Project
            </button>
          }
        />
      )}

      {/* New Project Modal - Responsive Update */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-[#1E1E1E] rounded-[2rem] md:rounded-[3rem] shadow-2xl max-w-lg w-full overflow-hidden"
          >
            <div className="p-6 md:p-10">
              <h2 className="text-2xl md:text-3xl font-black mb-8 text-gray-900 dark:text-white tracking-tight">New Project</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Project Name</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent dark:border-gray-700 rounded-2xl px-5 py-4 focus:border-accent outline-none dark:text-white transition-all font-bold"
                      placeholder="e.g. Design System"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    />
                  </div>
                  <div className="w-full sm:w-24 shrink-0 text-center">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Icon</label>
                    <div className="relative group mx-auto w-16 h-16 md:w-20 md:h-20">
                      <div className="w-full h-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent dark:border-gray-700 rounded-2xl md:rounded-3xl flex items-center justify-center text-3xl md:text-4xl cursor-pointer hover:border-accent transition-all">
                        {newProject.emoji}
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 p-3 bg-white dark:bg-gray-800 shadow-2xl border dark:border-gray-700 rounded-3xl grid grid-cols-5 gap-2 hidden group-hover:grid z-[110] w-64 md:w-72">
                        {EMOJIS.map(e => (
                          <button key={e} type="button" onClick={() => setNewProject({...newProject, emoji: e})} className="p-2 md:p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-xl md:text-2xl transition-all active:scale-90">{e}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Description</label>
                  <textarea
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent dark:border-gray-700 rounded-2xl px-5 py-4 focus:border-accent outline-none dark:text-white transition-all font-medium min-h-[100px] resize-none"
                    placeholder="Describe your goals..."
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Theme Color</label>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewProject({ ...newProject, color: c })}
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full transition-all ${newProject.color === c ? 'scale-125 ring-4 ring-offset-4 ring-accent' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-4 font-black text-gray-400 uppercase tracking-widest text-[11px] hover:text-gray-600 transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="bg-accent text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-accent-hover transition-all disabled:opacity-50 shadow-xl shadow-accent/25 active:scale-95"
                  >
                    {createMutation.isPending ? 'Deploying...' : 'Launch Project'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
