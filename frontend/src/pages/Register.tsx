import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { user, token } = response.data.data;
      setAuth(user, token);
      toast.success(`Welcome aboard, ${user.name}!`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212] py-12 px-4 sm:px-6 lg:px-8 w-full font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white dark:bg-[#1E1E1E] p-10 rounded-[2.5rem] shadow-xl border dark:border-gray-800"
      >
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white text-2xl font-black mb-4">T</div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">Join your team and start managing tasks today.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
              <input
                type="text"
                required
                className="appearance-none relative block w-full px-4 py-4 border dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 placeholder-gray-400 text-gray-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent focus:z-10 sm:text-sm transition-all"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <input
                type="email"
                required
                className="appearance-none relative block w-full px-4 py-4 border dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 placeholder-gray-400 text-gray-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent focus:z-10 sm:text-sm transition-all"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-4 border dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 placeholder-gray-400 text-gray-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent focus:z-10 sm:text-sm transition-all"
                placeholder="min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 transition-all shadow-lg shadow-accent/25 active:scale-[0.98]"
            >
              {loading ? 'Creating workspace...' : 'Get Started'}
            </button>
          </div>
        </form>
        <div className="text-center">
          <Link to="/login" className="text-accent hover:underline text-sm font-bold">
            Already have an account? Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
