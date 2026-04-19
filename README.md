# DevVault - Developer Income Verification Service

A modern web application that provides income verification for independent developers by connecting to banking accounts, development platforms, and generating professional compliance reports.

## 🎯 Problem Solved

Independent developers often struggle to prove their income for:
- **Mortgage applications** requiring verified income documentation
- **Apartment rentals** needing proof of consistent earnings
- **Loan applications** requiring detailed financial verification
- **Credit approvals** demanding documented cash flow analysis

## 🏗️ Architecture Overview

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" style="background: #f8fafc;">
  <!-- Background -->
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" style="stop-color:#f8fafc"/>
      <stop offset="100%" style="stop-color:#f1f5f9"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.1"/>
    </filter>
  </defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  
  <!-- Title -->
  <text x="400" y="30" text-anchor="middle" font-size="18" font-weight="bold" fill="#1e293b">DevVault System Architecture</text>
  
  <!-- Frontend Layer -->
  <rect x="150" y="60" width="150" height="80" rx="8" fill="#6366f1" filter="url(#shadow)"/>
  <text x="225" y="105" text-anchor="middle" font-size="14" font-weight="600" fill="white">Next.js Frontend</text>
  <text x="225" y="120" text-anchor="middle" font-size="11" fill="#e0e7ff">devverify.co</text>
  
  <!-- API Layer -->
  <rect x="350" y="200" width="100" height="70" rx="6" fill="#4ade80" filter="url(#shadow)"/>
  <text x="400" y="235" text-anchor="middle" font-size="12" font-weight="600" fill="white">Node.js API</text>
  <text x="400" y="248" text-anchor="middle" font-size="10" fill="#dcfce7">api.devverify.co</text>
  
  <!-- Database -->
  <circle cx="400" cy="350" r="40" fill="#16a34a" filter="url(#shadow)"/>
  <text x="400" y="355" text-anchor="middle" font-size="12" font-weight="600" fill="white">PostgreSQL</text>
  
  <!-- External Services -->
  <rect x="150" y="440" width="120" height="70" rx="6" fill="#818cf8" filter="url(#shadow)"/>
  <text x="210" y="470" text-anchor="middle" font-size="11" font-weight="600" fill="white">Plaid</text>
  <text x="210" y="483" text-anchor="middle" font-size="9" fill="#e0e7ff">Bank APIs</text>
  
  <rect x="300" y="440" width="120" height="70" rx="6" fill="#818cf8" filter="url(#shadow)"/>
  <text x="360" y="470" text-anchor="middle" font-size="11" font-weight="600" fill="white">Stripe</text>
  <text x="360" y="483" text-anchor="middle" font-size="9" fill="#e0e7ff">Payout Data</text>
  
  <rect x="450" y="440" width="120" height="70" rx="6" fill="#818cf8" filter="url(#shadow)"/>
  <text x="510" y="470" text-anchor="middle" font-size="11" font-weight="600" fill="white">GitHub</text>
  <text x="510" y="483" text-anchor="middle" font-size="9" fill="#e0e7ff">Sponsors</text>
  
  <rect x="600" y="440" width="120" height="70" rx="6" fill="#818cf8" filter="url(#shadow)"/>
  <text x="660" y="470" text-anchor="middle" font-size="11" font-weight="600" fill="white">AWS S3</text>
  <text x="660" y="483" text-anchor="middle" font-size="9" fill="#e0e7ff">File Storage</text>
  
  <!-- Frontend to API -->
  <line x1="300" y1="100" x2="350" y2="200" stroke="#475569" stroke-width="2"/>
  <polygon points="350,200 345,194 345,206" fill="#475569"/>
  
  <!-- API to Database -->
  <line x1="400" y1="270" x2="400" y2="310" stroke="#475569" stroke-width="2"/>
  <polygon points="400,310 395,304 405,304" fill="#475569"/>
  
  <!-- Database to Services -->
  <line x1="360" y1="370" x2="210" y2="440" stroke="#475569" stroke-width="1"/>
  <line x1="380" y1="370" x2="360" y2="440" stroke="#475569" stroke-width="1"/>
  <line x1="420" y1="370" x2="510" y2="440" stroke="#475569" stroke-width="1"/>
  <line x1="440" y1="370" x2="660" y2="440" stroke="#475569" stroke-width="1"/>
  
  <!-- Labels -->
  <text x="320" y="160" text-anchor="middle" font-size="10" fill="#475569">HTTPS/API</text>
  <text x="430" y="290" text-anchor="middle" font-size="10" fill="#475569">SQL</text>
  
  <!-- Legend -->
  <rect x="30" y="520" width="20" height="15" rx="3" fill="#6366f1"/>
  <text x="55" y="531" font-size="11" fill="#334155">Next.js Frontend</text>
  
  <rect x="150" y="520" width="20" height="15" rx="3" fill="#4ade80"/>
  <text x="175" y="531" font-size="11" fill="#334155">Node.js API</text>
  
  <rect x="250" y="520" width="20" height="15" rx="3" fill="#818cf8"/>
  <text x="275" y="531" font-size="11" fill="#334155">External Integrations</text>
  
  <circle cx="400" cy="527.5" r="8" fill="#16a34a"/>
  <text x="415" y="531" font-size="11" fill="#334155">Database</text>
</svg>
```

## 🚀 Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Recharts** for data visualization
- **Radix UI** for accessible components

### Backend
- **Node.js** with Express
- **PostgreSQL** database
- **Prisma** ORM
- **Plaid SDK** for banking integration
- **Stripe SDK** for financial data
- **AWS S3** for file storage

## 📦 Installation Guide

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Vercel CLI
- Git

### Environment Variables

#### Frontend (`.env.local`)
```bash
NEXT_PUBLIC_API_URL=https://api.devverify.co
PLAID_CLIENT_ID=your_plaid_client_id
STRIPE_CLIENT_ID=your_stripe_client_id
SUPABASE_URL=your_supabase_url
```

#### Backend (`.env`)
```bash
DATABASE_URL=postgresql://...
PLAID_SECRET=your_plaid_secret
STRIPE_SECRET=your_stripe_secret_key
AWS_ACCESS_KEY=your_aws_key
AWS_SECRET_KEY=your_aws_secret
SUPABASE_SERVICE_ROLE=your_supabase_service_role
```

### Quick Start

```bash
# Clone repository
git clone [repository-url]
cd devvault

# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Start development
npm run dev
```

## 📊 API Documentation

### Authentication
```javascript
POST /api/auth/register
{
  "email": "developer@example.com",
  "password": "securepassword"
}
```

### Bank Connections
```javascript
POST /api/plaid/create-link-token
{
  "userId": "user_uuid"
}
```

### Report Generation
```javascript
POST /api/reports/generate
{
  "type": "income_verification",
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-12-31"
  }
}
```

## 🌐 Deployment

### Vercel (Frontend)
```bash
vercel --prod
```

### Railway (Backend)
```bash
railway up --detach
```

### Database Setup
```bash
# Create production database
vercel postgres create

# Apply migrations
npx prisma migrate deploy
```

## 📸 Screenshots

### Home Page
![Home Page](./screenshots/homepage.png)

### Dashboard
![Dashboard](./screenshots/dashboard.png)

### Banking Connections
![Bank Connections](./screenshots/banking.png)

### Report Generation
![Reports](./screenshots/reports.png)

## 📞 Support

For support, email **support@devverify.co** or create an issue in the GitHub repository.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

*Built with ❤️ for independent developers*