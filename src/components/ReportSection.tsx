'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Eye, 
  Clock,
  CheckCircle,
  AlertCircle,
  Plus
} from '@phosphor-icons/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface Report {
  id: string;
  title: string;
  date: string;
  status: 'ready' | 'processing' | 'error';
  period: string;
  totalEarnings: number;
  sources: {
    stripe: number;
    github: number;
    direct: number;
  };
  downloads: number;
}

const mockReports: Report[] = [
  {
    id: '2024-03',
    title: 'March 2024 Verification Report',
    date: '2024-03-31',
    status: 'ready',
    period: 'March 2024',
    totalEarnings: 2847.50,
    sources: { stripe: 1450.75, github: 847.25, direct: 549.50 },
    downloads: 12
  },
  {
    id: '2024-02',
    title: 'February 2024 Verification Report',
    date: '2024-02-29',
    status: 'ready',
    period: 'February 2024',
    totalEarnings: 3125.00,
    sources: { stripe: 1800.00, github: 750.00, direct: 575.00 },
    downloads: 8
  }
];

const chartData = mockReports[0].sources;
const chartData2 = [
  { name: 'Jan', earnings: 2400 },
  { name: 'Feb', earnings: 3125 },
  { name: 'Mar', earnings: 2847 },
  { name: 'Apr', earnings: 3200 }
];

const COLORS = ['#6366f1', '#8b5cf6', '#f97316'];

export function ReportSection({ standalone = false }: { standalone?: boolean }) {
  const [reports, setReports] = useState(mockReports);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const newReport: Report = {
        id: `2024-04-${Date.now()}`,
        title: 'April 2024 Verification Report',
        date: new Date().toISOString().split('T')[0],
        status: 'processing',
        period: 'April 2024',
        totalEarnings: 3200.00,
        sources: { stripe: 1600.00, github: 900.00, direct: 700.00 },
        downloads: 0
      };
      
      setReports(prev => [newReport, ...prev]);
      
      setTimeout(() => {
        setReports(prev => prev.map(r => 
          r.id === newReport.id ? { ...r, status: 'ready' } : r
        ));
      }, 2000);
      
      setIsGenerating(false);
    }, 1000);
  };

  const handleDownload = (reportId: string) => {
    setReports(prev => prev.map(r => 
      r.id === reportId ? { ...r, downloads: r.downloads + 1 } : r
    ));
    
    // Simulate download
    const link = document.createElement('a');
    link.href = `/api/reports/${reportId}.pdf`;
    link.download = `income-verification-${reportId}.pdf`;
    link.click();
  };

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'ready': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing': return <Clock className="w-4 h-4 text-amber-500 animate-pulse" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'ready': return 'bg-green-50 text-green-700';
      case 'processing': return 'bg-amber-50 text-amber-700';
      case 'error': return 'bg-red-50 text-red-700';
    }
  };

  return (
    <section className={standalone ? "mt-8" : ""}>
      {!standalone && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Verification Reports</h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Generate New Report
            </button>
            <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View all
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {reports.map((report) => (
              <motion.div
                key={report.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-luxe transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-slate-600" />
                      <h3 className="text-lg font-semibold text-slate-900">
                        {report.title}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                      <span>{new Date(report.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{report.period}</span>
                      <span>•</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        <span className="ml-1">{report.status}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {Object.entries(report.sources).map(([source, amount]) => (
                        <div key={source} className="bg-slate-50 p-3 rounded-lg">
                          <p className="text-xs text-slate-600 capitalize mb-1">
                            {source.replace('_', ' ')}
                          </p>
                          <p className="font-medium text-slate-900">
                            ${amount.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-sm font-medium">
                        Total: ${report.totalEarnings.toLocaleString()}
                      </div>
                      <span className="text-sm text-slate-500">
                        {report.downloads} downloads
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <motion.button
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      onClick={() => setSelectedReport(report.id)}
                      disabled={report.status !== 'ready'}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </motion.button>
                    
                    <motion.button
                      className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleDownload(report.id)}
                      disabled={report.status !== 'ready'}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {/* Income Sources Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Income Sources
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={Object.entries(mockReports[0].sources).map(([key, value]) => ({
                    name: key.replace('_', ' '),
                    value
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {COLORS.map((color) => (
                    <Cell key={color} fill={color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Trend */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Monthly Trend
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="earnings" 
                  fill="#6366f1" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Report Preview Modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedReport(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900">Report Preview</h2>
                <p className="text-slate-600 mt-1">
                  March 2024 Income Verification
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-slate-700">
                    Professional income verification report with verified banking data.
                  </p>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleDownload(selectedReport);
                      setSelectedReport(null);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}