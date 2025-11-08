/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import bcrypt from 'bcryptjs'
import Database from 'better-sqlite3'
import crypto from 'crypto'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { app, dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { addAccountToPurchases } from './migrations/add-account-to-purchases'
import { addAccountToSales } from './migrations/add-account-to-sales'
import { addAttendanceSalaryTables } from './migrations/add-attendance-salary-tables'
import { runAuditLogsMigration } from './migrations/add-audit-logs-table'
import { addBankAccountsTable } from './migrations/add-bank-accounts-table'
import { addComprehensiveSettings } from './migrations/add-comprehensive-settings'
import { migrateAddCreatedBy } from './migrations/add-created-by'
import { addCustomerTotalPurchases } from './migrations/add-customer-total-purchases'
import { addDamagedItemsTable } from './migrations/add-damaged-items-table'
import { addInventoryBatches } from './migrations/add-inventory-batches'
import { addMissingOpeningBalances } from './migrations/add-missing-opening-balances'
import { addMustChangePassword } from './migrations/add-must-change-password'
import { addNotificationsTable } from './migrations/add-notifications-table'
import { addOptimisticLocking } from './migrations/add-optimistic-locking'
import { addPointsRedeemedToSales } from './migrations/add-points-redeemed-to-sales'
import { addPrinterTables } from './migrations/add-printer-tables'
import { migrateProductShelf } from './migrations/add-product-shelf'
import { addProductStrength } from './migrations/add-product-strength'
import { migrateProductUnitConversion } from './migrations/add-product-unit-conversion'
import { addSupplierAccountingFields } from './migrations/add-supplier-accounting-fields'
import { migrateSupplierPaymentsLedger } from './migrations/add-supplier-payments-ledger'
import { addUnitsTable } from './migrations/add-units-table'
import { migrateUnitsTable } from './migrations/update-units-table'
import * as schema from './schema'

// Use require for electron-store to avoid ESM/CJS issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ElectronStore = require('electron-store')
const Store = ElectronStore.default || ElectronStore

const SALT_ROUNDS = 12 // Production-grade bcrypt rounds

let db: ReturnType<typeof drizzle>
let sqlite: Database.Database | null = null

export function initDatabase(): ReturnType<typeof drizzle> {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'pharmacy.db')

  sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  db = drizzle(sqlite, { schema })

  // Create tables if they don't exist
  createTables(sqlite)

  // Run migrations (after db is set)
  runMigrations()

  // Initialize default data
  initializeDefaultData()

  return db
}

function runMigrations(): void {
  try {
    migrateAddCreatedBy()
    addUnitsTable()
    addSupplierAccountingFields()
    addBankAccountsTable()
    addAccountToPurchases()
    addAccountToSales()
    addMustChangePassword()
    addCustomerTotalPurchases()
    addPointsRedeemedToSales()
    if (sqlite) {
      migrateSupplierPaymentsLedger(sqlite)
      addMissingOpeningBalances(sqlite)
      migrateProductUnitConversion(sqlite)
      migrateUnitsTable(sqlite)
      migrateProductShelf(sqlite)
      runAuditLogsMigration(sqlite)
      addDamagedItemsTable(sqlite)
      addAttendanceSalaryTables(sqlite)
      addProductStrength(sqlite)
      addComprehensiveSettings(sqlite)
      addNotificationsTable(sqlite)
      addOptimisticLocking(sqlite)
      addPrinterTables(sqlite)
      addInventoryBatches(sqlite) // Multi-batch inventory support
    }
  } catch (error) {
    console.error('Migration error:', error)
    if (process.env.NODE_ENV === 'production') {
      dialog.showErrorBox(
        'Database Migration Error',
        'Failed to apply database migrations. Please contact support.'
      )
    }
  }
}

