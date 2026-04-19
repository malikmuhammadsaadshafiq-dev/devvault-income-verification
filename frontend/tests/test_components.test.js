import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import mockAxios from 'axios';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
    pathname: '/',
  }),
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
      })),
    },
  })),
}));

describe('User Flow Components', () => {
  // Test components will be imported from actual codebase
  let LoginForm;
  let SignupForm;
  let StripeConnectButton;
  let FileUpload;
  let IncomeReport;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LoginForm Component', () => {
    test('renders login form with email and password fields', () => {
      const { LoginForm } = require('../src/components/auth/LoginForm');
      render(<LoginForm />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    test('validates email format', async () => {
      const { LoginForm } = require('../src/components/auth/LoginForm');
      const user = userEvent.setup();
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      
      fireEvent.blur(emailInput);
      
      await waitFor(() => {
        expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
      });
    });

    test('submits form with valid credentials', async () => {
      const { LoginForm } = require('../src/components/auth/LoginForm');
      mockAxios.post.mockResolvedValueOnce({
        data: { token: 'mock_token', user: { id: 1, email: 'test@example.com' } }
      });
      
      const user = userEvent.setup();
      render(<LoginForm />);
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'TestPass123!');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/auth/login', {
          email: 'test@example.com',
          password: 'TestPass123!'
        });
      });
    });
  });

  describe('SignupForm Component', () => {
    test('renders complete signup form', () => {
      const { SignupForm } = require('../src/components/auth/SignupForm');
      render(<SignupForm />);
      
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    test('validates password matching', async () => {
      const { SignupForm } = require('../src/components/auth/SignupForm');
      const user = userEvent.setup();
      render(<SignupForm />);
      
      await user.type(screen.getByLabelText(/^password/i), 'TestPass123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPass1!');
      
      fireEvent.submit(screen.getByTestId('signup-form'));
      
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    test('handles server validation errors', async () => {
      const { SignupForm } = require('../src/components/auth/SignupForm');
      mockAxios.post.mockRejectedValueOnce({
        response: { data: { error: 'Email already exists' } }
      });
      
      const user = userEvent.setup();
      render(<SignupForm />);
      
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/^password/i), 'TestPass123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'TestPass123!');
      
      await user.click(screen.getByRole('button', { name: /create account/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('StripeConnectButton Component', () => {
    test('displays connect stripe button for non-connected users', () => {
      const { StripeConnectButton } = require('../src/components/stripe/StripeConnectButton');
      const { AuthProvider } = require('../src/contexts/AuthContext');
      
      render(
        <AuthProvider>
          <StripeConnectButton />
        </AuthProvider>
      );
      
      expect(screen.getByRole('button', { name: /connect stripe account/i })).toBeInTheDocument();
    });

    test('shows connected state after Stripe OAuth', () => {
      const { StripeConnectButton } = require('../src/components/stripe/StripeConnectButton');
      const { AuthProvider } = require('../src/contexts/AuthContext');
      
      render(
        <AuthProvider initialState={{ 
          user: { id: 1, email: 'test@example.com' },
          stripeConnected: true 
        }}>
          <StripeConnectButton />
        </AuthProvider>
      );
      
      expect(screen.getByText(/stripe connected/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /connect stripe/i })).not.toBeInTheDocument();
    });

    test('handles stripe OAuth flow', async () => {
      const { StripeConnectButton } = require('../src/components/stripe/StripeConnectButton');
      mockAxios.get.mockResolvedValueOnce({
        data: { url: 'https://connect.stripe.com/oauth/authorize?client_id=test&scope=read_write' }
      });
      
      const user = userEvent.setup();
      render(<StripeConnectButton />);
      
      const connectButton = screen.getByRole('button', { name: /connect stripe account/i });
      await user.click(connectButton);
      
      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/connect/stripe/authorize');
      });
    });
  });

  describe('FileUpload Component', () => {
    test('renders file upload interface', () => {
      const { FileUpload } = require('../src/components/upload/FileUpload');
      render(<FileUpload accept=".csv,.pdf" />);
      
      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
      expect(screen.getByText(/or browse/i)).toBeInTheDocument();
    });

    test('handles CSV file upload', async () => {
      const { FileUpload } = require('../src/components/upload/FileUpload');
      const file = new File(['Date,Amount\n2024-01-01,1000'], 'test.csv', { type: 'text/csv' });
      
      const user = userEvent.setup();
      render(<FileUpload onUploadComplete={jest.fn()} />);
      
      const input = screen.getByLabelText(/upload file/i);
      await user.upload(input, file);
      
      expect(screen.getByText('test.csv')).toBeInTheDocument();
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });

    test('validates file types', async () => {
      const { FileUpload } = require('../src/components/upload/FileUpload');
      const invalidFile = new File(['bad content'], 'test.txt', { type: 'text/plain' });
      
      const user = userEvent.setup();
      const onError = jest.fn();
      render(<FileUpload onError={onError} />);
      
      const input = screen.getByLabelText(/upload file/i);
      await user.upload(input, invalidFile);
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.stringContaining('Invalid file type'));
      });
    });

    test('shows upload progress', async () => {
      const { FileUpload } = require('../src/components/upload/FileUpload');
      mockAxios.post.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => 
          resolve({ data: { fileId: 'test-id' } })
        , 100))
      );
      
      const file = new File(['test,data\n'], 'test.csv', { type: 'text/csv' });
      const user = userEvent.setup();
      
      render(<FileUpload />);
      
      const input = screen.getByLabelText(/upload file/i);
      await user.upload(input, file);
      
      const progressElement = screen.getByRole('progressbar');
      expect(progressElement).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Upload complete')).toBeInTheDocument();
      });
    });
  });

  describe('IncomeReport Component', () => {
    test('displays loading state', () => {
      const { IncomeReport } = require('../src/components/reports/IncomeReport');
      render(<IncomeReport isLoading={true} />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/generating/i)).toBeInTheDocument();
    });

    test('renders complete income summary', () => {
      const { IncomeReport } = require('../src/components/reports/IncomeReport');
      const mockReport = {
        totalIncome: 18000,
        monthlyAverage: 6000,
        transactionCount: 30,
        period: 'Last 3 months',
        incomeRange: { min: 5800, max: 6200 }
      };
      
      render(<IncomeReport data={mockReport} />);
      
      expect(screen.getByText('$18,000')).toBeInTheDocument();
      expect(screen.getByText('$6,000')).toBeInTheDocument();
      expect(screen.getByText('30 transactions')).toBeInTheDocument();
      expect(screen.getByText(/last 3 months/i)).toBeInTheDocument();
    });

    test('shows PDF download button when available', async () => {
      const { IncomeReport } = require('../src/components/reports/IncomeReport');
      const user = userEvent.setup();
      
      render(<IncomeReport showDownload={true} />);
      
      const downloadBtn = screen.getByRole('button', { name: /download pdf/i });
      expect(downloadBtn).toBeInTheDocument();
      
      await user.click(downloadBtn);
      
      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/reports/'),
        expect.objectContaining({
          responseType: 'blob'
        })
      );
    });

    test('handles insufficient data gracefully', () => {
      const { IncomeReport } = require('../src/components/reports/IncomeReport');
      render(<IncomeReport error="Insufficient data, please upload bank statements"} />);
      
      expect(screen.getByText(/insufficient data/i)).toBeInTheDocument();
      expect(screen.getByText(/upload bank statements/i)).toBeInTheDocument();
    });
  });

  describe('User Navigation Flow', () => {
    test('navigation from signup → stripe connect → upload → report', async () => {
      const { Router } = require('next/navigation');
      
      const { useRouter } = require('next/navigation');
      const mockRouter = { push: jest.fn() };
      useRouter.mockReturnValue(mockRouter);
      
      const user = userEvent.setup();
      
      // Mock successful signup
      mockAxios.post.mockResolvedValueOnce({
        data: { user: { id: 1, email: 'test@example.com' }, token: 'test-token' }
      });
      
      mockAxios.get.mockResolvedValueOnce({
        data: { url: 'https://connect.stripe.com/oauth/authorize?code=test' }
      });
      
      // Simulate navigation flow
      const SignupPage = require('../src/pages/signup');
      render(<SignupPage />);
      
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password/i), 'TestPass123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'TestPass123!');
      
      await user.click(screen.getByRole('button', { name: /create account/i }));
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/connect-stripe');
      });
    });
  });
});

export default {};