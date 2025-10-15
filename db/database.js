const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
    console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
});

// Database query functions
const db = {
    // Get invoice by invoice number
    async getInvoiceByNumber(invoiceNumber) {
        const query = 'SELECT * FROM invoices WHERE invoice_number = $1';
        const result = await pool.query(query, [invoiceNumber]);
        return result.rows[0];
    },

    // Create new invoice
    async createInvoice(invoiceNumber, bankName, bankAccountNumber, beneficiaryName = null) {
        const query = `
            INSERT INTO invoices (invoice_number, bank_name, bank_account_number, beneficiary_name)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await pool.query(query, [invoiceNumber, bankName, bankAccountNumber, beneficiaryName]);
        return result.rows[0];
    },

    // Update invoice
    async updateInvoice(id, invoiceNumber, bankName, bankAccountNumber, beneficiaryName = null) {
        const query = `
            UPDATE invoices
            SET invoice_number = $2, bank_name = $3, bank_account_number = $4, beneficiary_name = $5
            WHERE id = $1
            RETURNING *
        `;
        const result = await pool.query(query, [id, invoiceNumber, bankName, bankAccountNumber, beneficiaryName]);
        return result.rows[0];
    },

    // Delete invoice
    async deleteInvoice(id) {
        const query = 'DELETE FROM invoices WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    // Get all invoices
    async getAllInvoices() {
        const query = 'SELECT * FROM invoices ORDER BY created_at DESC';
        const result = await pool.query(query);
        return result.rows;
    },

    // Log verification request
    async logVerification(invoiceNumber, ipAddress) {
        const query = `
            INSERT INTO verification_logs (invoice_number, ip_address)
            VALUES ($1, $2)
            RETURNING *
        `;
        const result = await pool.query(query, [invoiceNumber, ipAddress]);
        return result.rows[0];
    },

    // Get verification logs
    async getVerificationLogs(limit = 100) {
        const query = 'SELECT * FROM verification_logs ORDER BY verified_at DESC LIMIT $1';
        const result = await pool.query(query, [limit]);
        return result.rows;
    },

    // Check if invoice number exists
    async invoiceExists(invoiceNumber) {
        const query = 'SELECT EXISTS(SELECT 1 FROM invoices WHERE invoice_number = $1)';
        const result = await pool.query(query, [invoiceNumber]);
        return result.rows[0].exists;
    }
};

module.exports = db;
