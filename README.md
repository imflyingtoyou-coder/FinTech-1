# Invoice Bank Verification Web App - MVP

A secure web application for verifying bank account details associated with invoice numbers, designed to prevent wire transfer fraud in international trade.

## 🎯 Features

- **Invoice Verification**: Search and verify bank account details by invoice number
- **Admin Dashboard**: Register, update, and delete invoice records
- **Audit Logging**: Track all verification requests with timestamps and IP addresses
- **Security**: Input validation, SQL injection prevention, rate limiting, and helmet security headers
- **Modern UI**: Clean, responsive interface built with EJS templates

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Template Engine**: EJS
- **Security**: Helmet, express-rate-limit
- **Styling**: Custom CSS with modern design

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd FinTech-1
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE invoice_verification;
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/invoice_verification
ADMIN_KEY=your-secure-random-key-here
PORT=3000
NODE_ENV=development
```

**Important**: Generate a strong random string for `ADMIN_KEY`. This protects admin routes.

### 4. Run Database Migration

```bash
npm run db:migrate
```

This creates the required tables:
- `invoices` - Stores invoice and bank account details
- `verification_logs` - Logs all verification requests

### 5. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The app will be available at `http://localhost:3000`

## 📖 Usage

### Public Interface

1. **Homepage** (`/`): Enter an invoice number to verify
2. **Verification Result** (`/verify?invoice=XXX`): View bank account details if found

### Admin Interface

Access admin panel at `/admin?key=YOUR_ADMIN_KEY`

**Admin Features**:
- View all registered invoices
- Register new invoice records
- Edit existing invoices
- Delete invoices
- View verification logs

**Admin Routes**:
- `/admin?key=XXX` - Dashboard
- `/admin/new?key=XXX` - Register new invoice
- `/admin/edit/:id?key=XXX` - Edit invoice

## 🗄️ Database Schema

### invoices table
```sql
- id (serial, primary key)
- invoice_number (varchar, unique)
- bank_name (varchar)
- bank_account_number (varchar)
- beneficiary_name (varchar, optional)
- created_at (timestamp)
- updated_at (timestamp)
```

### verification_logs table
```sql
- id (serial, primary key)
- invoice_number (varchar)
- ip_address (varchar)
- verified_at (timestamp)
```

## 🔒 Security Features

- **Input Validation**: All inputs sanitized and validated
- **SQL Injection Prevention**: Parameterized queries only
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet Security**: HTTP headers protection
- **Admin Authentication**: Environment variable-based access key
- **XSS Prevention**: Input sanitization removes HTML tags

## 🌐 Deployment

### Railway (Backend + Database)

1. Create a new project on [Railway](https://railway.app)
2. Add PostgreSQL database service
3. Connect your GitHub repository
4. Set environment variables:
   - `DATABASE_URL` (auto-configured by Railway)
   - `ADMIN_KEY`
   - `NODE_ENV=production`
5. Deploy!

Railway will automatically:
- Install dependencies
- Run the application
- Provide a public URL

**Post-deployment**: Run migration via Railway CLI:
```bash
railway run npm run db:migrate
```

### Vercel (Alternative Frontend Hosting)

For static hosting with serverless functions:

1. Install Vercel CLI: `npm i -g vercel`
2. Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```
3. Deploy: `vercel --prod`

## 📁 Project Structure

```
FinTech-1/
├── db/
│   ├── database.js       # Database connection and queries
│   ├── migrate.js        # Migration script
│   └── schema.sql        # Database schema
├── middleware/
│   └── validation.js     # Input validation and sanitization
├── public/
│   └── css/
│       └── style.css     # Styles
├── views/
│   ├── admin/
│   │   ├── dashboard.ejs # Admin dashboard
│   │   ├── new.ejs       # New invoice form
│   │   └── edit.ejs      # Edit invoice form
│   ├── error.ejs         # Error page
│   ├── index.ejs         # Homepage
│   ├── layout.ejs        # Layout template
│   └── result.ejs        # Verification result
├── .env.example          # Environment variables template
├── .gitignore
├── package.json
├── README.md
└── server.js             # Express server
```

## 🧪 Testing

### Manual Testing Checklist

**Public Interface**:
- [ ] Search with valid invoice number
- [ ] Search with non-existent invoice
- [ ] Search with invalid characters
- [ ] Verify result displays correctly

**Admin Interface**:
- [ ] Access admin with correct key
- [ ] Access admin with wrong key (should fail)
- [ ] Register new invoice
- [ ] Register duplicate invoice (should fail)
- [ ] Edit existing invoice
- [ ] Delete invoice
- [ ] View verification logs

## 🔧 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
psql --version

# Test connection
psql -U username -d invoice_verification
```

### Migration Errors

```bash
# Drop and recreate database
dropdb invoice_verification
createdb invoice_verification
npm run db:migrate
```

### Port Already in Use

Change `PORT` in `.env` or:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill
```

## 📈 Future Enhancements

- User authentication system
- SWIFT/IBAN API integration
- Role-based access control
- REST API endpoints
- Analytics dashboard
- Multi-language support
- Email notifications
- Export functionality (CSV/PDF)

## 📝 License

ISC

## 👥 Support

For issues or questions, please create an issue in the repository.

---

**Built with ❤️ for secure international trade**
