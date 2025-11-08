/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { sql } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  fullName: text('full_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  role: text('role').notNull(), // 'super_admin', 'admin', 'manager', 'cashier', 'pharmacist'
  createdBy: text('created_by').references(() => users.id), // Track who created this user
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  mustChangePassword: integer('must_change_password', { mode: 'boolean' }).default(false), // Force password change on next login
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
})

// Categories table
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  parentId: text('parent_id'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
})

// Units table
export const units = sqliteTable('units', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  symbol: text('symbol').notNull().unique(), // Legacy field, kept for compatibility
  abbreviation: text('abbreviation').notNull(), // New field for unit abbreviation
  type: text('type', { enum: ['base', 'package'] })
    .notNull()
    .default('base'), // Unit type: base (smallest) or package (bulk)
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
})

// Suppliers table
export const suppliers = sqliteTable('suppliers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  contactPerson: text('contact_person'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  taxNumber: text('tax_number'),
  openingBalance: real('opening_balance').default(0), // Opening balance (positive = payable, negative = receivable)
  currentBalance: real('current_balance').default(0), // Current outstanding balance
  totalPurchases: real('total_purchases').default(0), // Total purchase amount
  totalPayments: real('total_payments').default(0), // Total payments made
  creditLimit: real('credit_limit').default(0), // Maximum credit allowed
  creditDays: integer('credit_days').default(0), // Payment terms in days
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  version: integer('version').notNull().default(1), // Optimistic locking version
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
})

// Bank Accounts table
export const bankAccounts = sqliteTable('bank_accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(), // Account name/label
  accountType: text('account_type').notNull(), // 'cash', 'bank', 'mobile_banking'
  accountNumber: text('account_number'), // Bank account number (optional for cash)
  bankName: text('bank_name'), // Bank name (for bank type)
  branchName: text('branch_name'), // Bank branch name
  accountHolder: text('account_holder'), // Account holder name
  openingBalance: real('opening_balance').default(0), // Opening balance
  currentBalance: real('current_balance').default(0), // Current balance
  totalDeposits: real('total_deposits').default(0), // Total deposits/additions
  totalWithdrawals: real('total_withdrawals').default(0), // Total withdrawals/deductions
  description: text('description'), // Notes/description
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  version: integer('version').notNull().default(1), // Optimistic locking version
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
})

// Products table
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  genericName: text('generic_name'),
  strength: text('strength'), // Medicine strength (e.g., '500mg', '10ml', '250mg/5ml')
  barcode: text('barcode').unique(),
  sku: text('sku').notNull().unique(),
  categoryId: text('category_id').references(() => categories.id),
  supplierId: text('supplier_id').references(() => suppliers.id),
  description: text('description'),
  manufacturer: text('manufacturer'),
  unit: text('unit').notNull(), // Base unit (smallest): 'tablet', 'capsule', 'strip', 'ml', etc.
  unitsPerPackage: integer('units_per_package').default(1), // How many base units in one package
  packageUnit: text('package_unit'), // Package unit name: 'box', 'bottle', 'pack', etc.
  prescriptionRequired: integer('prescription_required', { mode: 'boolean' }).default(false),
  reorderLevel: integer('reorder_level').default(10),
  sellingPrice: real('selling_price').notNull(), // Price per base unit
  costPrice: real('cost_price').notNull(), // Cost per base unit
  taxRate: real('tax_rate').default(0),
  discountPercent: real('discount_percent').default(0),
  imageUrl: text('image_url'), // Product image URL or path
  shelf: text('shelf').notNull().default('A1'), // Shelf location identifier (e.g., A1, B2, C3)
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  version: integer('version').notNull().default(1), // Optimistic locking version
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
})

// Inventory table
export const inventory = sqliteTable('inventory', {
  id: text('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  batchNumber: text('batch_number'),
  quantity: integer('quantity').notNull().default(0),
  expiryDate: text('expiry_date'),
  manufactureDate: text('manufacture_date'),
  version: integer('version').notNull().default(1), // Optimistic locking version
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
})

// Customers table
export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').unique(),
  email: text('email'),
  address: text('address'),
  dateOfBirth: text('date_of_birth'),
  gender: text('gender'),
  loyaltyPoints: integer('loyalty_points').default(0),
  totalPurchases: real('total_purchases').default(0), // Total amount of purchases made by customer
  allergies: text('allergies'),
  notes: text('notes'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  version: integer('version').notNull().default(1), // Optimistic locking version
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
})

