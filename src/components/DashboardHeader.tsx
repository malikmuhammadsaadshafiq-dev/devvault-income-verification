'use client';

import { motion } from 'framer-motion';
import { 
  Bell, 
  Search, 
  User,
  Menu 
} from 'lucide-react';
import { useState } from 'react';

export function DashboardHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200"
    >
      <div className="flex items-center justify-between px-6 py-4 lg:px-8">
        <div className="flex items-center gap-4">
          {/* Mobile menu button - will be handled by parent */}
          <button className="lg:hidden p-2 text-slate-600 hover:text-slate-900">
            <Menu className="w-6 h-6" />
          </button>
          
          {/* Search */}
          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search reports..."
                className="pl-10 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all w-64"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <motion.button
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </motion.button>

          {/* User Profile */}
          <motion.button
            className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-mint-400 rounded-full flex items-center justify-center">
              <User weight="fill" className="w-4 h-4 text-white" />
            </div>
            <span className="hidden lg:block text-sm font-medium text-slate-900">Alex Chen</span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}