import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { ArrowLeft, Send, Calendar, User as UserIcon, CheckCircle, List, FileText, Eye, Edit3, Trash2, MessageSquare, Split, Plus, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Skeleton, cn } from '../components/UI';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export const TaskForm = () => {
  const { projectId, taskId } = useParams();
  const isEditing = !!taskId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const [isMarkdownPreview, setIsMarkdownPreview] = useState(false);
  const [comment, setComment] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [subtaskTitles, setSubtaskTitles] = useState(['', '']);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    due_date: '',
    assignee_id: '',
  });

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => api.get(`/tasks/${taskId}`).then(res => res.data.data),
    enabled: isEditing,
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId || task?.project_id],
    queryFn: () => api.get(`/projects/${projectId || task?.project_id}`).then(res => res.data.data),
    enabled: !!(projectId || task?.project_id),
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
        assignee_id: task.assignee_id || '',
      });
    }
  }, [task]);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (isEditing) {
        return api.put(`/tasks/${taskId}`, data);
      } else {
        return api.post(`/projects/${projectId}/tasks`, data);
      }
    },
    onSuccess: () => {
      const pid = projectId || task?.project_id;
      queryClient.invalidateQueries({ queryKey: ['tasks', pid] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(isEditing ? 'Task updated!' : 'Task created!');
      if (!isEditing) navigate(-1);
      setIsEditingTitle(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  });

  const splitMutation = useMutation({
    mutationFn: (subtasks: string[]) => api.post(`/tasks/${taskId}/split`, { subtasks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsSplitModalOpen(false);
      setSubtaskTitles(['', '']);
      toast.success('Task split successfully!');
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => api.post(`/tasks/${taskId}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      setComment('');
      toast.success('Comment posted');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      navigate(-1);
      toast.success('Task deleted');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    const loadingToast = toast.loading(isEditing ? 'Updating task...' : 'Creating task...');
    mutation.mutate(formData, {
      onSettled: () => toast.dismiss(loadingToast),
    });
  };

  if (isEditing && taskLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 px-4">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2"><Skeleton className="h-[500px] rounded-[2.5rem]" /></div>
          <div><Skeleton className="h-[300px] rounded-[2.5rem]" /></div>
        </div>
      </div>
    );
  }

  const statusColors = {
    TODO: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    IN_PROGRESS: 'bg-indigo-50 text-accent dark:bg-accent/10 dark:text-accent',
    DONE: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
  };

  const priorityColors = {
    LOW: 'bg-blue-50 text-blue-500 dark:bg-blue-900/20',
    MEDIUM: 'bg-amber-50 text-amber-500 dark:bg-amber-900/20',
    HIGH: 'bg-red-50 text-red-500 dark:bg-red-900/20'
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 px-4 md:px-6 pb-20">
      <div className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-accent font-black uppercase tracking-widest text-[10px] transition-all">
          <ArrowLeft size={16} className="mr-2" />
          <span>Back</span>
        </button>
        <div className="flex space-x-3">
          {isEditing && (
            <button onClick={() => setIsSplitModalOpen(true)} className="flex items-center text-accent hover:bg-accent/10 font-black uppercase tracking-widest text-[10px] transition-all bg-white dark:bg-[#1E1E1E] border dark:border-gray-800 px-5 py-2.5 rounded-2xl">
              <Split size={14} className="mr-2" />
              <span>Split</span>
            </button>
          )}
          {isEditing && (currentUser?.role === 'ADMIN' || project?.owner_id === currentUser?.id) && (
            <button onClick={() => { if(confirm('Delete this task?')) deleteMutation.mutate(); }} className="flex items-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-black uppercase tracking-widest text-[10px] transition-all px-5 py-2.5 rounded-2xl">
              <Trash2 size={14} className="mr-2" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 items-start">
        <div className="lg:col-span-2 space-y-8 min-w-0">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1E1E1E] p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm border dark:border-gray-800">
            <div className="mb-10">
              {isEditing && !isEditingTitle ? (
                <div className="group cursor-pointer flex items-start justify-between gap-4" onClick={() => setIsEditingTitle(true)}>
                  <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight group-hover:text-accent transition-colors break-words leading-[1.1]">
                    {formData.title || 'Untitled Task'}
                  </h1>
                  <Edit3 size={20} className="text-gray-300 group-hover:text-accent shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              ) : (
                <input
                  type="text"
                  required
                  autoFocus={isEditingTitle}
                  className="w-full text-3xl md:text-5xl font-black bg-transparent border-b-4 border-dashed border-gray-100 dark:border-gray-800 focus:border-accent outline-none dark:text-white transition-all pb-4 leading-[1.1]"
                  placeholder="Task title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  onBlur={() => { if(isEditing) mutation.mutate({ title: formData.title }); setIsEditingTitle(false); }}
                />
              )}
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center ml-1">
                    <FileText size={14} className="mr-3 text-accent" />
                    Description
                  </label>
                  <button type="button" onClick={() => setIsMarkdownPreview(!isMarkdownPreview)} className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-[10px] font-black text-accent uppercase tracking-widest hover:bg-accent/10 transition-all flex items-center">
                    {isMarkdownPreview ? <Edit3 size={12} className="mr-2" /> : <Eye size={12} className="mr-2" />}
                    {isMarkdownPreview ? 'Edit' : 'Preview'}
                  </button>
                </div>
                
                <div className="relative min-h-[300px]">
                  {isMarkdownPreview ? (
                    <div className="prose dark:prose-invert max-w-none p-8 bg-gray-50/50 dark:bg-gray-800/30 rounded-[2rem] text-gray-700 dark:text-gray-300 min-h-[300px] overflow-hidden break-words font-medium leading-relaxed">
                      <ReactMarkdown>{formData.description || '_No description provided._'}</ReactMarkdown>
                    </div>
                  ) : (
                    <textarea
                      className="w-full bg-gray-50 dark:bg-gray-800/30 border-2 border-transparent focus:border-accent/20 rounded-[2rem] p-8 outline-none dark:text-white transition-all min-h-[300px] resize-none text-base md:text-lg leading-relaxed font-medium"
                      placeholder="Use Markdown to structure your thoughts..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  )}
                </div>
              </div>

              {isEditing && task?.subtasks?.length > 0 && (
                <div className="space-y-6 pt-4">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center ml-1">
                    <Split size={14} className="mr-3 text-accent" />
                    Subtasks
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {task.subtasks.map((sub: any) => (
                      <div key={sub.id} onClick={() => navigate(`/tasks/${sub.id}`)} className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-transparent hover:border-accent/20 transition-all cursor-pointer group flex flex-col justify-between h-24">
                        <p className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-accent transition-colors truncate">{sub.title}</p>
                        <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                          <span className={cn("w-2 h-2 rounded-full mr-2", sub.status === 'DONE' ? 'bg-emerald-500' : 'bg-gray-400')} />
                          {sub.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-10 border-t dark:border-gray-800 flex justify-end">
                {!isEditing ? (
                  <button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto bg-accent text-white px-12 py-4 rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-accent-hover transition-all shadow-xl shadow-accent/30 disabled:opacity-50 active:scale-95">
                    Create Task
                  </button>
                ) : (formData.description !== task?.description && !isMarkdownPreview) && (
                   <button type="submit" className="text-[11px] font-black text-accent uppercase tracking-widest hover:underline px-4">
                    Save Changes
                  </button>
                )}
              </div>
            </div>
          </form>

          {isEditing && (
            <div className="bg-white dark:bg-[#1E1E1E] p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm border dark:border-gray-800 space-y-10">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center px-2">
                <MessageSquare size={24} className="mr-4 text-accent" />
                Activity & Discussion
              </h3>

              <div className="flex flex-col sm:flex-row gap-5">
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent font-black shrink-0 hidden sm:flex border-2 border-white dark:border-gray-800">
                  {currentUser?.name.charAt(0)}
                </div>
                <div className="flex-1 relative">
                  <textarea
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-accent/20 rounded-[1.5rem] p-6 outline-none dark:text-white transition-all resize-none text-sm font-medium pr-16 min-h-[120px]"
                    placeholder="Ask a question or post an update..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && comment.trim() && !commentMutation.isPending) {
                        e.preventDefault();
                        commentMutation.mutate(comment);
                      }
                    }}
                  />
                  <button onClick={() => commentMutation.mutate(comment)} disabled={!comment.trim() || commentMutation.isPending} className="absolute right-4 bottom-4 p-3 bg-accent text-white rounded-2xl hover:bg-accent-hover transition-all disabled:opacity-50 shadow-lg shadow-accent/20">
                    <Send size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-10 pt-4">
                {task?.comments?.map((c: any) => (
                  <div key={c.id} className="flex gap-5 group/comment">
                    {c.author.avatar_url ? (
                      <img src={c.author.avatar_url} className="w-12 h-12 rounded-2xl object-cover shrink-0 border-2 border-white dark:border-gray-800 shadow-sm" alt="" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-500 font-black shrink-0 border dark:border-gray-700 text-sm transition-transform group-hover/comment:scale-110">{c.author.name.charAt(0)}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-4 mb-2">
                        <span className="font-black text-sm text-gray-900 dark:text-white tracking-tight">{c.author.name}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em]">{formatDistanceToNow(new Date(c.created_at))} ago</span>
                      </div>
                      <div className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed font-medium break-words">
                        {c.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sidebar Properties */}
        <div className="space-y-8 shrink-0 lg:w-80 w-full">
          <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[2.5rem] shadow-sm border dark:border-gray-800 space-y-10">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-1">Properties</h3>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center ml-1">
                  <CheckCircle size={14} className="mr-3 text-accent" />
                  Current Status
                </label>
                <select className={cn("w-full px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest outline-none transition-all appearance-none cursor-pointer border-2 border-transparent shadow-sm", statusColors[formData.status as keyof typeof statusColors] || 'bg-gray-100')} value={formData.status} onChange={(e) => { const s = e.target.value; setFormData({ ...formData, status: s }); if (isEditing) mutation.mutate({ status: s }); }}>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center ml-1">
                  <List size={14} className="mr-3 text-accent" />
                  Priority Level
                </label>
                <select className={cn("w-full px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest outline-none transition-all appearance-none cursor-pointer border-2 border-transparent shadow-sm", priorityColors[formData.priority as keyof typeof priorityColors] || 'bg-gray-100')} value={formData.priority} onChange={(e) => { const p = e.target.value; setFormData({ ...formData, priority: p }); if (isEditing) mutation.mutate({ priority: p }); }}>
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High Priority</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center ml-1">
                  <Calendar size={14} className="mr-3 text-accent" />
                  Deadline
                </label>
                <input type="date" className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent dark:border-gray-700 rounded-2xl px-6 py-4 text-sm font-black dark:text-white outline-none focus:border-accent transition-all cursor-pointer shadow-sm" value={formData.due_date} onChange={(e) => { const d = e.target.value; setFormData({ ...formData, due_date: d }); if (isEditing) mutation.mutate({ due_date: d }); }} />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center ml-1">
                  <UserIcon size={14} className="mr-3 text-accent" />
                  Assignee
                </label>
                <select className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent dark:border-gray-700 rounded-2xl px-6 py-4 text-sm font-black dark:text-white outline-none focus:border-accent transition-all cursor-pointer appearance-none shadow-sm" value={formData.assignee_id} onChange={(e) => { const a = e.target.value; setFormData({ ...formData, assignee_id: a }); if (isEditing) mutation.mutate({ assignee_id: a }); }}>
                  <option value="">Unassigned</option>
                  {project?.members?.map((member: any) => (
                    <option key={member.user_id} value={member.user_id}>{member.user.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-accent/10 p-10 rounded-[2.5rem] border border-accent/20 hidden lg:block">
            <h4 className="text-accent font-black text-xs uppercase tracking-widest mb-3">Workspace Tip</h4>
            <p className="text-accent/70 text-[11px] leading-relaxed font-bold">
              All property changes are saved instantly. Use Markdown for rich task descriptions.
            </p>
          </div>
        </div>
      </div>

      {/* Split Task Modal */}
      <AnimatePresence>
        {isSplitModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white dark:bg-[#1E1E1E] rounded-[3rem] shadow-2xl max-w-lg w-full p-12">
              <h2 className="text-3xl font-black mb-4 text-gray-900 dark:text-white tracking-tight">Split Task</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-10 font-medium">Divide this task into smaller chunks.</p>
              <form 
                onSubmit={(e) => { 
                  e.preventDefault(); 
                  splitMutation.mutate(subtaskTitles.filter(t => t.trim())); 
                }}
                className="space-y-5"
              >
                <div className="space-y-5 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                  {subtaskTitles.map((title, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <input
                        type="text"
                        required
                        className="flex-1 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent dark:border-gray-700 rounded-2xl px-6 py-4 focus:border-accent outline-none dark:text-white transition-all font-bold text-sm"
                        placeholder={`Subtask ${idx + 1}`}
                        value={title}
                        onChange={(e) => {
                          const newTitles = [...subtaskTitles];
                          newTitles[idx] = e.target.value;
                          setSubtaskTitles(newTitles);
                        }}
                      />
                      {subtaskTitles.length > 2 && (
                        <button type="button" onClick={() => setSubtaskTitles(subtaskTitles.filter((_, i) => i !== idx))} className="p-3 text-gray-300 hover:text-red-500 transition-colors"><X size={24} /></button>
                      )}
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={() => setSubtaskTitles([...subtaskTitles, ''])}
                    className="w-full py-5 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] hover:border-accent/40 hover:text-accent transition-all flex items-center justify-center"
                  >
                    <Plus size={18} className="mr-3" />
                    Add Subtask
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-10">
                  <button type="button" onClick={() => setIsSplitModalOpen(false)} className="px-8 py-4 font-black text-gray-400 uppercase tracking-widest text-[11px] hover:text-gray-600 transition-colors">Discard</button>
                  <button 
                    type="submit"
                    disabled={splitMutation.isPending || subtaskTitles.filter(t => t.trim()).length < 2}
                    className="bg-accent text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-accent-hover transition-all disabled:opacity-50 shadow-xl shadow-accent/30"
                  >
                    {splitMutation.isPending ? 'Splitting...' : 'Confirm Split'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
