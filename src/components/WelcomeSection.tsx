'use client';

import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Plus
} from 'lucide-react';
import { useState, useEffect } from 'react';

export function WelcomeSection() {
  const [greeting, setGreeting] = useState('');
  const [animatedValues, setAnimatedValues] = useState({
    earnings: 0,
    reports: 0,
    pending: 0
  });

  const targetValues = {
    earnings: 2847.50,
    reports: 42,
    pending: 3
  };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Animate numbers
    const duration = 1500;
    const steps = 60;
    const increment = {
      earnings: targetValues.earnings / steps,
      reports: targetValues.reports / steps,
      pending: targetValues.pending / steps
    };

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setAnimatedValues({
          earnings: Math.round(increment.earnings * currentStep * 100) / 100,
          reports: Math.round(increment.reports * currentStep),
          pending: Math.round(increment.pending * currentStep)
        });
      } else {
        setAnimatedValues(targetValues);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, []);

  const stats = [
    {
      label: 'Total Earnings',
      value: `$${animatedValues.earnings.toLocaleString('en-US', {minimumFractionDigits: 2})}`,
      change: '+12.5%',
      isPositive: true,
      icon: TrendingUp,
      color: 'text-mint-600 bg-mint-100'
    },
    {
      label: 'Reports Generated',
      value: animatedValues.reports,
      change: 'This month',
      icon: CheckCircle,
      color: 'text-indigo-600 bg-indigo-100'
    },
    {
      label: 'Pending Uploads',
      value: animatedValues.pending,
      change: 'Needs review',
      icon: Clock,
      color: 'text-amber-600 bg-amber-100'
    }
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid lg:grid-cols-3 gap-6"
    >
      {/* Welcome Card */}
      <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50 via-white to-mint-50 p-6 rounded-2xl border border-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              {greeting}, Alex 👋
            </h1>
            <p className="text-slate-600">
            Here's your income verification dashboard for this month.
            </p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-mint-400 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">AC</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white/50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1 rounded-lg ${stat.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-slate-500">{stat.label}</span>
                </div>
                <div className="text-xl font-bold text-slate-900">
                  {stat.value}
                </div>
                <div className="text-xs text-slate-500">{stat.change}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <motion.button
            className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-medium">Connect new platform</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </motion.button>
          
          <motion.button
            className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-mint-600" />
              <span className="text-sm font-medium">Generate new report</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}