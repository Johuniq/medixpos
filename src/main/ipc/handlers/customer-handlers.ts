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

export function registerCustomerHandlers(): void {
  const db = getDatabase()

  // Get paginated customers
  ipcMain.handle(
    'db:customers:getPaginated',
    async (_, params: PaginationParams): Promise<PaginatedResponse<unknown>> => {
      const page = params.page || 1
      const limit = params.limit || 50
      const offset = (page - 1) * limit
      const search = params.search?.trim()

      // Build where clause
      const whereClause = search
        ? and(
            eq(schema.customers.isActive, true),
            sql`(${schema.customers.name} LIKE ${`%${search}%`} OR ${schema.customers.phone} LIKE ${`%${search}%`})`
          )
        : eq(schema.customers.isActive, true)

      // Get total count
      const countResult = db
        .select({ count: sql<number>`count(*)` })
        .from(schema.customers)
        .where(whereClause)
        .get()

      const total = countResult?.count || 0

      // Get paginated data
      const data = db
        .select()
        .from(schema.customers)
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

  // Get all active customers (with optional search) - kept for backward compatibility
  ipcMain.handle('db:customers:getAll', async (_, search?: string) => {
    if (search) {
      return db
        .select()
        .from(schema.customers)
        .where(
          and(
            eq(schema.customers.isActive, true),
            sql`(${schema.customers.name} LIKE ${`%${search}%`} OR ${schema.customers.phone} LIKE ${`%${search}%`})`
          )
        )
        .all()
    }
    return db.select().from(schema.customers).where(eq(schema.customers.isActive, true)).all()
  })

  // Get customer by phone
  ipcMain.handle('db:customers:getByPhone', async (_, phone: string) => {
    return db.select().from(schema.customers).where(eq(schema.customers.phone, phone)).get()
  })

  // Create new customer
  ipcMain.handle('db:customers:create', async (_, data) => {
    const id = uuidv4()

    // Transform status to isActive (boolean)
    const isActive = data.status === 'active'

    // Prepare customer data with proper field mapping
    const customerData = {
      id,
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      address: data.address || null,
      dateOfBirth: data.dateOfBirth || null,
      loyaltyPoints: 0,
      isActive
    }

    const result = db.insert(schema.customers).values(customerData).returning().get()

    createAuditLog(db, {
      action: 'create',
      entityType: 'customer',
      entityId: id,
      entityName: result.name
    })

    return result
  })

  // Update customer
  ipcMain.handle('db:customers:update', async (_, { id, data }) => {
    const oldCustomer = db.select().from(schema.customers).where(eq(schema.customers.id, id)).get()

    if (!oldCustomer) {
      throw new Error('Customer not found')
    }

    // Optimistic locking: Check version
    const currentVersion = data.version || oldCustomer.version
    if (currentVersion !== oldCustomer.version) {
      throw new Error(
        'CONCURRENT_EDIT: This customer was modified by another user. Please refresh and try again.'
      )
    }

    // Transform status to isActive (boolean)
    const isActive = data.status === 'active'

    // Prepare update data with proper field mapping
    const updateData = {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      address: data.address || null,
      dateOfBirth: data.dateOfBirth || null,
      isActive,
      version: oldCustomer.version + 1,
      updatedAt: new Date().toISOString()
    }

    const result = db
      .update(schema.customers)
      .set(updateData)
      .where(eq(schema.customers.id, id))
      .returning()
      .get()

    const changes: Record<string, { old: unknown; new: unknown }> = {}
    if (oldCustomer) {
      Object.keys(updateData).forEach((key) => {
        if (key !== 'version' && oldCustomer[key] !== updateData[key]) {
          changes[key] = { old: oldCustomer[key], new: updateData[key] }
        }
      })
    }

    createAuditLog(db, {
      action: 'update',
      entityType: 'customer',
      entityId: id,
      entityName: result.name,
      changes: Object.keys(changes).length > 0 ? changes : undefined
    })

    return result
  })

  // Soft delete customer (mark as inactive)
  ipcMain.handle('db:customers:delete', async (_, id: string) => {
    try {
      const customer = db.select().from(schema.customers).where(eq(schema.customers.id, id)).get()

      if (!customer) {
        throw new Error('Customer not found')
      }

      const result = db
        .update(schema.customers)
        .set({
          isActive: false,
          updatedAt: new Date().toISOString()
        })
        .where(eq(schema.customers.id, id))
        .returning()
        .get()

      createAuditLog(db, {
        action: 'delete',
        entityType: 'customer',
        entityId: id,
        entityName: customer.name
      })

      return result
    } catch (error) {
      console.error('Error deleting customer:', error)
      throw new Error('Failed to delete customer')
    }
  })

  // Get customer by ID
  ipcMain.handle('db:customers:getById', async (_, id: string) => {
    return db.select().from(schema.customers).where(eq(schema.customers.id, id)).get()
  })

  // Recalculate customer loyalty points and total purchases from sales
  ipcMain.handle('db:customers:recalculateStats', async () => {
    try {
      const customers = db.select().from(schema.customers).all()

      for (const customer of customers) {
        // Get all completed sales for this customer
        const sales = db
          .select()
          .from(schema.sales)
          .where(
            and(eq(schema.sales.customerId, customer.id), eq(schema.sales.status, 'completed'))
          )
          .all()

        // Calculate total purchases
        const totalPurchases = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)

        // Calculate loyalty points (1 point per $10)
        const loyaltyPoints = Math.floor(totalPurchases / 10)

        // Update customer
        db.update(schema.customers)
          .set({
            totalPurchases,
            loyaltyPoints,
            updatedAt: new Date().toISOString()
          })
          .where(eq(schema.customers.id, customer.id))
          .run()
      }

      return { success: true, message: 'Customer stats recalculated successfully' }
    } catch (error) {
      console.error('Error recalculating customer stats:', error)
      return { success: false, message: 'Failed to recalculate customer stats' }
    }
  })
}
