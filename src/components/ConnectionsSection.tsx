'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  GithubLogo, 
  Coffee, 
  ArrowRight,
  Check
} from 'lucide-react';

interface Connection {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'connected' | 'disconnected' | 'connecting';
  lastSync?: string;
  earnings?: number;
  color: string;
  bgColor: string;
}

const connections: Connection[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Connect your Stripe account for payment processing data',
    icon: CreditCard,
    status: 'connected',
    lastSync: '2 hours ago',
    earnings: 1450.75,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  {
    id: 'github',
    name: 'GitHub Sponsors',
    description: 'Link your GitHub Sponsors profile',
    icon: GithubLogo,
    status: 'connected',
    lastSync: '1 day ago',
    earnings: 847.25,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    id: 'bmc',
    name: 'Buy Me a Coffee',
    description: 'Integrate your BuyMeACoffee account',
    icon: Coffee,
    status: 'disconnected',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  }
];

export function ConnectionsSection({ standalone = false }: { standalone?: boolean }) {
  const [connectionStates, setConnectionStates] = useState<Record<string, Connection['status']>>(
    connections.reduce((acc, conn) => ({ ...acc, [conn.id]: conn.status }), {})
  );

  const handleConnect = async (id: string) => {
    setConnectionStates(prev => ({ ...prev, [id]: 'connecting' }));
    
    setTimeout(() => {
      setConnectionStates(prev => ({ ...prev, [id]: 'connected' }));
    }, 1500);
  };

  return (
    <section className={standalone ? "mt-8" : ""}>
      {!standalone && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Platform Connections</h2>
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            See all
          </button>
        </div>
      )}
      
      <div className="grid md:grid-cols-3 gap-6">
        {connections.map((connection) => (
          <motion.div
            key={connection.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-luxe transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${connection.bgColor} ${connection.color}`}>
                <connection.icon weight="fill" className="w-6 h-6" />
              </div>
              
              {connectionStates[connection.id] === 'connected' && (
                <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  <Check className="w-3 h-3" />
                  <span className="text-xs font-medium">Connected</span>
                </div>
              )}
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {connection.name}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {connection.description}
            </p>

            {connection.earnings && connectionStates[connection.id] === 'connected' && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-1">Monthly Earnings</p>
                <p className="text-xl font-bold text-slate-900">
                  ${connection.earnings.toLocaleString()}
                </p>
              </div>
            )}

            {connection.lastSync && connectionStates[connection.id] === 'connected' && (
              <p className="text-xs text-slate-500 mb-4">
                Last sync: {connection.lastSync}
              </p>
            )}

            {connectionStates[connection.id] === 'connected' ? (
              <button className="w-full px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                Manage Connection
              </button>
            ) : connectionStates[connection.id] === 'connecting' ? (
              <button className="w-full px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg text-sm font-medium animate-pulse">
                Connecting...
              </button>
            ) : (
              <motion.button
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleConnect(connection.id)}
              >
                Connect Account
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}