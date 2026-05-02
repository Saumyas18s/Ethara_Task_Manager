import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { CheckCircle2, Clock, ListTodo, AlertCircle, Calendar, Layout, ArrowRight, Plus } from 'lucide-react';
import { motion, animate } from 'framer-motion';
import React, { useEffect, useRef } from 'react';
import { Skeleton } from '../components/UI';
import { Link, useNavigate } from 'react-router-dom';

const CountUp = ({ value }: { value: number }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(0, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate(value) {
        node.textContent = Math.round(value).toString();
      },
    });

    return () => controls.stop();
  }, [value]);

  return <span ref={nodeRef}>0</span>;
};

export const Dashboard = () => {
  const navigate = useNavigate();
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(res => res.data.data),
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(res => res.data.data),
  });

  if (statsLoading || projectsLoading) {
    return (
      <div className="space-y-10">
        <header>
          <Skeleton className="h-10 w-48 mb-2 rounded-xl" />
          <Skeleton className="h-4 w-64 rounded-lg" />
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-[2rem]" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2"><Skeleton className="h-80 rounded-[2.5rem]" /></div>
          <Skeleton className="h-80 rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Tasks', value: stats?.total_tasks || 0, icon: ListTodo, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Overdue', value: stats?.overdue_count || 0, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Working On', value: stats?.by_status?.IN_PROGRESS || 0, icon: Clock, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Completed', value: stats?.by_status?.DONE || 0, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-8 md:space-y-12 max-w-full overflow-hidden">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight truncate">Overview</h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium mt-1 truncate">Stay on top of your workspace.</p>
        </div>
        <div className="flex space-x-2 md:space-x-3 w-full sm:w-auto shrink-0">
           <button 
            onClick={() => navigate('/projects')}
            className="flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-all shadow-sm"
          >
            Projects
          </button>
          <button 
            onClick={() => navigate('/projects')}
            className="flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 bg-accent text-white rounded-xl md:rounded-2xl font-bold text-xs md:text-sm hover:bg-accent-hover transition-all shadow-lg shadow-accent/20 flex items-center justify-center space-x-2"
          >
            <Plus size={16} className="md:w-5 md:h-5" />
            <span>New Task</span>
          </button>
        </div>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, idx) => (
          <motion.div 
            key={stat.label} 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white dark:bg-[#1E1E1E] p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border dark:border-gray-800 flex items-center space-x-4 md:space-x-6 hover:scale-[1.02] transition-all"
          >
            <div className={`p-3 md:p-5 rounded-xl md:rounded-2xl ${stat.bg} ${stat.color} shrink-0`}>
              <stat.icon className="w-6 h-6 md:w-8 md:h-8" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] md:text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 truncate">{stat.label}</p>
              <p className="text-xl md:text-3xl font-black text-gray-900 dark:text-white leading-none truncate">
                <CountUp value={stat.value} />
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
        {/* Recent Tasks */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6 min-w-0">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center px-2">
            <Calendar className="mr-3 text-accent" size={20} />
            Recent Tasks
          </h2>
          
          <div className="bg-white dark:bg-[#1E1E1E] rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left table-fixed min-w-[500px]">
                <thead className="bg-gray-50/50 dark:bg-gray-800/30 text-gray-400 dark:text-gray-500 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black">
                  <tr>
                    <th className="px-6 md:px-8 py-4 md:py-5 w-1/2">Task Name</th>
                    <th className="px-6 md:px-8 py-4 md:py-5 w-1/4">Project</th>
                    <th className="px-6 md:px-8 py-4 md:py-5 w-1/4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-800">
                  {stats?.my_tasks?.length > 0 ? (
                    stats.my_tasks.map((task: any) => (
                      <tr 
                        key={task.id} 
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 md:px-8 py-4 md:py-6 overflow-hidden">
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-gray-900 dark:text-white group-hover:text-accent transition-colors truncate text-sm md:text-base">{task.title}</span>
                            <span className="text-[10px] md:text-[11px] text-gray-400 font-medium mt-1 truncate">Due {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}</span>
                          </div>
                        </td>
                        <td className="px-6 md:px-8 py-4 md:py-6 overflow-hidden">
                          <div className="flex items-center space-x-2 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                            <span className="text-xs md:text-sm font-bold text-gray-500 dark:text-gray-400 truncate">{task.project.name}</span>
                          </div>
                        </td>
                        <td className="px-6 md:px-8 py-4 md:py-6 text-right">
                          <span className={`inline-block px-2 md:px-3 py-1 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest truncate ${
                            task.status === 'DONE' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' :
                            task.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' :
                            'bg-gray-100 text-gray-500 dark:bg-gray-700'
                          }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-8 py-16 text-center text-gray-400 font-medium text-sm">
                        No active tasks assigned to you.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {stats?.my_tasks?.length > 0 && (
              <div className="p-4 md:p-6 bg-gray-50/50 dark:bg-gray-800/30 border-t dark:border-gray-800 flex justify-center">
                <Link to="/projects" className="text-[10px] md:text-xs font-black text-accent hover:underline flex items-center uppercase tracking-widest">
                  View All Projects <ArrowRight size={14} className="ml-2" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* My Projects Sidebar */}
        <div className="space-y-4 md:space-y-6 min-w-0">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center px-2">
            <Layout className="mr-3 text-accent" size={20} />
            My Projects
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {projects?.slice(0, 5).map((project: any, idx: number) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + (idx * 0.05) }}
              >
                <Link
                  to={`/projects/${project.id}`}
                  className="block bg-white dark:bg-[#1E1E1E] p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border-2 border-transparent hover:border-accent/20 dark:border-gray-800 transition-all group overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="text-xl md:text-2xl p-2 bg-gray-50 dark:bg-gray-800 rounded-lg md:rounded-xl group-hover:scale-110 transition-transform shrink-0">
                      {project.emoji || "🚀"}
                    </div>
                    <div className="flex -space-x-1.5 md:-space-x-2 shrink-0">
                      {project.members?.slice(0, 3).map((m: any) => (
                        <div key={m.id} className="w-6 h-6 md:w-7 md:h-7 rounded-full border-2 border-white dark:border-[#1E1E1E] bg-accent/10 flex items-center justify-center text-accent text-[7px] md:text-[8px] font-black shrink-0">
                          {m.user.name.charAt(0)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-accent transition-colors truncate text-sm md:text-base">{project.name}</h3>
                  <div className="mt-3 md:mt-4 flex items-center justify-between text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">
                    <span className="truncate">{project._count.tasks} Tasks</span>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-5px] group-hover:translate-x-0 text-accent shrink-0" />
                  </div>
                </Link>
              </motion.div>
            ))}
            
            {(!projects || projects.length === 0) && (
              <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800 text-center col-span-full">
                <p className="text-sm text-gray-400 font-medium">No projects yet.</p>
                <button 
                  onClick={() => navigate('/projects')}
                  className="mt-4 text-[10px] font-black text-accent uppercase tracking-widest hover:underline"
                >
                  Create One
                </button>
              </div>
            )}
          </div>
          
          {projects?.length > 5 && (
            <Link
              to="/projects"
              className="flex items-center justify-center p-4 text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest hover:text-accent transition-colors"
            >
              View all projects ({projects.length})
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