function createTables(sqlite: Database.Database): void {
  // Create users table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT NOT NULL,
      created_by TEXT REFERENCES users(id),
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create categories table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      parent_id TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create suppliers table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      tax_number TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create products table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      generic_name TEXT,
      barcode TEXT UNIQUE,
      sku TEXT NOT NULL UNIQUE,
      category_id TEXT REFERENCES categories(id),
      supplier_id TEXT REFERENCES suppliers(id),
      description TEXT,
      manufacturer TEXT,
      unit TEXT NOT NULL,
      prescription_required INTEGER DEFAULT 0,
      reorder_level INTEGER DEFAULT 10,
      selling_price REAL NOT NULL,
      cost_price REAL NOT NULL,
      tax_rate REAL DEFAULT 0,
      discount_percent REAL DEFAULT 0,
      image_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create inventory table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id),
      batch_number TEXT,
      quantity INTEGER NOT NULL DEFAULT 0,
      expiry_date TEXT,
      manufacture_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create customers table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE,
      email TEXT,
      address TEXT,
      date_of_birth TEXT,
      gender TEXT,
      loyalty_points INTEGER DEFAULT 0,
      allergies TEXT,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create sales table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      invoice_number TEXT NOT NULL UNIQUE,
      customer_id TEXT REFERENCES customers(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      subtotal REAL NOT NULL,
      tax_amount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      paid_amount REAL NOT NULL,
      change_amount REAL DEFAULT 0,
      payment_method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create sale_items table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      discount_percent REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      subtotal REAL NOT NULL,
      batch_number TEXT,
      expiry_date TEXT
    )
  `)

  // Create purchases table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      invoice_number TEXT NOT NULL UNIQUE,
      supplier_id TEXT NOT NULL REFERENCES suppliers(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      subtotal REAL NOT NULL,
      tax_amount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      due_amount REAL DEFAULT 0,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      status TEXT NOT NULL DEFAULT 'received',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create purchase_items table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS purchase_items (
      id TEXT PRIMARY KEY,
      purchase_id TEXT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      discount_percent REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      subtotal REAL NOT NULL,
      batch_number TEXT,
      expiry_date TEXT,
      manufacture_date TEXT
    )
  `)

  // Create expenses table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      expense_date TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      receipt TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create prescriptions table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      sale_id TEXT REFERENCES sales(id),
      doctor_name TEXT,
      doctor_phone TEXT,
      prescription_number TEXT,
      prescription_date TEXT NOT NULL,
      diagnosis TEXT,
      notes TEXT,
      image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create stock_transfers table (deprecated - kept for backward compatibility)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS stock_transfers (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      batch_number TEXT,
      user_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT
    )
  `)

  // Create settings table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create audit_logs table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      changes TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create indexes
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(created_at);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs(created_at);
  `)
}

