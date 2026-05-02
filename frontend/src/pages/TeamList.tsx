import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Plus, Users, Copy, Check, LogIn, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { Skeleton, EmptyState } from '../components/UI';
import { motion } from 'framer-motion';

export const TeamList = () => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => api.get('/users/teams').then(res => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post('/users/teams', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setIsCreateModalOpen(false);
      setTeamName('');
      toast.success('Team created!');
    },
  });

  const joinMutation = useMutation({
    mutationFn: (code: string) => api.post('/users/teams/join', { code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setIsJoinModalOpen(false);
      setJoinCode('');
      toast.success('Joined team!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to join team'),
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    toast.success('Code copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-full overflow-hidden">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Teams</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Collaborate with groups of people across projects.</p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="flex-1 sm:flex-none px-6 py-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl font-bold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center space-x-2"
          >
            <LogIn size={18} />
            <span>Join Team</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-1 sm:flex-none px-6 py-3 bg-accent text-white rounded-2xl font-bold text-sm hover:bg-accent-hover transition-all shadow-lg shadow-accent/20 flex items-center justify-center space-x-2"
          >
            <Plus size={18} />
            <span>Create Team</span>
          </button>
        </div>
      </header>

      {teams?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team: any, idx: number) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[2.5rem] shadow-sm border dark:border-gray-800 relative group overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-accent/10 rounded-2xl text-accent">
                  <Users size={28} />
                </div>
                <button 
                  onClick={() => copyToClipboard(team.code)}
                  className="flex flex-col items-center space-y-1 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all group/copy"
                >
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Join Code</span>
                  <div className="flex items-center space-x-1.5 font-black text-sm text-gray-900 dark:text-white">
                    <span>{team.code}</span>
                    {copiedId === team.code ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-gray-300 group-hover/copy:text-accent transition-colors" />}
                  </div>
                </button>
              </div>

              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 truncate">{team.name}</h3>
              
              <div className="flex items-center justify-between pt-6 border-t dark:border-gray-800 mt-4">
                <div className="flex items-center text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  <span className="flex items-center mr-4">
                    <Users size={14} className="mr-1.5" />
                    {team._count.members} Members
                  </span>
                  <span className="flex items-center">
                    <Shield size={14} className="mr-1.5" />
                    {team._count.projects} Projects
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState 
          title="No teams found" 
          description="Teams help you organize people and projects in one place." 
          icon={Users}
          action={
            <div className="flex space-x-3">
              <button onClick={() => setIsJoinModalOpen(true)} className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl font-bold text-sm">Join a Team</button>
              <button onClick={() => setIsCreateModalOpen(true)} className="px-6 py-2.5 bg-accent text-white rounded-xl font-bold text-sm">Create One</button>
            </div>
          }
        />
      )}

      {/* Create Team Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-[#1E1E1E] rounded-[2.5rem] shadow-2xl max-w-md w-full p-10">
            <h2 className="text-2xl font-black mb-6 text-gray-900 dark:text-white tracking-tight">Create New Team</h2>
            <form 
              onSubmit={(e) => { e.preventDefault(); createMutation.mutate(teamName); }}
              className="space-y-6"
            >
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Team Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent dark:border-gray-700 rounded-2xl px-5 py-4 focus:border-accent outline-none dark:text-white transition-all font-bold"
                  placeholder="e.g. Product Designers"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-6 py-3 font-bold text-gray-500">Cancel</button>
                <button 
                  type="submit"
                  disabled={createMutation.isPending || !teamName.trim()}
                  className="bg-accent text-white px-8 py-3 rounded-2xl font-bold hover:bg-accent-hover transition-all disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Join Team Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-[#1E1E1E] rounded-[2.5rem] shadow-2xl max-w-md w-full p-10">
            <h2 className="text-2xl font-black mb-6 text-gray-900 dark:text-white tracking-tight">Join a Team</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Enter the 6-character join code provided by your team owner.</p>
            <form 
              onSubmit={(e) => { e.preventDefault(); joinMutation.mutate(joinCode); }}
              className="space-y-6"
            >
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Join Code</label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent dark:border-gray-700 rounded-2xl px-5 py-4 focus:border-accent outline-none dark:text-white transition-all font-black text-center text-2xl tracking-[0.5em] uppercase"
                  placeholder="ABCDEF"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setIsJoinModalOpen(false)} className="px-6 py-3 font-bold text-gray-500">Cancel</button>
                <button 
                  type="submit"
                  disabled={joinMutation.isPending || joinCode.length < 4}
                  className="bg-accent text-white px-8 py-3 rounded-2xl font-bold hover:bg-accent-hover transition-all disabled:opacity-50"
                >
                  Join
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
