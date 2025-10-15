// Input validation and sanitization middleware

// Validate invoice number format
function validateInvoiceNumber(invoiceNumber) {
    if (!invoiceNumber || typeof invoiceNumber !== 'string') {
        return false;
    }
    
    // Allow alphanumeric, hyphens, and underscores only
    const validPattern = /^[a-zA-Z0-9\-_]{1,255}$/;
    return validPattern.test(invoiceNumber.trim());
}

// Sanitize input to prevent XSS
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .substring(0, 255); // Limit length
}

// Middleware to validate invoice search
function validateInvoiceSearch(req, res, next) {
    const invoiceNumber = req.query.invoice;
    
    if (!invoiceNumber) {
        return res.status(400).render('error', {
            title: 'Invalid Request',
            message: 'Invoice number is required',
            statusCode: 400
        });
    }
    
    if (!validateInvoiceNumber(invoiceNumber)) {
        return res.status(400).render('error', {
            title: 'Invalid Invoice Number',
            message: 'Invoice number contains invalid characters. Only letters, numbers, hyphens, and underscores are allowed.',
            statusCode: 400
        });
    }
    
    req.sanitizedInvoice = sanitizeInput(invoiceNumber);
    next();
}

// Middleware to validate invoice creation
function validateInvoiceCreation(req, res, next) {
    const { invoice_number, bank_name, bank_account_number, beneficiary_name } = req.body;
    
    const errors = [];
    
    if (!invoice_number || !validateInvoiceNumber(invoice_number)) {
        errors.push('Invalid invoice number format');
    }
    
    if (!bank_name || bank_name.trim().length === 0) {
        errors.push('Bank name is required');
    }
    
    if (!bank_account_number || bank_account_number.trim().length === 0) {
        errors.push('Bank account number is required');
    }
    
    if (errors.length > 0) {
        return res.status(400).render('error', {
            title: 'Validation Error',
            message: errors.join(', '),
            statusCode: 400
        });
    }
    
    // Sanitize all inputs
    req.sanitizedData = {
        invoice_number: sanitizeInput(invoice_number),
        bank_name: sanitizeInput(bank_name),
        bank_account_number: sanitizeInput(bank_account_number),
        beneficiary_name: beneficiary_name ? sanitizeInput(beneficiary_name) : null
    };
    
    next();
}

// Middleware to check admin key
function requireAdminKey(req, res, next) {
    const adminKey = req.query.key || req.body.key;
    
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).render('error', {
            title: 'Access Denied',
            message: 'Invalid or missing admin key',
            statusCode: 403
        });
    }
    
    next();
}

module.exports = {
    validateInvoiceNumber,
    sanitizeInput,
    validateInvoiceSearch,
    validateInvoiceCreation,
    requireAdminKey
};
