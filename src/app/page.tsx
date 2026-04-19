'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Download, Shield, Zap, Bank, Settings, FileText } from '@phosphor-icons/react';
import Link from 'next/link';

const features = [
  {
    icon: Bank,
    title: "Bank Statement Analysis",
    description: "Upload CSV/PDF statements and get instant income categorization and verification reports."
  },
  {
    icon: Settings,
    title: "Platform Integration",
    description: "Connect Stripe, GitHub Sponsors, and BuyMeACoffee for comprehensive earnings tracking."
  },
  {
    icon: FileText,
    title: "Export PDF Reports",
    description: "Generate professional income verification reports ready for submission to lenders or agencies."
  }
];

const steps = [
  { 
    step: "1", 
    title: "Connect Your Sources", 
    description: "Link your bank accounts and development platforms"
  },
  { 
    step: "2", 
    title: "Upload Statements", 
    description: "Drag & drop your bank statements and platform earnings"
  },
  { 
    step: "3", 
    title: "Generate Report", 
    description: "Get instant verification results and export PDF"
  }
];

export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-mint-50" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-30 animate-drift" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-mint-100 rounded-full blur-3xl opacity-30 animate-drift" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Shield weight="fill" className="w-4 h-4" />
                <span>Trusted by 10,000+ developers</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6">
                Income Verification for
                <span className="gradient-text"> Independent Developers</span>
              </h1>
              
              <p className="text-xl text-slate-600 mb-8 max-w-lg leading-relaxed">
                Generate professional income reports for loan applications, visa processes, or client onboarding.
                Connect your bank accounts and developer platforms to get verified in minutes, not weeks.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <motion.button 
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-luxe hover:shadow-indigo-200/50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
                
                <button className="inline-flex items-center justify-center gap-2 border border-slate-300 bg-white text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
                  <Download className="w-5 h-5" />
                  Sample Report
                </button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              className="relative"
            >
              <div className="premium-card relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-mint-100 rounded-full blur-3xl opacity-50" />
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4">Verification Dashboard</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium">Platform Earnings</span>
                        <span className="text-sm text-green-600 font-mono">$2,847.50</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium">Bank Deposits</span>
                        <span className="text-sm text-blue-600 font-mono">$3,125.00</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="w-3/4 h-full bg-gradient-to-r from-indigo-500 to-mint-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-6">
              Built for Modern Developers
            </h2>
            <p className="text-xl text-slate-600">
              Connect everything in one place. Get verified reports that banks and clients actually trust.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="premium-card hover:-translate-y-1"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg mb-4">
                    <Icon weight="fill" className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 sm:py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-6">
              Get Verified in 3 Simple Steps
            </h2>
            <p className="text-xl text-slate-600">
              No more chase for documentation. Connect, upload, and export your verified reports.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="bg-white rounded-xl p-6 shadow-soft">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-slate-600">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-6">
              Ready to Get Verified?
            </h2>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Join thousands of developers who trust DevVault for professional income verification.
            </p>
            <Link href="/signup">
              <motion.button 
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-luxe hover:shadow-indigo-200/50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Free 14-Day Trial
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}