import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LayoutDashboard, FolderKanban, LogOut, User, Moon, Sun, Menu, X, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const Layout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/teams', icon: Users, label: 'Teams' },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b dark:border-gray-800 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold">T</div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Ethara Task</h1>
          </div>
          <button className="lg:hidden text-gray-500" onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar min-h-0">
        {menuItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
              location.pathname === item.to
                ? 'bg-accent/10 text-accent font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="text-sm font-bold uppercase tracking-wider">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t dark:border-gray-800 space-y-4 shrink-0">
        <button
          onClick={() => setIsDark(!isDark)}
          className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
        >
          <div className="flex items-center space-x-3">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
            <span className="text-xs font-bold uppercase tracking-widest">{isDark ? 'Light' : 'Dark'}</span>
          </div>
        </button>

        <Link to="/profile" className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl overflow-hidden hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-transparent hover:border-accent/20">
          {user?.avatar_url ? (
            <img src={user.avatar_url} className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm" alt="" />
          ) : (
            <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold shrink-0">
              {user?.name?.charAt(0) || '?'}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black text-gray-900 dark:text-white truncate tracking-tight">{user?.name || 'User'}</span>
            <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">{user?.role || '...'}</span>
          </div>
        </Link>
        
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 p-3 w-full rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-black uppercase tracking-widest text-[10px]"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#121212] w-full overflow-hidden font-sans">
      <Toaster position="top-right" reverseOrder={false} />
      
      <aside className="hidden lg:flex w-64 bg-white dark:bg-[#1E1E1E] border-r dark:border-gray-800 flex-col z-20 shrink-0">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-[#1E1E1E] z-50 flex flex-col lg:hidden shadow-2xl">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-16 bg-white dark:bg-[#1E1E1E] border-b dark:border-gray-800 flex items-center justify-between px-6 z-30 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold">T</div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Ethara</h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"><Menu size={24} /></button>
        </header>

        <main className="flex-1 overflow-y-auto relative bg-gray-50 dark:bg-[#121212] custom-scrollbar overflow-x-hidden">
          <div className="p-4 md:p-10 max-w-full lg:max-w-[1400px] mx-auto w-full box-border min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="w-full">
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};
