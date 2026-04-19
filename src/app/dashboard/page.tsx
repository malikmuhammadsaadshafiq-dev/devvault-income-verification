'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { WelcomeSection } from '@/components/WelcomeSection';
import { ConnectionsSection } from '@/components/ConnectionsSection';
import { UploadSection } from '@/components/UploadSection';
import { ReportSection } from '@/components/ReportSection';

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
      />
      
      <div className="lg:ml-64">
        <DashboardHeader />
        
        <main className="p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <WelcomeSection />
            
            {activeSection === 'overview' && (
              <>
                <ConnectionsSection />
                <UploadSection />
                <ReportSection />
              </>
            )}
            
            {activeSection === 'connections' && <ConnectionsSection standalone />}
            {activeSection === 'uploads' && <UploadSection standalone />}
            {activeSection === 'reports' && <ReportSection standalone />}
          </motion.div>
        </main>
      </div>
    </div>
  );
}