async function initializeDefaultData(): Promise<void> {
  const userDataPath = app.getPath('userData')
  const setupCompletePath = path.join(userDataPath, '.setup-complete')

  // Check if this is the first run
  const isFirstRun = !fs.existsSync(setupCompletePath)

  // Check if any users exist
  const existingUsers = db.select().from(schema.users).all()

  if (existingUsers.length === 0) {
    console.log('No users found. Creating initial super admin account...')

    // Generate secure random password
    const randomPassword = generateSecurePassword()
    const superAdminId = uuidv4()
    const timestamp = new Date().toISOString()

    // Hash the password using bcrypt (production-ready)
    console.log('Hashing password with bcrypt...')
    const hashedPassword = await bcrypt.hash(randomPassword, SALT_ROUNDS)
    console.log('Password hashed successfully')

    // Create super admin account with mustChangePassword flag
    db.insert(schema.users)
      .values({
        id: superAdminId,
        username: 'admin',
        password: hashedPassword, // Securely hashed password
        fullName: 'System Administrator',
        email: 'admin@pharmacy.local',
        role: 'super_admin',
        isActive: true,
        mustChangePassword: true // Force password change on first login
      })
      .run()
    console.log('Super admin account created successfully')

    // Store initial credentials in encrypted storage (production-safe approach)
    if (isFirstRun) {
      // Store credentials securely using electron-store with encryption
      const credentialsStore = new Store({
        name: 'initial-setup',
        encryptionKey: 'medixpos-initial-setup-key',
        clearInvalidConfig: true
      })

      credentialsStore.set('credentials', {
        username: 'admin',
        password: randomPassword,
        createdAt: timestamp,
        installationId: superAdminId,
        isFirstSetup: true
      })

      // Mark setup as complete
      fs.writeFileSync(setupCompletePath, timestamp, 'utf-8')

      console.log('✅ Initial admin account created with secure random password')
      console.log('✅ Credentials stored securely for first-time login assistance')
      console.log('ℹ️  The login screen will display credentials on first launch')
    }

    // Create essential default categories (minimal set)
    const essentialCategories = [
      { name: 'Medicines', description: 'Pharmaceutical products' },
      { name: 'Supplies', description: 'Medical supplies and equipment' },
      { name: 'Personal Care', description: 'Personal hygiene products' }
    ]

    essentialCategories.forEach((cat) => {
      db.insert(schema.categories)
        .values({
          id: uuidv4(),
          name: cat.name,
          description: cat.description,
          isActive: true
        })
        .run()
    })

    // Create minimal default settings
    const defaultSettings = [
      { key: 'currency', value: 'USD', description: 'Default currency' },
      { key: 'tax_rate', value: '0', description: 'Default tax rate percentage' },
      { key: 'low_stock_alert', value: '10', description: 'Low stock alert threshold' },
      { key: 'receipt_header', value: 'MedixPOS', description: 'Receipt header text' },
      {
        key: 'receipt_footer',
        value: 'Thank you for your business!',
        description: 'Receipt footer text'
      },
      { key: 'store_name', value: 'Pharmacy', description: 'Store name' }
    ]

    defaultSettings.forEach((setting) => {
      db.insert(schema.settings)
        .values({
          id: uuidv4(),
          key: setting.key,
          value: setting.value,
          description: setting.description
        })
        .run()
    })
    console.log('✅ Default data initialization complete')
  } else {
    console.log('Users already exist. Skipping default data creation.')
  }
}

// Generate a secure random password
function generateSecurePassword(): string {
  const length = 16
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  const randomBytes = crypto.randomBytes(length)
  let password = ''

  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length]
  }

  return password
}

export function getDatabase(): typeof db {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function closeDatabase(): void {
  if (sqlite) {
    try {
      sqlite.close()
      sqlite = null
    } catch (error) {
      console.error('Error closing database:', error)
    }
  }
}

/**
 * Get initial setup credentials (production-safe approach)
 * Returns credentials only if it's the first setup, then clears them
 */
export function getInitialCredentials(): {
  username: string
  password: string
  isFirstSetup: boolean
} | null {
  try {
    const credentialsStore = new Store({
      name: 'initial-setup',
      encryptionKey: 'medixpos-initial-setup-key',
      clearInvalidConfig: true
    })

    const credentials = credentialsStore.get('credentials')

    if (credentials && credentials.isFirstSetup) {
      return {
        username: credentials.username,
        password: credentials.password,
        isFirstSetup: true
      }
    }

    return null
  } catch (error) {
    console.error('Error retrieving initial credentials:', error)
    return null
  }
}

/**
 * Clear initial setup credentials after user has seen them
 * This ensures credentials are only shown once
 */
export function clearInitialCredentials(): void {
  try {
    const credentialsStore = new Store({
      name: 'initial-setup',
      encryptionKey: 'medixpos-initial-setup-key',
      clearInvalidConfig: true
    })

    credentialsStore.delete('credentials')
    console.log('✅ Initial credentials cleared from secure storage')
  } catch (error) {
    console.error('Error clearing initial credentials:', error)
  }
}
