/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import Database from 'better-sqlite3'

/**
 * Migration: Add version column for optimistic locking
 *
 * Adds version column to critical tables to prevent concurrent edit conflicts.
 * Version is incremented on each update and checked before updates to ensure
 * the record hasn't been modified by another user.
 */
export function addOptimisticLocking(db: Database.Database): void {
  console.log('Adding version columns for optimistic locking...')

  try {
    // Add version column to products table
    try {
      db.exec(`ALTER TABLE products ADD COLUMN version INTEGER NOT NULL DEFAULT 1`)
      console.log('✓ Added version column to products table')
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate column name')) {
        console.log('  version column already exists in products table')
      } else {
        throw error
      }
    }

    // Add version column to customers table
    try {
      db.exec(`ALTER TABLE customers ADD COLUMN version INTEGER NOT NULL DEFAULT 1`)
      console.log('✓ Added version column to customers table')
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate column name')) {
        console.log('  version column already exists in customers table')
      } else {
        throw error
      }
    }

    // Add version column to suppliers table
    try {
      db.exec(`ALTER TABLE suppliers ADD COLUMN version INTEGER NOT NULL DEFAULT 1`)
      console.log('✓ Added version column to suppliers table')
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate column name')) {
        console.log('  version column already exists in suppliers table')
      } else {
        throw error
      }
    }

    // Add version column to inventory table
    try {
      db.exec(`ALTER TABLE inventory ADD COLUMN version INTEGER NOT NULL DEFAULT 1`)
      console.log('✓ Added version column to inventory table')
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate column name')) {
        console.log('  version column already exists in inventory table')
      } else {
        throw error
      }
    }

    // Add version column to bank_accounts table
    try {
      db.exec(`ALTER TABLE bank_accounts ADD COLUMN version INTEGER NOT NULL DEFAULT 1`)
      console.log('✓ Added version column to bank_accounts table')
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate column name')) {
        console.log('  version column already exists in bank_accounts table')
      } else {
        throw error
      }
    }

    console.log('Optimistic locking migration completed successfully')
  } catch (error) {
    console.error('Error adding optimistic locking columns:', error)
    throw error
  }
}
