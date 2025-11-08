/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { and, desc, eq, gte, like, lte, or, sql, SQL } from 'drizzle-orm'
import { ipcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../../database'
import * as schema from '../../database/schema'
import { createAuditLog } from '../utils/audit-logger'

interface PaginationParams {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
  search?: string
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function registerSalesHandlers(): void {
  const db = getDatabase()

  // ==================== SALES ====================

  // Create new sale
  ipcMain.handle('db:sales:create', async (_, { sale, items }) => {
    // Wrap entire sale creation in a transaction to ensure atomicity
    return db.transaction((tx) => {
      try {
        const saleId = uuidv4()
        const saleResult = tx
          .insert(schema.sales)
          .values({ id: saleId, ...sale })
          .returning()
          .get()

        // Insert sale items
        const saleItemsData = items.map((item) => ({
          id: uuidv4(),
          saleId,
          ...item
        }))

        if (saleItemsData.length > 0) {
          tx.insert(schema.saleItems).values(saleItemsData).run()
        }

        // Update inventory - check for sufficient stock first
        for (const item of items) {
          const inventory = tx
            .select()
            .from(schema.inventory)
            .where(eq(schema.inventory.productId, item.productId))
            .get()

          if (!inventory) {
            throw new Error(`Inventory record not found for product ${item.productId}`)
          }

          if (inventory.quantity < item.quantity) {
            const product = tx
              .select()
              .from(schema.products)
              .where(eq(schema.products.id, item.productId))
              .get()
            throw new Error(
              `Insufficient stock for ${product?.name || 'product'}. Available: ${inventory.quantity}, Required: ${item.quantity}`
            )
          }

          tx.run(
            sql`UPDATE inventory SET quantity = quantity - ${item.quantity} 
                WHERE product_id = ${item.productId}`
          )
        }

        // Update bank account balance if accountId is provided (add money from sale)
        if (sale.accountId && sale.paidAmount > 0) {
          const account = tx
            .select()
            .from(schema.bankAccounts)
            .where(eq(schema.bankAccounts.id, sale.accountId))
            .get()

          if (!account) {
            throw new Error(`Bank account not found: ${sale.accountId}`)
          }

          const currentBalance = account.currentBalance ?? 0
          const totalDeposits = account.totalDeposits ?? 0

          tx.update(schema.bankAccounts)
            .set({
              currentBalance: currentBalance + sale.paidAmount,
              totalDeposits: totalDeposits + sale.paidAmount,
              updatedAt: new Date().toISOString()
            })
            .where(eq(schema.bankAccounts.id, sale.accountId))
            .run()
        }

        // Update customer loyalty points and total purchases if customer is linked
        if (sale.customerId) {
          const customer = tx
            .select()
            .from(schema.customers)
            .where(eq(schema.customers.id, sale.customerId))
            .get()

          if (customer) {
            const currentLoyaltyPoints = customer.loyaltyPoints ?? 0
            const currentTotalPurchases = customer.totalPurchases ?? 0
            const pointsRedeemed = sale.pointsRedeemed ?? 0

            // Calculate the amount on which new points should be earned
            // This should be the final amount paid (totalAmount) which already has points discount applied
            // So we earn points on what customer actually paid
            const newPointsEarned = Math.floor(sale.totalAmount / 10)

            // Calculate final points: (current - redeemed) + earned
            // First deduct redeemed points, then add newly earned points
            const finalPoints = Math.max(0, currentLoyaltyPoints - pointsRedeemed + newPointsEarned)

            tx.update(schema.customers)
              .set({
                loyaltyPoints: finalPoints,
                totalPurchases: currentTotalPurchases + sale.totalAmount,
                updatedAt: new Date().toISOString()
              })
              .where(eq(schema.customers.id, sale.customerId))
              .run()
          }
        }

        // Create audit log
        createAuditLog(tx, {
          userId: sale.userId,
          action: 'create',
          entityType: 'sale',
          entityId: saleId,
          entityName: saleResult.invoiceNumber,
          changes: { totalAmount: sale.totalAmount, items: items.length }
        })

        return saleResult
      } catch (error) {
        // Transaction will automatically rollback on error
        console.error('[Sales] Transaction failed, rolling back:', error)
        throw error
      }
    })
  })

  // Get paginated sales
  ipcMain.handle(
    'db:sales:getPaginated',
    async (_, params: PaginationParams): Promise<PaginatedResponse<unknown>> => {
      const page = params.page || 1
      const limit = params.limit || 50
      const offset = (page - 1) * limit
      const { startDate, endDate, search } = params

      // Build where conditions
      const conditions: SQL<unknown>[] = []
      if (startDate && endDate) {
        conditions.push(
          and(gte(schema.sales.createdAt, startDate), lte(schema.sales.createdAt, endDate))!
        )
      }
      if (search) {
        conditions.push(
          sql`(${schema.sales.invoiceNumber} LIKE ${`%${search}%`} OR ${schema.customers.name} LIKE ${`%${search}%`})`
        )
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      // Get total count
      const countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(schema.sales)
        .leftJoin(schema.customers, eq(schema.sales.customerId, schema.customers.id))

      const countResult = whereClause ? countQuery.where(whereClause).get() : countQuery.get()
      const total = countResult?.count || 0

      // Get paginated data
      const dataQuery = db
        .select({
          id: schema.sales.id,
          invoiceNumber: schema.sales.invoiceNumber,
          customerId: schema.sales.customerId,
          customerName: schema.customers.name,
          accountId: schema.sales.accountId,
          userId: schema.sales.userId,
          subtotal: schema.sales.subtotal,
          taxAmount: schema.sales.taxAmount,
          discountAmount: schema.sales.discountAmount,
          totalAmount: schema.sales.totalAmount,
          paidAmount: schema.sales.paidAmount,
          changeAmount: schema.sales.changeAmount,
          paymentMethod: schema.sales.paymentMethod,
          status: schema.sales.status,
          notes: schema.sales.notes,
          createdAt: schema.sales.createdAt
        })
        .from(schema.sales)
        .leftJoin(schema.customers, eq(schema.sales.customerId, schema.customers.id))
        .orderBy(desc(schema.sales.createdAt))
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

  // Get all sales (with optional date range) - kept for backward compatibility
  ipcMain.handle('db:sales:getAll', async (_, { startDate, endDate }) => {
    if (startDate && endDate) {
      return db
        .select({
          id: schema.sales.id,
          invoiceNumber: schema.sales.invoiceNumber,
          customerId: schema.sales.customerId,
          customerName: schema.customers.name,
          accountId: schema.sales.accountId,
          userId: schema.sales.userId,
          subtotal: schema.sales.subtotal,
          taxAmount: schema.sales.taxAmount,
          discountAmount: schema.sales.discountAmount,
          totalAmount: schema.sales.totalAmount,
          paidAmount: schema.sales.paidAmount,
          changeAmount: schema.sales.changeAmount,
          paymentMethod: schema.sales.paymentMethod,
          status: schema.sales.status,
          notes: schema.sales.notes,
          createdAt: schema.sales.createdAt
        })
        .from(schema.sales)
        .leftJoin(schema.customers, eq(schema.sales.customerId, schema.customers.id))
        .where(and(gte(schema.sales.createdAt, startDate), lte(schema.sales.createdAt, endDate)))
        .orderBy(desc(schema.sales.createdAt))
        .all()
    }

    return db
      .select({
        id: schema.sales.id,
        invoiceNumber: schema.sales.invoiceNumber,
        customerId: schema.sales.customerId,
        customerName: schema.customers.name,
        accountId: schema.sales.accountId,
        userId: schema.sales.userId,
        subtotal: schema.sales.subtotal,
        taxAmount: schema.sales.taxAmount,
        discountAmount: schema.sales.discountAmount,
        totalAmount: schema.sales.totalAmount,
        paidAmount: schema.sales.paidAmount,
        changeAmount: schema.sales.changeAmount,
        paymentMethod: schema.sales.paymentMethod,
        status: schema.sales.status,
        notes: schema.sales.notes,
        createdAt: schema.sales.createdAt
      })
      .from(schema.sales)
      .leftJoin(schema.customers, eq(schema.sales.customerId, schema.customers.id))
      .orderBy(desc(schema.sales.createdAt))
      .all()
  })

  // Get sale by ID with items
  ipcMain.handle('db:sales:getById', async (_, id: string) => {
    const sale = db
      .select({
        id: schema.sales.id,
        invoiceNumber: schema.sales.invoiceNumber,
        customerId: schema.sales.customerId,
        customerName: schema.customers.name,
        accountId: schema.sales.accountId,
        userId: schema.sales.userId,
        subtotal: schema.sales.subtotal,
        taxAmount: schema.sales.taxAmount,
        discountAmount: schema.sales.discountAmount,
        totalAmount: schema.sales.totalAmount,
        paidAmount: schema.sales.paidAmount,
        changeAmount: schema.sales.changeAmount,
        paymentMethod: schema.sales.paymentMethod,
        status: schema.sales.status,
        notes: schema.sales.notes,
        createdAt: schema.sales.createdAt
      })
      .from(schema.sales)
      .leftJoin(schema.customers, eq(schema.sales.customerId, schema.customers.id))
      .where(eq(schema.sales.id, id))
      .get()

    if (sale) {
      const items = db.select().from(schema.saleItems).where(eq(schema.saleItems.saleId, id)).all()
      return { ...sale, items }
    }
    return null
  })

  // Get sales by customer
  ipcMain.handle('db:sales:getByCustomer', async (_, customerId: string) => {
    try {
      return db
        .select({
          id: schema.sales.id,
          invoiceNumber: schema.sales.invoiceNumber,
          totalAmount: schema.sales.totalAmount,
          paymentMethod: schema.sales.paymentMethod,
          status: schema.sales.status,
          createdAt: schema.sales.createdAt
        })
        .from(schema.sales)
        .where(eq(schema.sales.customerId, customerId))
        .orderBy(desc(schema.sales.createdAt))
        .limit(20) // Limit to recent 20 sales
        .all()
    } catch (error) {
      console.error('Error fetching sales by customer:', error)
      throw error
    }
  })

  // ==================== SALES RETURNS ====================

  // Create sales return
  ipcMain.handle('db:salesReturns:create', async (_, { salesReturn, items }) => {
    const returnId = uuidv4()
    const returnResult = db
      .insert(schema.salesReturns)
      .values({ id: returnId, ...salesReturn })
      .returning()
      .get()

    // Insert sales return items
    const returnItemsData = items.map((item) => ({
      id: uuidv4(),
      returnId,
      ...item
    }))

    if (returnItemsData.length > 0) {
      db.insert(schema.salesReturnItems).values(returnItemsData).run()
    }

    // Update inventory - add returned quantities back
    for (const item of items) {
      const existing = db
        .select()
        .from(schema.inventory)
        .where(eq(schema.inventory.productId, item.productId))
        .get()

      if (existing) {
        db.update(schema.inventory)
          .set({
            quantity: existing.quantity + item.quantity,
            updatedAt: new Date().toISOString()
          })
          .where(eq(schema.inventory.id, existing.id))
          .run()
      }
    }

    // Update bank account balance if accountId is provided (deduct refund amount)
    if (salesReturn.accountId && salesReturn.refundAmount > 0) {
      const account = db
        .select()
        .from(schema.bankAccounts)
        .where(eq(schema.bankAccounts.id, salesReturn.accountId))
        .get()

      if (account) {
        const currentBalance = account.currentBalance ?? 0
        const totalWithdrawals = account.totalWithdrawals ?? 0

        db.update(schema.bankAccounts)
          .set({
            currentBalance: currentBalance - salesReturn.refundAmount,
            totalWithdrawals: totalWithdrawals + salesReturn.refundAmount,
            updatedAt: new Date().toISOString()
          })
          .where(eq(schema.bankAccounts.id, salesReturn.accountId))
          .run()
      }
    }

    // Update customer loyalty points and total purchases (deduct returned amount)
    if (salesReturn.customerId) {
      const customer = db
        .select()
        .from(schema.customers)
        .where(eq(schema.customers.id, salesReturn.customerId))
        .get()

      if (customer) {
        const currentLoyaltyPoints = customer.loyaltyPoints ?? 0
        const currentTotalPurchases = customer.totalPurchases ?? 0
        // Deduct loyalty points based on return amount (1 point per $10)
        const pointsToDeduct = Math.floor(salesReturn.totalAmount / 10)

        db.update(schema.customers)
          .set({
            loyaltyPoints: Math.max(0, currentLoyaltyPoints - pointsToDeduct),
            totalPurchases: Math.max(0, currentTotalPurchases - salesReturn.totalAmount),
            updatedAt: new Date().toISOString()
          })
          .where(eq(schema.customers.id, salesReturn.customerId))
          .run()
      }
    }

    // Update the original sale status and amounts
    const originalSale = db
      .select()
      .from(schema.sales)
      .where(eq(schema.sales.id, salesReturn.saleId))
      .get()

    if (originalSale) {
      // Get all sale items
      const originalSaleItems = db
        .select()
        .from(schema.saleItems)
        .where(eq(schema.saleItems.saleId, salesReturn.saleId))
        .all()

      // Get all returns for this sale (including the current one)
      const allReturns = db
        .select()
        .from(schema.salesReturnItems)
        .innerJoin(
          schema.salesReturns,
          eq(schema.salesReturnItems.returnId, schema.salesReturns.id)
        )
        .where(eq(schema.salesReturns.saleId, salesReturn.saleId))
        .all()

      // Calculate total returned quantities per product
      const returnedQuantities = new Map<string, number>()
      for (const returnRecord of allReturns) {
        const productId = returnRecord.sales_return_items.productId
        const qty = returnRecord.sales_return_items.quantity
        returnedQuantities.set(productId, (returnedQuantities.get(productId) || 0) + qty)
      }

      // Check if all items are fully returned
      let isFullyReturned = true
      let hasPartialReturn = false
      for (const saleItem of originalSaleItems) {
        const returnedQty = returnedQuantities.get(saleItem.productId) || 0
        if (returnedQty > 0 && returnedQty < saleItem.quantity) {
          hasPartialReturn = true
          isFullyReturned = false
          break
        } else if (returnedQty < saleItem.quantity) {
          isFullyReturned = false
        }
      }

      // Determine the new status (keep original totalAmount intact for history)
      let newStatus = 'completed'
      if (isFullyReturned) {
        newStatus = 'refunded'
      } else if (hasPartialReturn || salesReturn.totalAmount > 0) {
        newStatus = 'partially_returned'
      }

      // Update sale status only (preserve original totalAmount for accurate reporting)
      db.update(schema.sales)
        .set({
          status: newStatus
        })
        .where(eq(schema.sales.id, salesReturn.saleId))
        .run()
    }

    // Create audit log
    createAuditLog(db, {
      userId: salesReturn.userId,
      action: 'create',
      entityType: 'sales_return',
      entityId: returnResult.id,
      entityName: returnResult.returnNumber,
      changes: { refundAmount: salesReturn.refundAmount, items: items.length }
    })

    return returnResult
  })

  // Get paginated sales returns
  ipcMain.handle(
    'db:salesReturns:getPaginated',
    async (
      _,
      {
        page = 1,
        limit = 50,
        search,
        startDate,
        endDate
      }: {
        page?: number
        limit?: number
        search?: string
        startDate?: string
        endDate?: string
      } = {}
    ) => {
      try {
        // Build conditions
        const conditions: SQL<unknown>[] = []

        if (startDate) {
          conditions.push(gte(schema.salesReturns.createdAt, startDate))
        }

        if (endDate) {
          conditions.push(lte(schema.salesReturns.createdAt, endDate))
        }

        if (search) {
          conditions.push(
            or(
              like(schema.salesReturns.returnNumber, `%${search}%`),
              like(schema.customers.name, `%${search}%`),
              like(schema.sales.invoiceNumber, `%${search}%`)
            )!
          )
        }

        // Get total count
        const countQuery = db
          .select({ count: sql<number>`count(*)` })
          .from(schema.salesReturns)
          .leftJoin(schema.customers, eq(schema.salesReturns.customerId, schema.customers.id))
          .leftJoin(schema.sales, eq(schema.salesReturns.saleId, schema.sales.id))

        const totalResult =
          conditions.length > 0 ? countQuery.where(and(...conditions)!).get() : countQuery.get()

        const total = totalResult?.count || 0

        // Get paginated data
        const offset = (page - 1) * limit
        const dataQuery = db
          .select({
            salesReturn: schema.salesReturns,
            customer: {
              id: schema.customers.id,
              name: schema.customers.name
            },
            sale: {
              id: schema.sales.id,
              invoiceNumber: schema.sales.invoiceNumber
            },
            user: {
              id: schema.users.id,
              username: schema.users.username
            },
            account: {
              id: schema.bankAccounts.id,
              name: schema.bankAccounts.name
            }
          })
          .from(schema.salesReturns)
          .leftJoin(schema.customers, eq(schema.salesReturns.customerId, schema.customers.id))
          .leftJoin(schema.sales, eq(schema.salesReturns.saleId, schema.sales.id))
          .leftJoin(schema.users, eq(schema.salesReturns.userId, schema.users.id))
          .leftJoin(schema.bankAccounts, eq(schema.salesReturns.accountId, schema.bankAccounts.id))
          .orderBy(desc(schema.salesReturns.createdAt))
          .limit(limit)
          .offset(offset)

        const data =
          conditions.length > 0 ? dataQuery.where(and(...conditions)!).all() : dataQuery.all()

        return {
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      } catch (error) {
        console.error('Error fetching paginated sales returns:', error)
        throw error
      }
    }
  )

  // Get all sales returns (with optional date range)
  ipcMain.handle('db:salesReturns:getAll', async (_, { startDate, endDate }) => {
    let salesReturns
    if (startDate && endDate) {
      salesReturns = db
        .select()
        .from(schema.salesReturns)
        .where(
          and(
            gte(schema.salesReturns.createdAt, startDate),
            lte(schema.salesReturns.createdAt, endDate)
          )
        )
        .orderBy(desc(schema.salesReturns.createdAt))
        .all()
    } else {
      salesReturns = db
        .select()
        .from(schema.salesReturns)
        .orderBy(desc(schema.salesReturns.createdAt))
        .all()
    }

    // Enrich with related names
    return salesReturns.map((salesReturn) => {
      // Get user name
      let userName = ''
      if (salesReturn.userId) {
        const user = db
          .select({ username: schema.users.username })
          .from(schema.users)
          .where(eq(schema.users.id, salesReturn.userId))
          .get()
        userName = user?.username || ''
      }

      // Get customer name
      let customerName: string | null = null
      if (salesReturn.customerId) {
        const customer = db
          .select({ name: schema.customers.name })
          .from(schema.customers)
          .where(eq(schema.customers.id, salesReturn.customerId))
          .get()
        customerName = customer?.name || null
      }

      // Get account name
      let accountName: string | null = null
      if (salesReturn.accountId) {
        const account = db
          .select({ name: schema.bankAccounts.name })
          .from(schema.bankAccounts)
          .where(eq(schema.bankAccounts.id, salesReturn.accountId))
          .get()
        accountName = account?.name || null
      }

      return { ...salesReturn, userName, customerName, accountName }
    })
  })

  // Get sales return by ID with items
  ipcMain.handle('db:salesReturns:getById', async (_, id: string) => {
    const salesReturn = db
      .select()
      .from(schema.salesReturns)
      .where(eq(schema.salesReturns.id, id))
      .get()

    if (salesReturn) {
      const items = db
        .select()
        .from(schema.salesReturnItems)
        .where(eq(schema.salesReturnItems.returnId, id))
        .all()

      // Get user name
      let userName = ''
      if (salesReturn.userId) {
        const user = db
          .select({ username: schema.users.username })
          .from(schema.users)
          .where(eq(schema.users.id, salesReturn.userId))
          .get()
        userName = user?.username || ''
      }

      // Get customer name
      let customerName: string | null = null
      if (salesReturn.customerId) {
        const customer = db
          .select({ name: schema.customers.name })
          .from(schema.customers)
          .where(eq(schema.customers.id, salesReturn.customerId))
          .get()
        customerName = customer?.name || null
      }

      // Get account name
      let accountName: string | null = null
      if (salesReturn.accountId) {
        const account = db
          .select({ name: schema.bankAccounts.name })
          .from(schema.bankAccounts)
          .where(eq(schema.bankAccounts.id, salesReturn.accountId))
          .get()
        accountName = account?.name || null
      }

      return { ...salesReturn, items, userName, customerName, accountName }
    }
    return null
  })
}
