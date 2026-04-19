'use client';

import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  CloudUpload, 
  Plug, 
  FileText, 
  Settings,
  LogOut
} from 'lucide-react';
import { cva } from 'class-variance-authority';
import Link from 'next/link';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const navItem = cva(
  'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors w-full',
  {
    variants: {
      active: {
        true: 'bg-indigo-50 text-indigo-700',
        false: 'text-slate-600 hover:bg-slate-100',
      }
    }
  }
);

const navigation = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'connections', label: 'Connections', icon: Plug },
  { id: 'uploads', label: 'Uploads', icon: CloudUpload },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  return (
    <>
      {/* Overlay for mobile */}
      <div className="lg:hidden fixed inset-0 bg-black/20 z-10" />
      
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -256 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-20 flex flex-col"
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-mint-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DV</span>
            </div>
            <span className="font-bold text-slate-900">DevVault</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  className={navItem({ active: activeSection === item.id })}
                  onClick={() => setActiveSection(item.id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200">
          <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100 w-full transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}