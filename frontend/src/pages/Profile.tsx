import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { User, Camera, Mail, Shield, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Profile = () => {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const res = await api.put('/users/profile', { name, avatar_url: avatarUrl });
      setUser(res.data.data);
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
       <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-accent font-bold transition-colors text-sm"
        >
          <ArrowLeft size={18} className="mr-2" />
          <span>Back</span>
        </button>

      <div className="bg-white dark:bg-[#1E1E1E] rounded-[2.5rem] shadow-sm border dark:border-gray-800 overflow-hidden">
        <div className="h-32 bg-accent/10 relative">
           <div className="absolute -bottom-12 left-10">
              <div className="relative group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-24 h-24 rounded-3xl object-cover border-4 border-white dark:border-[#1E1E1E] shadow-lg" />
                ) : (
                  <div className="w-24 h-24 rounded-3xl bg-accent flex items-center justify-center text-white text-3xl font-black border-4 border-white dark:border-[#1E1E1E] shadow-lg">
                    {user?.name?.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white cursor-pointer">
                  <Camera size={20} />
                </div>
              </div>
           </div>
        </div>

        <div className="pt-16 p-10 space-y-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Account Settings</h1>
            <p className="text-sm text-gray-500 font-medium">Update your personal information and avatar.</p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-accent rounded-2xl outline-none dark:text-white font-bold transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2.5 opacity-60">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    disabled
                    className="w-full pl-12 pr-5 py-4 bg-gray-100 dark:bg-gray-800 border-2 border-transparent rounded-2xl outline-none dark:text-white font-bold"
                    value={user?.email}
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Avatar URL</label>
                <div className="relative">
                  <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-accent rounded-2xl outline-none dark:text-white font-bold transition-all"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-gray-400 ml-1">Provide a direct link to an image (JPG, PNG, WebP).</p>
              </div>
            </div>

            <div className="pt-6 border-t dark:border-gray-800 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-xs font-bold text-gray-400">
                <Shield size={14} className="text-emerald-500" />
                <span>Verified {user?.role} Account</span>
              </div>
              <button
                type="submit"
                disabled={isUpdating}
                className="bg-accent text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-accent-hover transition-all shadow-lg shadow-accent/20 disabled:opacity-50 flex items-center space-x-2"
              >
                <Save size={16} />
                <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
