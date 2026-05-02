import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Plus, Settings, UserPlus, Trash2, History, ChevronRight, MessageSquare, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import { Skeleton, cn } from '../components/UI';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export const ProjectDetail = () => {
  const { projectId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [memberEmail, setMemberEmail] = useState('');
  const [showActivity, setShowActivity] = useState(false);

  const { data: project, isLoading: projectLoading, isError: projectError } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(res => res.data.data),
    retry: 1,
  });

  const { data: tasks, isLoading: tasksLoading, isError: tasksError } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => api.get(`/projects/${projectId}/tasks`).then(res => res.data.data),
    retry: 1,
  });

  const reorderMutation = useMutation({
    mutationFn: (newTasks: any[]) => api.post('/tasks/reorder', { tasks: newTasks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
    onError: () => toast.error('Failed to save task order'),
  });

  const addMemberMutation = useMutation({
    mutationFn: (email: string) => api.post(`/projects/${projectId}/members`, { email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setMemberEmail('');
      toast.success('Member added!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add member'),
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/projects/${projectId}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Member removed');
    },
  });

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const currentTasks = Array.isArray(tasks) ? Array.from(tasks) : [];
    const taskToMove = currentTasks.find((t: any) => t.id === draggableId);
    
    if (taskToMove) {
      const sourceColumnTasks = currentTasks.filter((t: any) => t.status === source.droppableId).sort((a, b) => a.order - b.order);
      const destColumnTasks = destination.droppableId === source.droppableId 
        ? sourceColumnTasks 
        : currentTasks.filter((t: any) => t.status === destination.droppableId).sort((a, b) => a.order - b.order);

      sourceColumnTasks.splice(source.index, 1);
      
      if (source.droppableId === destination.droppableId) {
        sourceColumnTasks.splice(destination.index, 0, taskToMove);
        sourceColumnTasks.forEach((t, idx) => t.order = idx);
      } else {
        taskToMove.status = destination.droppableId;
        destColumnTasks.splice(destination.index, 0, taskToMove);
        sourceColumnTasks.forEach((t, idx) => t.order = idx);
        destColumnTasks.forEach((t, idx) => t.order = idx);
      }

      const reorderPayload = currentTasks.map((t: any) => ({
        id: t.id,
        status: t.status,
        order: t.order
      }));

      reorderMutation.mutate(reorderPayload);
    }
  };

  if (projectError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 bg-red-50 text-red-500 rounded-full mb-4">
          <AlertTriangle size={48} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Project not found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">The project you are looking for doesn't exist or you don't have access.</p>
        <Link to="/projects" className="bg-accent text-white px-6 py-2 rounded-xl font-bold">Back to Projects</Link>
      </div>
    );
  }

  if (projectLoading || tasksLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[600px] rounded-[2.5rem]" />)}
        </div>
      </div>
    );
  }

  const columns = [
    { id: 'TODO', title: 'To Do', color: 'bg-gray-100 dark:bg-gray-800/40' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-indigo-50/50 dark:bg-accent/5' },
    { id: 'DONE', title: 'Done', color: 'bg-emerald-50/50 dark:bg-emerald-950/5' },
  ];

  const isAdmin = user?.role === 'ADMIN' || project?.owner_id === user?.id;
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  return (
    <div className="space-y-8 relative">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center space-x-5">
          <div className="text-5xl p-4 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 select-none">
            {project?.emoji || "🚀"}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none">{project?.name}</h1>
              <div 
                className="w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" 
                style={{ backgroundColor: project?.color || '#5B4FCF' }} 
              />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">{project?.description || 'Build something amazing.'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button 
            onClick={() => setShowActivity(!showActivity)}
            className="p-3 text-gray-500 hover:text-accent bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl transition-all shadow-sm"
            title="Activity Log"
          >
            <History size={22} />
          </button>
          <Link
            to={`/projects/${projectId}/tasks/new`}
            className="bg-accent text-white px-6 py-3 rounded-2xl flex items-center space-x-2 hover:bg-accent-hover transition-all shadow-lg shadow-accent/20 active:scale-95 flex-1 md:flex-none justify-center font-bold"
          >
            <Plus size={20} />
            <span>New Task</span>
          </Link>
          {isAdmin && (
            <button className="p-3 text-gray-500 hover:text-gray-700 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl transition-all shadow-sm">
              <Settings size={22} />
            </button>
          )}
        </div>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="overflow-x-auto pb-6 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex lg:grid lg:grid-cols-3 gap-6 md:gap-8 min-w-[900px] lg:min-w-0">
            {columns.map(column => (
              <Droppable key={column.id} droppableId={column.id}>
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`${column.color} p-6 rounded-[2.5rem] min-h-[600px] border-2 border-transparent transition-colors ${snapshot.isDraggingOver ? 'border-accent/20 bg-accent/5' : ''}`}
                >
                  <div className="flex justify-between items-center mb-8 px-2">
                    <h3 className="font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest text-[11px] flex items-center">
                      <span className={cn(
                        "w-2.5 h-2.5 rounded-full mr-2.5",
                        column.id === 'TODO' ? 'bg-gray-400' : column.id === 'IN_PROGRESS' ? 'bg-accent' : 'bg-emerald-400'
                      )} />
                      {column.title}
                    </h3>
                    <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-xl text-[11px] font-black text-gray-400 dark:text-gray-500 shadow-sm border dark:border-gray-700">
                      {safeTasks.filter((t: any) => t.status === column.id).length}
                    </span>
                  </div>

                  <div className="space-y-5">
                    {safeTasks.filter((t: any) => t.status === column.id).sort((a: any, b: any) => a.order - b.order).map((task: any, index: number) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => navigate(`/tasks/${task.id}`)}
                            style={{
                              ...provided.draggableProps.style,
                              transform: snapshot.isDragging 
                                ? `${provided.draggableProps.style?.transform} rotate(1.5deg)` 
                                : provided.draggableProps.style?.transform
                            }}
                            className={cn(
                              "bg-white dark:bg-[#1E1E1E] p-6 rounded-3xl shadow-sm border-2 border-transparent dark:border-gray-800 hover:border-accent/30 dark:hover:border-accent/30 transition-all group cursor-pointer",
                              snapshot.isDragging ? 'shadow-2xl ring-4 ring-accent/10 border-accent/50 z-50' : '',
                              task.due_date && new Date(task.due_date) < new Date() && task.status !== 'DONE' ? 'overdue-row' : ''
                            )}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg",
                                task.priority === 'HIGH' ? 'bg-red-50 text-red-500 dark:bg-red-900/20' :
                                task.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' :
                                'bg-indigo-50 text-accent dark:bg-accent/10'
                              )}>
                                {task.priority}
                              </span>
                              <div className="text-gray-300 group-hover:text-accent transition-colors">
                                <ChevronRight size={18} />
                              </div>
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2 leading-tight text-lg group-hover:text-accent transition-colors">{task.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-5 leading-relaxed font-medium">{task.description}</p>
                            
                            <div className="flex justify-between items-center pt-5 border-t dark:border-gray-800">
                              <div className="flex items-center space-x-4">
                                {task.due_date && (
                                  <div className={cn(
                                    "flex items-center text-xs font-bold",
                                    new Date(task.due_date) < new Date() && task.status !== 'DONE' ? 'text-red-500' : 'text-gray-400'
                                  )}>
                                    <div className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: 'currentColor' }} />
                                    {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </div>
                                )}
                                {task._count?.comments > 0 && (
                                  <div className="flex items-center text-xs font-bold text-gray-400">
                                    <MessageSquare size={14} className="mr-1.5" />
                                    {task._count.comments}
                                  </div>
                                )}
                              </div>
                              <div 
                                title={task.assignee?.name || 'Unassigned'}
                                className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center text-accent text-xs font-black border-2 border-white dark:border-gray-800 shadow-sm"
                              >
                                {task.assignee?.name?.charAt(0) || '?'}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
          </div>
          </div>
          </DragDropContext>
      {/* Activity Log Overlay */}
      <AnimatePresence>
        {showActivity && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActivity(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-[#1E1E1E] shadow-2xl z-[70] p-10 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center tracking-tight">
                  <History className="mr-4 text-accent" size={28} />
                  Activity
                </h2>
                <button 
                  onClick={() => setShowActivity(false)}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors group"
                >
                  <Plus size={28} className="rotate-45 text-gray-400 group-hover:text-red-500 transition-colors" />
                </button>
              </div>

              <div className="space-y-8">
                {project?.activityLogs?.length > 0 ? (
                  project.activityLogs.map((log: any) => (
                    <div key={log.id} className="relative pl-10 pb-8 border-l-2 border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                      <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-accent border-4 border-white dark:border-[#1E1E1E] shadow-sm" />
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight uppercase text-[11px] mb-1 opacity-50">{log.action.replace('_', ' ')}</p>
                        <p className="text-base text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{log.details}</p>
                        <div className="flex items-center mt-3 space-x-3">
                          <div className="w-6 h-6 bg-accent/10 dark:bg-accent/20 rounded-full flex items-center justify-center text-[10px] text-accent font-black">
                            {log.user.name.charAt(0)}
                          </div>
                          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{log.user.name} • {formatDistanceToNow(new Date(log.created_at))} ago</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-10 font-medium">No activity recorded yet.</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Team Section */}
      <div className="fixed bottom-10 right-10 z-50">
        <div className="group relative">
          <button className="bg-white dark:bg-[#1E1E1E] text-accent p-5 rounded-[2rem] shadow-2xl border dark:border-gray-700 hover:scale-110 transition-all active:scale-95 flex items-center space-x-3 font-black uppercase tracking-widest text-[11px]">
            <Plus size={20} />
            <span>Team</span>
          </button>
          <div className="absolute bottom-full right-0 mb-6 w-80 bg-white dark:bg-[#1E1E1E] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border dark:border-gray-700 p-8 opacity-0 translate-y-6 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out">
            <h3 className="text-xl font-black mb-6 text-gray-900 dark:text-white tracking-tight">Project Team</h3>
            <form 
              onSubmit={(e) => { e.preventDefault(); addMemberMutation.mutate(memberEmail); }}
              className="mb-8 flex space-x-2"
            >
              <input
                type="email"
                placeholder="Team member email"
                className="flex-1 text-sm bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent dark:border-gray-700 rounded-2xl px-4 py-3 focus:border-accent outline-none dark:text-white transition-all font-medium"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
              />
              <button 
                disabled={addMemberMutation.isPending}
                className="bg-accent text-white p-3 rounded-2xl hover:bg-accent-hover transition-all disabled:opacity-50 shadow-lg shadow-accent/20"
              >
                <Plus size={20} />
              </button>
            </form>
            <div className="space-y-5 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
              {project?.members?.map((member: any) => (
                <div key={member.id} className="flex justify-between items-center group/member">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-accent/10 rounded-2xl flex items-center justify-center text-accent text-sm font-black border-2 border-white dark:border-gray-800 shadow-sm transition-transform group-hover/member:scale-110">
                      {member.user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 dark:text-white leading-none tracking-tight">{member.user.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-black mt-1.5 tracking-widest">{member.role}</p>
                    </div>
                  </div>
                  {isAdmin && member.user_id !== project.owner_id && (
                    <button 
                      onClick={() => deleteMemberMutation.mutate(member.user_id)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover/member:opacity-100 transition-all p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
