/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { and, eq, sql } from 'drizzle-orm'
import { ipcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../../database'
import * as schema from '../../database/schema'
import { createAuditLog } from '../utils/audit-logger'

interface PaginationParams {
  page?: number
  limit?: number
  search?: string
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function registerProductInventoryHandlers(): void {
  const db = getDatabase()

  // ==================== PRODUCTS ====================

  // Get paginated products
  ipcMain.handle(
    'db:products:getPaginated',
    async (_, params: PaginationParams): Promise<PaginatedResponse<unknown>> => {
      const page = params.page || 1
      const limit = params.limit || 50
      const offset = (page - 1) * limit
      const search = params.search?.trim()

      // Build where clause
      const whereClause = search
        ? and(
            eq(schema.products.isActive, true),
            sql`(${schema.products.name} LIKE ${`%${search}%`} OR ${schema.products.barcode} LIKE ${`%${search}%`} OR ${schema.products.sku} LIKE ${`%${search}%`})`
          )
        : eq(schema.products.isActive, true)

      // Get total count
      const countResult = db
        .select({ count: sql<number>`count(*)` })
        .from(schema.products)
        .where(whereClause)
        .get()

      const total = countResult?.count || 0

      // Get paginated data
      const data = db
        .select()
        .from(schema.products)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .all()

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  )

  // Get all active products (with optional search) - kept for backward compatibility
  ipcMain.handle('db:products:getAll', async (_, search?: string) => {
    if (search) {
      return db
        .select()
        .from(schema.products)
        .where(
          and(
            eq(schema.products.isActive, true),
            sql`(${schema.products.name} LIKE ${`%${search}%`} OR ${schema.products.barcode} LIKE ${`%${search}%`} OR ${schema.products.sku} LIKE ${`%${search}%`})`
          )
        )
        .all()
    }
    return db.select().from(schema.products).where(eq(schema.products.isActive, true)).all()
  })

  // Get product by ID
  ipcMain.handle('db:products:getById', async (_, id: string) => {
    return db.select().from(schema.products).where(eq(schema.products.id, id)).get()
  })

  // Get product by barcode
  ipcMain.handle('db:products:getByBarcode', async (_, barcode: string) => {
    return db.select().from(schema.products).where(eq(schema.products.barcode, barcode)).get()
  })

  // Search products
  ipcMain.handle('db:products:search', async (_, search: string) => {
    if (!search || search.trim().length === 0) {
      return []
    }
    return db
      .select()
      .from(schema.products)
      .where(
        and(
          eq(schema.products.isActive, true),
          sql`(${schema.products.name} LIKE ${`%${search}%`} OR ${schema.products.barcode} LIKE ${`%${search}%`} OR ${schema.products.sku} LIKE ${`%${search}%`})`
        )
      )
      .limit(20)
      .all()
  })

  // Create new product
  ipcMain.handle('db:products:create', async (_, data) => {
    const id = uuidv4()
    const result = db
      .insert(schema.products)
      .values({ id, ...data })
      .returning()
      .get()

    createAuditLog(db, {
      action: 'create',
      entityType: 'product',
      entityId: id,
      entityName: result.name
    })

    return result
  })

  // Update product
  ipcMain.handle('db:products:update', async (_, { id, data }) => {
    const oldProduct = db.select().from(schema.products).where(eq(schema.products.id, id)).get()

    if (!oldProduct) {
      throw new Error('Product not found')
    }

    // Optimistic locking: Check version
    const currentVersion = data.version || oldProduct.version
    if (currentVersion !== oldProduct.version) {
      throw new Error(
        'CONCURRENT_EDIT: This product was modified by another user. Please refresh and try again.'
      )
    }

    const result = db
      .update(schema.products)
      .set({ ...data, version: oldProduct.version + 1, updatedAt: new Date().toISOString() })
      .where(eq(schema.products.id, id))
      .returning()
      .get()

    const changes: Record<string, { old: unknown; new: unknown }> = {}
    if (oldProduct) {
      Object.keys(data).forEach((key) => {
        if (key !== 'version' && oldProduct[key] !== data[key]) {
          changes[key] = { old: oldProduct[key], new: data[key] }
        }
      })
    }

    createAuditLog(db, {
      action: 'update',
      entityType: 'product',
      entityId: id,
      entityName: result.name,
      changes: Object.keys(changes).length > 0 ? changes : undefined
    })

    return result
  })

  // Delete product (soft delete)
  ipcMain.handle('db:products:delete', async (_, id: string) => {
    const product = db.select().from(schema.products).where(eq(schema.products.id, id)).get()

    const result = db
      .update(schema.products)
      .set({ isActive: false })
      .where(eq(schema.products.id, id))
      .run()

    if (product) {
      createAuditLog(db, {
        action: 'delete',
        entityType: 'product',
        entityId: id,
        entityName: product.name
      })
    }

    return result
  })

  // ==================== INVENTORY ====================

  // Get paginated inventory items
  ipcMain.handle(
    'db:inventory:getPaginated',
    async (_, params: PaginationParams): Promise<PaginatedResponse<unknown>> => {
      const page = params.page || 1
      const limit = params.limit || 50
      const offset = (page - 1) * limit
      const search = params.search?.trim()

      // Build where clause
      const whereClause = search
        ? sql`(${schema.products.name} LIKE ${`%${search}%`} OR ${schema.products.sku} LIKE ${`%${search}%`} OR ${schema.products.barcode} LIKE ${`%${search}%`})`
        : undefined

      // Get total count
      const countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(schema.inventory)
        .innerJoin(schema.products, eq(schema.inventory.productId, schema.products.id))

      const countResult = whereClause ? countQuery.where(whereClause).get() : countQuery.get()

      const total = countResult?.count || 0

      // Get paginated data
      const dataQuery = db
        .select({
          id: schema.inventory.id,
          productId: schema.inventory.productId,
          quantity: schema.inventory.quantity,
          batchNumber: schema.inventory.batchNumber,
          expiryDate: schema.inventory.expiryDate,
          version: schema.inventory.version,
          productName: schema.products.name,
          productSku: schema.products.sku,
          productBarcode: schema.products.barcode,
          sellingPrice: schema.products.sellingPrice,
          reorderLevel: schema.products.reorderLevel
        })
        .from(schema.inventory)
        .innerJoin(schema.products, eq(schema.inventory.productId, schema.products.id))
        .limit(limit)
        .offset(offset)

      const data = whereClause ? dataQuery.where(whereClause).all() : dataQuery.all()

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  )

  // Get all inventory items - kept for backward compatibility
  ipcMain.handle('db:inventory:getAll', async () => {
    return db
      .select({
        id: schema.inventory.id,
        productId: schema.inventory.productId,
        quantity: schema.inventory.quantity,
        batchNumber: schema.inventory.batchNumber,
        expiryDate: schema.inventory.expiryDate,
        productName: schema.products.name,
        productSku: schema.products.sku,
        productBarcode: schema.products.barcode,
        sellingPrice: schema.products.sellingPrice,
        reorderLevel: schema.products.reorderLevel
      })
      .from(schema.inventory)
      .innerJoin(schema.products, eq(schema.inventory.productId, schema.products.id))
      .all()
  })

  // Get low stock items
  ipcMain.handle('db:inventory:getLowStock', async () => {
    return db
      .select({
        id: schema.inventory.id,
        productId: schema.inventory.productId,
        productName: schema.products.name,
        quantity: schema.inventory.quantity,
        reorderLevel: schema.products.reorderLevel,
        unitPrice: schema.products.sellingPrice
      })
      .from(schema.inventory)
      .innerJoin(schema.products, eq(schema.inventory.productId, schema.products.id))
      .where(sql`${schema.inventory.quantity} <= ${schema.products.reorderLevel}`)
      .all()
  })

  // Update inventory quantity
  ipcMain.handle(
    'db:inventory:updateQuantity',
    async (_, { productId, quantity, userId, username, version }) => {
      try {
        // Validate that product exists
        const product = db
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, productId))
          .get()

        if (!product) {
          throw new Error(`Product with ID ${productId} does not exist`)
        }

        const existing = db
          .select()
          .from(schema.inventory)
          .where(eq(schema.inventory.productId, productId))
          .get()

        let result
        let oldQuantity = 0
        let newQuantity = quantity

        if (existing) {
          // Optimistic locking: Check version
          const currentVersion = version || existing.version
          if (currentVersion !== existing.version) {
            throw new Error(
              'CONCURRENT_EDIT: This inventory was modified by another user. Please refresh and try again.'
            )
          }

          oldQuantity = existing.quantity
          newQuantity = quantity // Set to the new quantity directly, don't add
          result = db
            .update(schema.inventory)
            .set({
              quantity: newQuantity,
              version: existing.version + 1,
              updatedAt: new Date().toISOString()
            })
            .where(eq(schema.inventory.id, existing.id))
            .returning()
            .get()
        } else {
          const id = uuidv4()
          result = db.insert(schema.inventory).values({ id, productId, quantity }).returning().get()
        }

        // Create audit log for inventory adjustment
        createAuditLog(db, {
          userId: userId,
          username: username,
          action: existing ? 'update' : 'create',
          entityType: 'inventory',
          entityId: result.id,
          entityName: product.name,
          changes: {
            productId,
            oldQuantity,
            newQuantity,
            adjustment: quantity
          }
        })

        return result
      } catch (error) {
        console.error('Error updating inventory quantity:', error)
        throw error
      }
    }
  )
}
