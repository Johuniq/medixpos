/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import type { Database } from 'better-sqlite3'

/**
 * Migration: Add Multi-Batch Inventory Management
 *
 * Creates inventory_batches table to support multiple batches per product
 * with FIFO/FEFO (First Expiry First Out) functionality.
 *
 * This is critical for pharmacy operations to:
 * - Track multiple batches with different expiry dates
 * - Implement FEFO for expiring stock
 * - Support product recalls by batch number
 * - Maintain regulatory compliance
 */
export function addInventoryBatches(db: Database): void {
  console.log('Adding inventory_batches table for multi-batch support...')

  try {
    // Check if table already exists
    const tableExists = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='inventory_batches'`)
      .get()

    if (tableExists) {
      console.log('inventory_batches table already exists')

      // Migrate existing inventory data to batches if batches table is empty
      const batchCount = db.prepare('SELECT COUNT(*) as count FROM inventory_batches').get() as {
        count: number
      }

      if (batchCount.count === 0) {
        console.log('Migrating existing inventory to batches...')

        // Get all existing inventory records
        const inventoryRecords = db
          .prepare(
            `SELECT id, product_id, batch_number, quantity, expiry_date, manufacture_date, created_at 
             FROM inventory 
             WHERE quantity > 0`
          )
          .all() as Array<{
          id: string
          product_id: string
          batch_number: string | null
          quantity: number
          expiry_date: string | null
          manufacture_date: string | null
          created_at: string
        }>

        // Insert each record as a batch
        const insertBatch = db.prepare(`
          INSERT INTO inventory_batches (
            id, product_id, batch_number, quantity, expiry_date, 
            manufacture_date, unit_cost, version, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)

        let migratedCount = 0
        for (const record of inventoryRecords) {
          // Generate a batch ID
          const batchId = `batch-${record.id}`
          const batchNumber = record.batch_number || `LEGACY-${record.product_id.slice(0, 8)}`
          const expiryDate = record.expiry_date || '2099-12-31' // Default far future if no expiry
          const now = new Date().toISOString()

          insertBatch.run(
            batchId,
            record.product_id,
            batchNumber,
            record.quantity,
            expiryDate,
            record.manufacture_date,
            null, // unit_cost unknown for legacy data
            1, // version
            record.created_at,
            now
          )
          migratedCount++
        }

        console.log(`Migrated ${migratedCount} inventory records to batches`)
      }

      return
    }

    // Create inventory_batches table
    db.exec(`
      CREATE TABLE inventory_batches (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        batch_number TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        expiry_date TEXT NOT NULL,
        manufacture_date TEXT,
        purchase_id TEXT,
        unit_cost REAL,
        version INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `)

    // Create indexes for efficient queries
    db.exec(`
      CREATE INDEX idx_inventory_batches_product 
      ON inventory_batches(product_id)
    `)

    db.exec(`
      CREATE INDEX idx_inventory_batches_expiry 
      ON inventory_batches(expiry_date)
    `)

    db.exec(`
      CREATE INDEX idx_inventory_batches_batch_number 
      ON inventory_batches(batch_number)
    `)

    // Create composite index for FEFO queries (product + expiry + quantity)
    db.exec(`
      CREATE INDEX idx_inventory_batches_fefo 
      ON inventory_batches(product_id, expiry_date, quantity)
    `)

    console.log('inventory_batches table created successfully')

    // Migrate existing inventory data to batches
    console.log('Migrating existing inventory to batches...')

    const inventoryRecords = db
      .prepare(
        `SELECT id, product_id, batch_number, quantity, expiry_date, manufacture_date, created_at 
         FROM inventory 
         WHERE quantity > 0`
      )
      .all() as Array<{
      id: string
      product_id: string
      batch_number: string | null
      quantity: number
      expiry_date: string | null
      manufacture_date: string | null
      created_at: string
    }>

    const insertBatch = db.prepare(`
      INSERT INTO inventory_batches (
        id, product_id, batch_number, quantity, expiry_date, 
        manufacture_date, unit_cost, version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    let migratedCount = 0
    for (const record of inventoryRecords) {
      const batchId = `batch-${record.id}`
      const batchNumber = record.batch_number || `LEGACY-${record.product_id.slice(0, 8)}`
      const expiryDate = record.expiry_date || '2099-12-31'
      const now = new Date().toISOString()

      insertBatch.run(
        batchId,
        record.product_id,
        batchNumber,
        record.quantity,
        expiryDate,
        record.manufacture_date,
        null,
        1,
        record.created_at,
        now
      )
      migratedCount++
    }

    console.log(`Migrated ${migratedCount} inventory records to batches`)
    console.log('inventory_batches migration completed successfully')
  } catch (error) {
    console.error('Error in inventory_batches migration:', error)
    throw error
  }
}
