/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { and, desc, eq, gte, lt, sql } from 'drizzle-orm'
import { ipcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../../database'
import { inventoryBatches, products } from '../../database/schema'
import { createAuditLog } from '../utils/audit-logger'

interface BatchInput {
  productId: string
  batchNumber: string
  quantity: number
  expiryDate: string
  manufactureDate?: string
  unitCost?: number
  purchaseId?: string
}

interface BatchUpdateInput {
  id: string
  quantity: number
  version: number
  reason?: string
}

interface BatchForSale {
  id: string
  batchNumber: string
  expiryDate: string
  quantityAvailable: number
  quantityToUse: number
  unitCost: number
  version: number
}

/**
 * Register all batch management IPC handlers
 */
export function registerBatchHandlers(): void {
  // Create a new batch
  ipcMain.handle('batch:create', async (_, input: BatchInput) => {
    const db = getDatabase()

    try {
      const batchId = uuidv4()
      const now = new Date().toISOString()

      // Validate expiry date
      const expiryDate = new Date(input.expiryDate)
      if (expiryDate < new Date()) {
        throw new Error('Cannot create batch with past expiry date')
      }

      // Check if product exists
      const product = await db.select().from(products).where(eq(products.id, input.productId)).get()

      if (!product) {
        throw new Error('Product not found')
      }

      // Create batch
      await db.insert(inventoryBatches).values({
        id: batchId,
        productId: input.productId,
        batchNumber: input.batchNumber,
        quantity: input.quantity,
        expiryDate: input.expiryDate,
        manufactureDate: input.manufactureDate,
        purchaseId: input.purchaseId,
        unitCost: input.unitCost,
        version: 1,
        createdAt: now,
        updatedAt: now
      })

      // Log audit
      createAuditLog(db, {
        action: 'create',
        entityType: 'inventory_batch',
        entityId: batchId,
        changes: {
          productId: input.productId,
          batchNumber: input.batchNumber,
          quantity: input.quantity,
          expiryDate: input.expiryDate
        }
      })

      return { success: true, id: batchId }
    } catch (error) {
      console.error('Error creating batch:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Get all batches for a product (sorted by expiry date - FEFO)
  ipcMain.handle('batch:getByProduct', async (_, productId: string) => {
    const db = getDatabase()

    try {
      const batches = await db
        .select({
          id: inventoryBatches.id,
          batchNumber: inventoryBatches.batchNumber,
          quantity: inventoryBatches.quantity,
          expiryDate: inventoryBatches.expiryDate,
          manufactureDate: inventoryBatches.manufactureDate,
          purchaseId: inventoryBatches.purchaseId,
          unitCost: inventoryBatches.unitCost,
          version: inventoryBatches.version,
          createdAt: inventoryBatches.createdAt,
          updatedAt: inventoryBatches.updatedAt
        })
        .from(inventoryBatches)
        .where(eq(inventoryBatches.productId, productId))
        .orderBy(inventoryBatches.expiryDate) // FEFO order
        .all()

      // Calculate if expired or expiring soon
      const now = new Date()
      const enhancedBatches = batches.map((batch) => {
        const expiryDate = new Date(batch.expiryDate)
        const daysUntilExpiry = Math.floor(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        return {
          ...batch,
          isExpired: expiryDate < now,
          daysUntilExpiry,
          expiryStatus:
            expiryDate < now
              ? 'expired'
              : daysUntilExpiry <= 7
                ? 'critical'
                : daysUntilExpiry <= 30
                  ? 'warning'
                  : daysUntilExpiry <= 90
                    ? 'alert'
                    : 'good'
        }
      })

      return { success: true, batches: enhancedBatches }
    } catch (error) {
      console.error('Error fetching batches:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Select batches for sale using FEFO (First Expiry First Out)
  ipcMain.handle('batch:selectForSale', async (_, productId: string, requestedQuantity: number) => {
    const db = getDatabase()

    try {
      // Get all available batches for product (non-expired, quantity > 0)
      const now = new Date().toISOString()
      const availableBatches = await db
        .select()
        .from(inventoryBatches)
        .where(
          and(
            eq(inventoryBatches.productId, productId),
            gte(inventoryBatches.expiryDate, now),
            sql`${inventoryBatches.quantity} > 0`
          )
        )
        .orderBy(inventoryBatches.expiryDate) // FEFO: earliest expiry first
        .all()

      if (availableBatches.length === 0) {
        // Check if there are expired batches
        const expiredBatches = await db
          .select()
          .from(inventoryBatches)
          .where(
            and(
              eq(inventoryBatches.productId, productId),
              lt(inventoryBatches.expiryDate, now),
              sql`${inventoryBatches.quantity} > 0`
            )
          )
          .all()

        if (expiredBatches.length > 0) {
          throw new Error('All available batches are expired. Cannot sell expired products.')
        }

        throw new Error('No stock available for this product')
      }

      // Calculate total available quantity
      const totalAvailable = availableBatches.reduce((sum, batch) => sum + batch.quantity, 0)

      if (totalAvailable < requestedQuantity) {
        throw new Error(
          `Insufficient stock. Requested: ${requestedQuantity}, Available: ${totalAvailable}`
        )
      }

      // Select batches using FEFO
      const selectedBatches: BatchForSale[] = []
      let remainingQuantity = requestedQuantity

      for (const batch of availableBatches) {
        if (remainingQuantity <= 0) break

        const quantityToUse = Math.min(batch.quantity, remainingQuantity)

        selectedBatches.push({
          id: batch.id,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          quantityAvailable: batch.quantity,
          quantityToUse,
          unitCost: batch.unitCost || 0,
          version: batch.version
        })

        remainingQuantity -= quantityToUse
      }

      // Check if any batch is expiring soon (within 7 days)
      const expiringSoon = selectedBatches.some((batch) => {
        const expiryDate = new Date(batch.expiryDate)
        const daysUntilExpiry = Math.floor(
          (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysUntilExpiry <= 7
      })

      return {
        success: true,
        batches: selectedBatches,
        totalQuantity: requestedQuantity,
        warning: expiringSoon ? 'Some batches are expiring within 7 days' : null
      }
    } catch (error) {
      console.error('Error selecting batches for sale:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Update batch quantity (with optimistic locking)
  ipcMain.handle('batch:update', async (_, input: BatchUpdateInput) => {
    const db = getDatabase()

    try {
      // Update with optimistic locking
      const result = await db
        .update(inventoryBatches)
        .set({
          quantity: input.quantity,
          version: input.version + 1,
          updatedAt: new Date().toISOString()
        })
        .where(and(eq(inventoryBatches.id, input.id), eq(inventoryBatches.version, input.version)))
        .run()

      if (result.changes === 0) {
        throw new Error('Batch was modified by another process. Please refresh and try again.')
      }

      // Log audit
      createAuditLog(db, {
        action: 'update',
        entityType: 'inventory_batch',
        entityId: input.id,
        changes: {
          quantity: input.quantity,
          reason: input.reason || 'Manual adjustment'
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error updating batch:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Delete batch (only if quantity is 0)
  ipcMain.handle('batch:delete', async (_, batchId: string) => {
    const db = getDatabase()

    try {
      // Check if batch has quantity
      const batch = await db
        .select()
        .from(inventoryBatches)
        .where(eq(inventoryBatches.id, batchId))
        .get()

      if (!batch) {
        throw new Error('Batch not found')
      }

      if (batch.quantity > 0) {
        throw new Error('Cannot delete batch with remaining quantity')
      }

      // Delete batch
      await db.delete(inventoryBatches).where(eq(inventoryBatches.id, batchId)).run()

      // Log audit
      createAuditLog(db, {
        action: 'delete',
        entityType: 'inventory_batch',
        entityId: batchId,
        changes: {
          batchNumber: batch.batchNumber,
          productId: batch.productId
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting batch:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Get batches expiring within specified days
  ipcMain.handle('batch:getExpiring', async (_, days: number = 90) => {
    const db = getDatabase()

    try {
      const now = new Date()
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + days)

      const expiringBatches = await db
        .select({
          id: inventoryBatches.id,
          batchNumber: inventoryBatches.batchNumber,
          quantity: inventoryBatches.quantity,
          expiryDate: inventoryBatches.expiryDate,
          manufactureDate: inventoryBatches.manufactureDate,
          unitCost: inventoryBatches.unitCost,
          productId: inventoryBatches.productId,
          productName: products.name,
          productSku: products.sku,
          productBarcode: products.barcode
        })
        .from(inventoryBatches)
        .leftJoin(products, eq(inventoryBatches.productId, products.id))
        .where(
          and(
            gte(inventoryBatches.expiryDate, now.toISOString()),
            lt(inventoryBatches.expiryDate, futureDate.toISOString()),
            sql`${inventoryBatches.quantity} > 0`
          )
        )
        .orderBy(inventoryBatches.expiryDate)
        .all()

      // Calculate days until expiry and value at risk
      const enhancedBatches = expiringBatches.map((batch) => {
        const expiryDate = new Date(batch.expiryDate)
        const daysUntilExpiry = Math.floor(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        const valueAtRisk = batch.quantity * (batch.unitCost || 0)

        return {
          ...batch,
          daysUntilExpiry,
          valueAtRisk,
          urgency: daysUntilExpiry <= 7 ? 'critical' : daysUntilExpiry <= 30 ? 'high' : 'medium'
        }
      })

      return { success: true, batches: enhancedBatches }
    } catch (error) {
      console.error('Error fetching expiring batches:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Get all batches with pagination
  ipcMain.handle(
    'batch:getAll',
    async (_, options?: { page?: number; limit?: number; productId?: string }) => {
      const db = getDatabase()

      try {
        const page = options?.page || 1
        const limit = options?.limit || 50
        const offset = (page - 1) * limit

        const baseQuery = db
          .select({
            id: inventoryBatches.id,
            batchNumber: inventoryBatches.batchNumber,
            quantity: inventoryBatches.quantity,
            expiryDate: inventoryBatches.expiryDate,
            manufactureDate: inventoryBatches.manufactureDate,
            unitCost: inventoryBatches.unitCost,
            version: inventoryBatches.version,
            createdAt: inventoryBatches.createdAt,
            productId: inventoryBatches.productId,
            productName: products.name,
            productSku: products.sku,
            productBarcode: products.barcode
          })
          .from(inventoryBatches)
          .leftJoin(products, eq(inventoryBatches.productId, products.id))
          .orderBy(desc(inventoryBatches.createdAt))
          .limit(limit)
          .offset(offset)

        // Filter by product if specified
        const batches = options?.productId
          ? await baseQuery.where(eq(inventoryBatches.productId, options.productId)).all()
          : await baseQuery.all()

        // Get total count
        const countResult = options?.productId
          ? await db
              .select({ count: sql<number>`count(*)` })
              .from(inventoryBatches)
              .where(eq(inventoryBatches.productId, options.productId))
              .get()
          : await db
              .select({ count: sql<number>`count(*)` })
              .from(inventoryBatches)
              .get()

        const total = countResult?.count || 0
        const totalPages = Math.ceil(total / limit)

        return {
          success: true,
          batches,
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        }
      } catch (error) {
        console.error('Error fetching all batches:', error)
        return { success: false, error: (error as Error).message }
      }
    }
  )

  // Deduct quantity from batch (used internally by sales)
  ipcMain.handle(
    'batch:deductQuantity',
    async (_, batchId: string, quantity: number, version: number) => {
      const db = getDatabase()

      try {
        // Get current batch
        const batch = await db
          .select()
          .from(inventoryBatches)
          .where(eq(inventoryBatches.id, batchId))
          .get()

        if (!batch) {
          throw new Error('Batch not found')
        }

        if (batch.quantity < quantity) {
          throw new Error('Insufficient batch quantity')
        }

        // Update with optimistic locking
        const newQuantity = batch.quantity - quantity
        const result = await db
          .update(inventoryBatches)
          .set({
            quantity: newQuantity,
            version: version + 1,
            updatedAt: new Date().toISOString()
          })
          .where(and(eq(inventoryBatches.id, batchId), eq(inventoryBatches.version, version)))
          .run()

        if (result.changes === 0) {
          throw new Error('Batch was modified by another process. Please refresh and try again.')
        }

        return { success: true, newQuantity }
      } catch (error) {
        console.error('Error deducting batch quantity:', error)
        return { success: false, error: (error as Error).message }
      }
    }
  )

  // Dispose of batch (set quantity to 0 with audit log)
  ipcMain.handle(
    'batch:dispose',
    async (_, input: { batchId: string; reason: string; userId?: string }) => {
      const db = getDatabase()

      try {
        // Get current batch
        const batch = await db
          .select()
          .from(inventoryBatches)
          .where(eq(inventoryBatches.id, input.batchId))
          .get()

        if (!batch) {
          throw new Error('Batch not found')
        }

        const disposedQuantity = batch.quantity
        const disposedValue = batch.quantity * (batch.unitCost || 0)

        // Set quantity to 0
        const result = await db
          .update(inventoryBatches)
          .set({
            quantity: 0,
            version: batch.version + 1,
            updatedAt: new Date().toISOString()
          })
          .where(eq(inventoryBatches.id, input.batchId))
          .run()

        if (result.changes === 0) {
          throw new Error('Failed to dispose batch')
        }

        // Get product info for audit log
        const product = await db
          .select()
          .from(products)
          .where(eq(products.id, batch.productId))
          .get()

        // Log comprehensive audit trail
        createAuditLog(db, {
          userId: input.userId,
          action: 'delete',
          entityType: 'inventory_batch_disposal',
          entityId: input.batchId,
          entityName: `${product?.name || 'Unknown'} - Batch ${batch.batchNumber}`,
          changes: {
            batchNumber: batch.batchNumber,
            productId: batch.productId,
            productName: product?.name,
            disposedQuantity,
            disposedValue,
            expiryDate: batch.expiryDate,
            reason: input.reason,
            disposedAt: new Date().toISOString()
          }
        })

        return {
          success: true,
          data: {
            batchNumber: batch.batchNumber,
            productName: product?.name,
            disposedQuantity,
            disposedValue
          }
        }
      } catch (error) {
        console.error('Error disposing batch:', error)
        return { success: false, error: (error as Error).message }
      }
    }
  )

  console.log('Batch handlers registered')
}
