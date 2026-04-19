// API types and interfaces
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface BankStatement {
  id: string;
  filename: string;
  uploadedAt: string;
  status: 'pending' | 'processed' | 'error';
  accountNumber: string;
  startDate: string;
  endDate: string;
  transactions: BankTransaction[];
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category?: string;
}

export interface Platform {
  id: string;
  name: string;
  type: 'stripe' | 'github' | 'bmc' | 'custom';
  connected: boolean;
  lastSync?: string;
  earnings: number;
  account?: {
    id: string;
    email: string;
    displayName?: string;
  };
}

export interface VerificationReport {
  id: string;
  title: string;
  period: string;
  generatedAt: string;
  status: 'ready' | 'processing' | 'error';
  totalEarnings: number;
  sources: {
    [key: string]: number;
  };
  summary: {
    monthlyAverage: number;
    consistency: number; // 0-100
    volatility: number; // 0-100
  };
  pdfUrl?: string;
}

// Mock API functions
export const api = {
  // Bank statements
  uploadStatement: async (file: File): Promise<ApiResponse<BankStatement>> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const statement: BankStatement = {
      id: Math.random().toString(36).substr(2, 9),
      filename: file.name,
      uploadedAt: new Date().toISOString(),
      status: 'processed',
      accountNumber: '****1234',
      startDate: '2024-03-01',
      endDate: '2024-03-31',
      transactions: [
        {
          id: 'tx1',
          date: '2024-03-15',
          description: 'Stripe Payout - Client Payment',
          amount: 1450.75,
          type: 'credit',
          category: 'income'
        }
      ]
    };
    
    return { success: true, data: statement };
  },

  // Platforms
  connectPlatform: async (type: Platform['type']): Promise<ApiResponse<Platform>> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const platform: Platform = {
      id: type,
      name: type === 'stripe' ? 'Stripe' : type === 'github' ? 'GitHub Sponsors' : 'Buy Me a Coffee',
      type,
      connected: true,
      lastSync: new Date().toISOString(),
      earnings: type === 'stripe' ? 1450.75 : type === 'github' ? 847.25 : 450.50,
      account: {
        id: 'user123',
        email: 'user@example.com'
      }
    };
    
    return { success: true, data: platform };
  },

  // Reports
  generateReport: async (period: string): Promise<ApiResponse<VerificationReport>> => {
    setTimeout(async () => {
      const report: VerificationReport = {
        id: Math.random().toString(36).substr(2, 9),
        title: `${period} Verification Report`,
        period,
        generatedAt: new Date().toISOString(),
        status: 'ready',
        totalEarnings: 2847.50,
        sources: {
          stripe: 1450.75,
          github: 847.25,
          direct: 549.50
        },
        summary: {
          monthlyAverage: 2847.50,
          consistency: 78,
          volatility: 23
        },
        pdfUrl: '/api/reports/sample.pdf'
      };
      
      return { success: true, data: report };
    }, 2000);
    
    return { 
      success: false, 
      data: {} as VerificationReport,
      message: 'Report generation started' 
    };
  },

  // Reports list
  getReports: async (): Promise<ApiResponse<VerificationReport[]>> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const reports: VerificationReport[] = [
      {
        id: '2024-03',
        title: 'March 2024 Verification Report',
        period: 'March 2024',
        generatedAt: '2024-03-31T12:00:00Z',
        status: 'ready',
        totalEarnings: 2847.50,
        sources: {
          stripe: 1450.75,
          github: 847.25,
          direct: 549.50
        },
        summary: {
          monthlyAverage: 2847.50,
          consistency: 78,
          volatility: 23
        }
      },
      {
        id: '2024-02',
        title: 'February 2024 Verification Report',
        period: 'February 2024',
        generatedAt: '2024-02-29T12:00:00Z',
        status: 'ready',
        totalEarnings: 3125.00,
        sources: {
          stripe: 1800.00,
          github: 750.00,
          direct: 575.00
        },
        summary: {
          monthlyAverage: 3125.00,
          consistency: 85,
          volatility: 18
        }
      }
    ];
    
    return { success: true, data: reports };
  },

  // Dashboard stats
  getDashboardStats: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      data: {
        totalEarnings: 2847.50,
        reportsGenerated: 42,
        pendingUploads: 3,
        activeConnections: ['stripe', 'github'],
        recentActivity: [
          {
            type: 'report_generated',
            description: 'Report generated for March 2024',
            timestamp: new Date().toISOString(),
            amount: 2847.50
          },
          {
            type: 'file_uploaded',
            description: 'Bank statement uploaded',
            timestamp: new Date().toISOString(),
            file: 'march-2024-statement.pdf'
          }
        ]
      }
    };
  }
};