// Sales table
export const sales = sqliteTable('sales', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  customerId: text('customer_id').references(() => customers.id),
  accountId: text('account_id').references(() => bankAccounts.id),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  subtotal: real('subtotal').notNull(),
  taxAmount: real('tax_amount').default(0),
  discountAmount: real('discount_amount').default(0),
  totalAmount: real('total_amount').notNull(),
  paidAmount: real('paid_amount').notNull(),
  changeAmount: real('change_amount').default(0),
  paymentMethod: text('payment_method').notNull(), // 'cash', 'card', 'mobile', 'credit'
  status: text('status').notNull().default('completed'), // 'completed', 'partially_returned', 'refunded', 'cancelled'
  pointsRedeemed: integer('points_redeemed').default(0), // Loyalty points used for this sale
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

// Sale Items table
export const saleItems = sqliteTable('sale_items', {
  id: text('id').primaryKey(),
  saleId: text('sale_id')
    .notNull()
    .references(() => sales.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  discountPercent: real('discount_percent').default(0),
  taxRate: real('tax_rate').default(0),
  subtotal: real('subtotal').notNull(),
  batchNumber: text('batch_number'),
  expiryDate: text('expiry_date')
})

// Sales Returns table
export const salesReturns = sqliteTable('sales_returns', {
  id: text('id').primaryKey(),
  returnNumber: text('return_number').notNull().unique(),
  saleId: text('sale_id')
    .notNull()
    .references(() => sales.id),
  customerId: text('customer_id').references(() => customers.id),
  accountId: text('account_id').references(() => bankAccounts.id),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  subtotal: real('subtotal').notNull(),
  taxAmount: real('tax_amount').default(0),
  discountAmount: real('discount_amount').default(0),
  totalAmount: real('total_amount').notNull(),
  refundAmount: real('refund_amount').default(0),
  refundStatus: text('refund_status').notNull().default('pending'), // 'pending', 'partial', 'refunded'
  reason: text('reason'),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

// Sales Return Items table
export const salesReturnItems = sqliteTable('sales_return_items', {
  id: text('id').primaryKey(),
  returnId: text('return_id')
    .notNull()
    .references(() => salesReturns.id, { onDelete: 'cascade' }),
  saleItemId: text('sale_item_id')
    .notNull()
    .references(() => saleItems.id),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  discountPercent: real('discount_percent').default(0),
  taxRate: real('tax_rate').default(0),
  subtotal: real('subtotal').notNull(),
  batchNumber: text('batch_number'),
  expiryDate: text('expiry_date'),
  reason: text('reason'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

// Purchases table
export const purchases = sqliteTable('purchases', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  supplierId: text('supplier_id')
    .notNull()
    .references(() => suppliers.id),
  accountId: text('account_id').references(() => bankAccounts.id),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  subtotal: real('subtotal').notNull(),
  taxAmount: real('tax_amount').default(0),
  discountAmount: real('discount_amount').default(0),
  totalAmount: real('total_amount').notNull(),
  paidAmount: real('paid_amount').default(0),
  dueAmount: real('due_amount').default(0),
  paymentStatus: text('payment_status').notNull().default('pending'), // 'pending', 'partial', 'paid'
  status: text('status').notNull().default('received'), // 'ordered', 'received', 'cancelled'
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

// Purchase Items table
export const purchaseItems = sqliteTable('purchase_items', {
  id: text('id').primaryKey(),
  purchaseId: text('purchase_id')
    .notNull()
    .references(() => purchases.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  discountPercent: real('discount_percent').default(0),
  taxRate: real('tax_rate').default(0),
  subtotal: real('subtotal').notNull(),
  batchNumber: text('batch_number'),
  expiryDate: text('expiry_date'),
  manufactureDate: text('manufacture_date')
})

// Purchase Returns table
export const purchaseReturns = sqliteTable('purchase_returns', {
  id: text('id').primaryKey(),
  returnNumber: text('return_number').notNull().unique(),
  purchaseId: text('purchase_id')
    .notNull()
    .references(() => purchases.id),
  supplierId: text('supplier_id')
    .notNull()
    .references(() => suppliers.id),
  accountId: text('account_id').references(() => bankAccounts.id),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  subtotal: real('subtotal').notNull(),
  taxAmount: real('tax_amount').default(0),
  discountAmount: real('discount_amount').default(0),
  totalAmount: real('total_amount').notNull(),
  refundAmount: real('refund_amount').default(0),
  refundStatus: text('refund_status').notNull().default('pending'), // 'pending', 'partial', 'refunded'
  reason: text('reason'),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

// Purchase Return Items table
export const purchaseReturnItems = sqliteTable('purchase_return_items', {
  id: text('id').primaryKey(),
  returnId: text('return_id')
    .notNull()
    .references(() => purchaseReturns.id, { onDelete: 'cascade' }),
  purchaseItemId: text('purchase_item_id')
    .notNull()
    .references(() => purchaseItems.id),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  discountPercent: real('discount_percent').default(0),
  taxRate: real('tax_rate').default(0),
  subtotal: real('subtotal').notNull(),
  batchNumber: text('batch_number'),
  expiryDate: text('expiry_date'),
  reason: text('reason'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

// Expenses table
export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  category: text('category').notNull(), // 'rent', 'utilities', 'salary', 'maintenance', 'other'
  amount: real('amount').notNull(),
  description: text('description'),
  expenseDate: text('expense_date').notNull(),
  paymentMethod: text('payment_method').notNull(),
  receipt: text('receipt'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

// Prescriptions table
export const prescriptions = sqliteTable('prescriptions', {
  id: text('id').primaryKey(),
  customerId: text('customer_id')
    .notNull()
    .references(() => customers.id),
  saleId: text('sale_id').references(() => sales.id),
  doctorName: text('doctor_name'),
  doctorPhone: text('doctor_phone'),
  prescriptionNumber: text('prescription_number'),
  prescriptionDate: text('prescription_date').notNull(),
  diagnosis: text('diagnosis'),
  notes: text('notes'),
  imageUrl: text('image_url'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

// Stock Transfers table - DEPRECATED (no longer needed for single store)
// Kept for backward compatibility but not used in single-store mode
export const stockTransfers = sqliteTable('stock_transfers', {
  id: text('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  quantity: integer('quantity').notNull(),
  batchNumber: text('batch_number'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected', 'completed'
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  completedAt: text('completed_at')
})

// Settings table
export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
})

// Supplier Payments table
export const supplierPayments = sqliteTable('supplier_payments', {
  id: text('id').primaryKey(),
  supplierId: text('supplier_id')
    .notNull()
    .references(() => suppliers.id),
  accountId: text('account_id').references(() => bankAccounts.id),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  referenceNumber: text('reference_number').notNull().unique(),
  amount: real('amount').notNull(),
  paymentMethod: text('payment_method').notNull(), // 'cash', 'bank', 'cheque', 'mobile'
  paymentDate: text('payment_date').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

// Supplier Ledger Entries table (for tracking all supplier transactions)
export const supplierLedgerEntries = sqliteTable('supplier_ledger_entries', {
  id: text('id').primaryKey(),
  supplierId: text('supplier_id')
    .notNull()
    .references(() => suppliers.id),
  type: text('type').notNull(), // 'purchase', 'payment', 'return', 'adjustment', 'opening_balance'
  referenceId: text('reference_id'), // ID of related purchase, payment, or return
  referenceNumber: text('reference_number').notNull(),
  description: text('description').notNull(),
  debit: real('debit').default(0), // Purchase amounts (increases payable)
  credit: real('credit').default(0), // Payment amounts (decreases payable)
  balance: real('balance').notNull(), // Running balance
  transactionDate: text('transaction_date').notNull(),
  createdBy: text('created_by').references(() => users.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

// Damaged/Expired Items table
export const damagedItems = sqliteTable('damaged_items', {
  id: text('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  reason: text('reason').notNull(), // 'expired', 'damaged', 'defective'
  batchNumber: text('batch_number'),
  expiryDate: text('expiry_date'),
  notes: text('notes'),
  reportedBy: text('reported_by')
    .notNull()
    .references(() => users.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

// Audit Logs table
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  username: text('username'),
  action: text('action').notNull(), // 'create', 'update', 'delete', 'login', 'logout'
  entityType: text('entity_type').notNull(), // 'sale', 'product', 'user', etc.
  entityId: text('entity_id'),
  entityName: text('entity_name'),
  changes: text('changes'), // JSON string of changes
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

// User Salary Information table
export const userSalaries = sqliteTable('user_salaries', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  basicSalary: real('basic_salary').notNull().default(0), // Base salary
  allowances: real('allowances').default(0), // Additional allowances
  deductions: real('deductions').default(0), // Deductions (tax, insurance, etc.)
  netSalary: real('net_salary').notNull().default(0), // basicSalary + allowances - deductions
  paymentFrequency: text('payment_frequency').notNull().default('monthly'), // 'daily', 'weekly', 'monthly'
  bankAccountNumber: text('bank_account_number'),
  bankName: text('bank_name'),
  notes: text('notes'),
  effectiveFrom: text('effective_from').notNull(), // When this salary configuration became effective
  createdBy: text('created_by').references(() => users.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
})

// Salary Payments table
export const salaryPayments = sqliteTable('salary_payments', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  salaryId: text('salary_id')
    .notNull()
    .references(() => userSalaries.id),
  paymentDate: text('payment_date').notNull(),
  payPeriodStart: text('pay_period_start').notNull(),
  payPeriodEnd: text('pay_period_end').notNull(),
  basicAmount: real('basic_amount').notNull(),
  allowances: real('allowances').default(0),
  deductions: real('deductions').default(0),
  bonuses: real('bonuses').default(0),
  totalAmount: real('total_amount').notNull(), // Net amount paid
  paymentMethod: text('payment_method').notNull(), // 'cash', 'bank_transfer', 'cheque'
  accountId: text('account_id').references(() => bankAccounts.id), // Which account money came from
  transactionReference: text('transaction_reference'),
  notes: text('notes'),
  status: text('status').notNull().default('paid'), // 'pending', 'paid', 'cancelled'
  paidBy: text('paid_by')
    .notNull()
    .references(() => users.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
})

// User Attendance table
export const attendance = sqliteTable('attendance', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  date: text('date').notNull(), // Date of attendance (YYYY-MM-DD)
  checkIn: text('check_in'), // Check-in time
  checkOut: text('check_out'), // Check-out time
  status: text('status').notNull(), // 'present', 'absent', 'half_day', 'leave', 'holiday'
  leaveType: text('leave_type'), // 'sick', 'casual', 'annual', null if not on leave
  workHours: real('work_hours').default(0), // Total hours worked
  overtime: real('overtime').default(0), // Overtime hours
  notes: text('notes'),
  markedBy: text('marked_by').references(() => users.id), // Who marked the attendance
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
})

// Leave Requests table
export const leaveRequests = sqliteTable('leave_requests', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  leaveType: text('leave_type').notNull(), // 'sick', 'casual', 'annual', 'emergency'
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  totalDays: integer('total_days').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected'
  approvedBy: text('approved_by').references(() => users.id),
  approvedAt: text('approved_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
})

// Notifications table
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id), // null for system-wide notifications
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(), // 'info', 'success', 'warning', 'error', 'low_stock', 'expiry', 'sale', 'purchase'
  category: text('category').notNull().default('general'), // 'system', 'inventory', 'sales', 'general', 'alert'
  priority: text('priority').notNull().default('medium'), // 'low', 'medium', 'high', 'urgent'
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  readAt: text('read_at'),
  actionUrl: text('action_url'), // Optional URL to navigate when notification is clicked
  actionText: text('action_text'), // Optional text for action button
  metadata: text('metadata'), // JSON string for additional data
  expiresAt: text('expires_at'), // Optional expiration date
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
})
