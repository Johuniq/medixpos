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

export function registerReportsSettingsHandlers(): void {
  const db = getDatabase()

  // ==================== EXPENSES ====================

  // Create expense
  ipcMain.handle('db:expenses:create', async (_, data) => {
    const id = uuidv4()
    const expense = db
      .insert(schema.expenses)
      .values({ id, ...data })
      .returning()
      .get()

    // Create audit log
    createAuditLog(db, {
      userId: data.createdBy,
      action: 'create',
      entityType: 'expense',
      entityId: expense.id,
      entityName: expense.category || 'Expense',
      changes: { amount: expense.amount }
    })

    return expense
  })

  // Get paginated expenses
  ipcMain.handle(
    'db:expenses:getPaginated',
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
          conditions.push(gte(schema.expenses.expenseDate, startDate))
        }

        if (endDate) {
          conditions.push(lte(schema.expenses.expenseDate, endDate))
        }

        if (search) {
          conditions.push(
            or(
              like(schema.expenses.category, `%${search}%`),
              like(schema.expenses.description, `%${search}%`)
            )!
          )
        }

        // Get total count
        const countQuery = db.select({ count: sql<number>`count(*)` }).from(schema.expenses)

        const totalResult =
          conditions.length > 0 ? countQuery.where(and(...conditions)!).get() : countQuery.get()

        const total = totalResult?.count || 0

        // Get paginated data
        const offset = (page - 1) * limit
        const dataQuery = db
          .select()
          .from(schema.expenses)
          .orderBy(desc(schema.expenses.expenseDate))
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
        console.error('Error fetching paginated expenses:', error)
        throw error
      }
    }
  )

  // Get all expenses (with optional date range)
  ipcMain.handle('db:expenses:getAll', async (_, { startDate, endDate }) => {
    if (startDate && endDate) {
      return db
        .select()
        .from(schema.expenses)
        .where(
          and(
            gte(schema.expenses.expenseDate, startDate),
            lte(schema.expenses.expenseDate, endDate)
          )
        )
        .orderBy(desc(schema.expenses.expenseDate))
        .all()
    }

    return db.select().from(schema.expenses).orderBy(desc(schema.expenses.expenseDate)).all()
  })

  // ==================== SETTINGS ====================

  // Get all settings
  ipcMain.handle('db:settings:getAll', async () => {
    return db.select().from(schema.settings).all()
  })

  // Get setting by key
  ipcMain.handle('db:settings:get', async (_, key: string) => {
    return db.select().from(schema.settings).where(eq(schema.settings.key, key)).get()
  })

  // Update or create setting
  ipcMain.handle('db:settings:update', async (_, { key, value, userId, username }) => {
    const existing = db.select().from(schema.settings).where(eq(schema.settings.key, key)).get()

    let result

    if (existing) {
      result = db
        .update(schema.settings)
        .set({ value, updatedAt: new Date().toISOString() })
        .where(eq(schema.settings.key, key))
        .returning()
        .get()

      // Create audit log for settings update
      createAuditLog(db, {
        userId: userId,
        username: username,
        action: 'update',
        entityType: 'settings',
        entityId: existing.id,
        entityName: key,
        changes: { old: existing.value, new: value }
      })
    } else {
      const id = uuidv4()
      result = db.insert(schema.settings).values({ id, key, value }).returning().get()

      // Create audit log for settings creation
      createAuditLog(db, {
        userId: userId,
        username: username,
        action: 'create',
        entityType: 'settings',
        entityId: id,
        entityName: key,
        changes: { value }
      })
    }

    return result
  })

  // ==================== REPORTS ====================

  // Get sales summary report
  ipcMain.handle('db:reports:salesSummary', async (_, { startDate, endDate }) => {
    const salesData = db
      .select({
        totalSales: sql<number>`COUNT(*)`,
        totalRevenue: sql<number>`SUM(${schema.sales.totalAmount})`,
        totalProfit: sql<number>`SUM(${schema.sales.totalAmount} - ${schema.sales.discountAmount})`
      })
      .from(schema.sales)
      .where(
        and(
          gte(schema.sales.createdAt, startDate),
          lte(schema.sales.createdAt, endDate),
          eq(schema.sales.status, 'completed')
        )
      )
      .get()

    return salesData
  })

  // Get top products report
  ipcMain.handle('db:reports:topProducts', async (_, { startDate, endDate, limit }) => {
    return db
      .select({
        productId: schema.saleItems.productId,
        productName: schema.saleItems.productName,
        totalQuantity: sql<number>`SUM(${schema.saleItems.quantity})`,
        totalRevenue: sql<number>`SUM(${schema.saleItems.subtotal})`
      })
      .from(schema.saleItems)
      .innerJoin(schema.sales, eq(schema.saleItems.saleId, schema.sales.id))
      .where(and(gte(schema.sales.createdAt, startDate), lte(schema.sales.createdAt, endDate)))
      .groupBy(schema.saleItems.productId, schema.saleItems.productName)
      .orderBy(desc(sql`SUM(${schema.saleItems.quantity})`))
      .limit(limit || 10)
      .all()
  })

  // Get profit margin by product
  ipcMain.handle('db:reports:profitMargin', async (_, { startDate, endDate }) => {
    return db
      .select({
        productId: schema.saleItems.productId,
        productName: schema.saleItems.productName,
        totalRevenue: sql<number>`SUM(${schema.saleItems.subtotal})`,
        totalQuantity: sql<number>`SUM(${schema.saleItems.quantity})`,
        avgSellingPrice: sql<number>`AVG(${schema.saleItems.unitPrice})`,
        avgCostPrice: sql<number>`AVG(${schema.products.costPrice})`,
        profitMargin: sql<number>`ROUND((AVG(${schema.saleItems.unitPrice}) - AVG(${schema.products.costPrice})) / AVG(${schema.saleItems.unitPrice}) * 100, 2)`
      })
      .from(schema.saleItems)
      .innerJoin(schema.products, eq(schema.saleItems.productId, schema.products.id))
      .innerJoin(schema.sales, eq(schema.saleItems.saleId, schema.sales.id))
      .where(and(gte(schema.sales.createdAt, startDate), lte(schema.sales.createdAt, endDate)))
      .groupBy(schema.saleItems.productId, schema.saleItems.productName)
      .orderBy(desc(sql`SUM(${schema.saleItems.subtotal})`))
      .all()
  })

  // Get vendor/supplier performance
  ipcMain.handle('db:reports:vendorPerformance', async (_, { startDate, endDate }) => {
    return db
      .select({
        supplierId: schema.purchases.supplierId,
        supplierName: schema.suppliers.name,
        totalPurchases: sql<number>`COUNT(*)`,
        totalAmount: sql<number>`SUM(${schema.purchases.totalAmount})`,
        totalPaid: sql<number>`SUM(${schema.purchases.paidAmount})`,
        totalDue: sql<number>`SUM(${schema.purchases.dueAmount})`,
        avgDeliveryTime: sql<number>`AVG(julianday(${schema.purchases.createdAt}) - julianday(${schema.purchases.createdAt}))`
      })
      .from(schema.purchases)
      .innerJoin(schema.suppliers, eq(schema.purchases.supplierId, schema.suppliers.id))
      .where(
        and(gte(schema.purchases.createdAt, startDate), lte(schema.purchases.createdAt, endDate))
      )
      .groupBy(schema.purchases.supplierId, schema.suppliers.name)
      .orderBy(desc(sql`SUM(${schema.purchases.totalAmount})`))
      .all()
  })

  // Get employee performance (sales by user)
  ipcMain.handle('db:reports:employeePerformance', async (_, { startDate, endDate }) => {
    return db
      .select({
        userId: schema.sales.userId,
        userName: schema.users.fullName,
        totalSales: sql<number>`COUNT(*)`,
        totalRevenue: sql<number>`SUM(${schema.sales.totalAmount})`,
        avgSaleValue: sql<number>`AVG(${schema.sales.totalAmount})`,
        totalDiscounts: sql<number>`SUM(${schema.sales.discountAmount})`
      })
      .from(schema.sales)
      .innerJoin(schema.users, eq(schema.sales.userId, schema.users.id))
      .where(
        and(
          gte(schema.sales.createdAt, startDate),
          lte(schema.sales.createdAt, endDate),
          eq(schema.sales.status, 'completed')
        )
      )
      .groupBy(schema.sales.userId, schema.users.fullName)
      .orderBy(desc(sql`SUM(${schema.sales.totalAmount})`))
      .all()
  })

  // Get slow-moving stock (ABC Analysis)
  ipcMain.handle('db:reports:slowMovingStock', async (_, { startDate, endDate }) => {
    const allProducts = db
      .select()
      .from(schema.products)
      .where(eq(schema.products.isActive, true))
      .all()

    const productSales = db
      .select({
        productId: schema.saleItems.productId,
        totalQuantity: sql<number>`SUM(${schema.saleItems.quantity})`
      })
      .from(schema.saleItems)
      .innerJoin(schema.sales, eq(schema.saleItems.saleId, schema.sales.id))
      .where(and(gte(schema.sales.createdAt, startDate), lte(schema.sales.createdAt, endDate)))
      .groupBy(schema.saleItems.productId)
      .all()

    const salesMap = new Map(productSales.map((p) => [p.productId, p.totalQuantity]))

    return allProducts
      .map((product) => {
        const inventory = db
          .select()
          .from(schema.inventory)
          .where(eq(schema.inventory.productId, product.id))
          .get()

        const quantitySold = salesMap.get(product.id) || 0
        const currentStock = inventory?.quantity || 0

        return {
          productId: product.id,
          productName: product.name,
          currentStock,
          quantitySold,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          stockValue: currentStock * product.costPrice,
          turnoverRatio: currentStock > 0 ? (quantitySold / currentStock).toFixed(2) : 0
        }
      })
      .sort((a, b) => Number(a.turnoverRatio) - Number(b.turnoverRatio))
  })

  // Get payment method analysis
  ipcMain.handle('db:reports:paymentMethodAnalysis', async (_, { startDate, endDate }) => {
    return db
      .select({
        paymentMethod: schema.sales.paymentMethod,
        totalSales: sql<number>`COUNT(*)`,
        totalAmount: sql<number>`SUM(${schema.sales.totalAmount})`,
        avgTransaction: sql<number>`AVG(${schema.sales.totalAmount})`
      })
      .from(schema.sales)
      .where(
        and(
          gte(schema.sales.createdAt, startDate),
          lte(schema.sales.createdAt, endDate),
          eq(schema.sales.status, 'completed')
        )
      )
      .groupBy(schema.sales.paymentMethod)
      .orderBy(desc(sql`SUM(${schema.sales.totalAmount})`))
      .all()
  })

  // Get peak hours analysis
  ipcMain.handle('db:reports:peakHoursAnalysis', async (_, { startDate, endDate }) => {
    const sales = db
      .select()
      .from(schema.sales)
      .where(
        and(
          gte(schema.sales.createdAt, startDate),
          lte(schema.sales.createdAt, endDate),
          eq(schema.sales.status, 'completed')
        )
      )
      .all()

    const hourlyData = new Array(24).fill(0).map((_, hour) => ({
      hour,
      displayHour:
        hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
      salesCount: 0,
      revenue: 0
    }))

    sales.forEach((sale) => {
      const saleDate = new Date(sale.createdAt || '')
      const hour = saleDate.getHours()
      hourlyData[hour].salesCount++
      hourlyData[hour].revenue += sale.totalAmount
    })

    return hourlyData
  })

  // Get customer RFM analysis (Recency, Frequency, Monetary)
  ipcMain.handle('db:reports:customerRFMAnalysis', async () => {
    const customers = db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.isActive, true))
      .all()

    const now = new Date()

    return customers
      .map((customer) => {
        const sales = db
          .select()
          .from(schema.sales)
          .where(eq(schema.sales.customerId, customer.id))
          .orderBy(desc(schema.sales.createdAt))
          .all()

        if (sales.length === 0) {
          return null
        }

        const lastSaleDate = new Date(sales[0].createdAt || '')
        const recency = Math.floor((now.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24))
        const frequency = sales.length
        const monetary = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)

        return {
          customerId: customer.id,
          customerName: customer.name,
          recency,
          frequency,
          monetary,
          lastPurchaseDate: sales[0].createdAt,
          avgPurchaseValue: monetary / frequency
        }
      })
      .filter(Boolean)
      .sort((a, b) => (b?.monetary || 0) - (a?.monetary || 0))
  })

  // Get year-over-year comparison
  ipcMain.handle('db:reports:yearOverYear', async () => {
    const currentYear = new Date().getFullYear()
    const lastYear = currentYear - 1

    const currentYearStart = `${currentYear}-01-01`
    const currentYearEnd = `${currentYear}-12-31`
    const lastYearStart = `${lastYear}-01-01`
    const lastYearEnd = `${lastYear}-12-31`

    const currentYearData = db
      .select({
        totalSales: sql<number>`COUNT(*)`,
        totalRevenue: sql<number>`SUM(${schema.sales.totalAmount})`,
        avgSaleValue: sql<number>`AVG(${schema.sales.totalAmount})`
      })
      .from(schema.sales)
      .where(
        and(
          gte(schema.sales.createdAt, currentYearStart),
          lte(schema.sales.createdAt, currentYearEnd),
          eq(schema.sales.status, 'completed')
        )
      )
      .get()

    const lastYearData = db
      .select({
        totalSales: sql<number>`COUNT(*)`,
        totalRevenue: sql<number>`SUM(${schema.sales.totalAmount})`,
        avgSaleValue: sql<number>`AVG(${schema.sales.totalAmount})`
      })
      .from(schema.sales)
      .where(
        and(
          gte(schema.sales.createdAt, lastYearStart),
          lte(schema.sales.createdAt, lastYearEnd),
          eq(schema.sales.status, 'completed')
        )
      )
      .get()

    return {
      currentYear: {
        year: currentYear,
        totalSales: currentYearData?.totalSales || 0,
        totalRevenue: currentYearData?.totalRevenue || 0,
        avgSaleValue: currentYearData?.avgSaleValue || 0
      },
      lastYear: {
        year: lastYear,
        totalSales: lastYearData?.totalSales || 0,
        totalRevenue: lastYearData?.totalRevenue || 0,
        avgSaleValue: lastYearData?.avgSaleValue || 0
      },
      growth: {
        salesGrowth:
          lastYearData?.totalSales && currentYearData?.totalSales
            ? ((currentYearData.totalSales - lastYearData.totalSales) / lastYearData.totalSales) *
              100
            : 0,
        revenueGrowth:
          lastYearData?.totalRevenue && currentYearData?.totalRevenue
            ? ((currentYearData.totalRevenue - lastYearData.totalRevenue) /
                lastYearData.totalRevenue) *
              100
            : 0
      }
    }
  })
}
