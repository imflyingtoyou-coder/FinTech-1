const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const db = require('./db/database');
const {
    validateInvoiceSearch,
    validateInvoiceCreation,
    requireAdminKey
} = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Helper to get client IP
function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           'unknown';
}

// Routes

// Homepage - Search interface
app.get('/', (req, res) => {
    res.render('index', { title: 'Invoice Bank Verification' });
});

// Verification endpoint
app.get('/verify', validateInvoiceSearch, async (req, res) => {
    try {
        const invoiceNumber = req.sanitizedInvoice;
        const clientIp = getClientIp(req);
        
        // Log the verification request
        await db.logVerification(invoiceNumber, clientIp);
        
        // Search for invoice
        const invoice = await db.getInvoiceByNumber(invoiceNumber);
        
        if (invoice) {
            res.render('result', {
                title: 'Verification Result',
                found: true,
                invoice: {
                    number: invoice.invoice_number,
                    bankName: invoice.bank_name,
                    accountNumber: invoice.bank_account_number,
                    beneficiary: invoice.beneficiary_name
                }
            });
        } else {
            res.render('result', {
                title: 'Verification Result',
                found: false,
                invoiceNumber: invoiceNumber
            });
        }
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).render('error', {
            title: 'Service Error',
            message: 'Service temporarily unavailable. Please try again later.',
            statusCode: 500
        });
    }
});

// Admin routes

// Admin dashboard - list all invoices
app.get('/admin', requireAdminKey, async (req, res) => {
    try {
        const invoices = await db.getAllInvoices();
        const logs = await db.getVerificationLogs(50);
        
        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            invoices,
            logs,
            adminKey: req.query.key
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).render('error', {
            title: 'Service Error',
            message: 'Unable to load admin dashboard',
            statusCode: 500
        });
    }
});

// Admin - new invoice form
app.get('/admin/new', requireAdminKey, (req, res) => {
    res.render('admin/new', {
        title: 'Register New Invoice',
        adminKey: req.query.key
    });
});

// Admin - create invoice
app.post('/admin/create', requireAdminKey, validateInvoiceCreation, async (req, res) => {
    try {
        const { invoice_number, bank_name, bank_account_number, beneficiary_name } = req.sanitizedData;
        
        // Check if invoice already exists
        const exists = await db.invoiceExists(invoice_number);
        if (exists) {
            return res.status(400).render('error', {
                title: 'Duplicate Invoice',
                message: `Invoice number ${invoice_number} already exists in the system`,
                statusCode: 400
            });
        }
        
        await db.createInvoice(invoice_number, bank_name, bank_account_number, beneficiary_name);
        
        res.redirect(`/admin?key=${req.query.key || req.body.key}`);
    } catch (error) {
        console.error('Create invoice error:', error);
        res.status(500).render('error', {
            title: 'Service Error',
            message: 'Unable to create invoice',
            statusCode: 500
        });
    }
});

// Admin - edit invoice form
app.get('/admin/edit/:id', requireAdminKey, async (req, res) => {
    try {
        const invoices = await db.getAllInvoices();
        const invoice = invoices.find(inv => inv.id === parseInt(req.params.id));
        
        if (!invoice) {
            return res.status(404).render('error', {
                title: 'Not Found',
                message: 'Invoice not found',
                statusCode: 404
            });
        }
        
        res.render('admin/edit', {
            title: 'Edit Invoice',
            invoice,
            adminKey: req.query.key
        });
    } catch (error) {
        console.error('Edit invoice error:', error);
        res.status(500).render('error', {
            title: 'Service Error',
            message: 'Unable to load invoice',
            statusCode: 500
        });
    }
});

// Admin - update invoice
app.post('/admin/update/:id', requireAdminKey, validateInvoiceCreation, async (req, res) => {
    try {
        const { invoice_number, bank_name, bank_account_number, beneficiary_name } = req.sanitizedData;
        
        await db.updateInvoice(
            parseInt(req.params.id),
            invoice_number,
            bank_name,
            bank_account_number,
            beneficiary_name
        );
        
        res.redirect(`/admin?key=${req.query.key || req.body.key}`);
    } catch (error) {
        console.error('Update invoice error:', error);
        res.status(500).render('error', {
            title: 'Service Error',
            message: 'Unable to update invoice',
            statusCode: 500
        });
    }
});

// Admin - delete invoice
app.post('/admin/delete/:id', requireAdminKey, async (req, res) => {
    try {
        await db.deleteInvoice(parseInt(req.params.id));
        res.redirect(`/admin?key=${req.query.key || req.body.key}`);
    } catch (error) {
        console.error('Delete invoice error:', error);
        res.status(500).render('error', {
            title: 'Service Error',
            message: 'Unable to delete invoice',
            statusCode: 500
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', {
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist',
        statusCode: 404
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).render('error', {
        title: 'Server Error',
        message: 'An unexpected error occurred',
        statusCode: 500
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✓ Visit: http://localhost:${PORT}`);
});
