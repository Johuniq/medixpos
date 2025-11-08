/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { and, desc, eq, gte, lte, sql } from 'drizzle-orm'
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

export function registerSupplierHandlers(): void {
  const db = getDatabase()

  // ==================== SUPPLIERS ====================

  // Get paginated suppliers
  ipcMain.handle(
    'db:suppliers:getPaginated',
    async (_, params: PaginationParams): Promise<PaginatedResponse<unknown>> => {
      const page = params.page || 1
      const limit = params.limit || 50
      const offset = (page - 1) * limit
      const search = params.search?.trim()

      // Build where clause
      const whereClause = search
        ? and(
            eq(schema.suppliers.isActive, true),
            sql`(${schema.suppliers.name} LIKE ${`%${search}%`} OR ${schema.suppliers.code} LIKE ${`%${search}%`})`
          )
        : eq(schema.suppliers.isActive, true)

      // Get total count
      const countResult = db
        .select({ count: sql<number>`count(*)` })
        .from(schema.suppliers)
        .where(whereClause)
        .get()

      const total = countResult?.count || 0

      // Get paginated data
      const data = db
        .select()
        .from(schema.suppliers)
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

  // Get all active suppliers - kept for backward compatibility
  ipcMain.handle('db:suppliers:getAll', async () => {
    return db.select().from(schema.suppliers).where(eq(schema.suppliers.isActive, true)).all()
  })

  // Create new supplier
  ipcMain.handle('db:suppliers:create', async (_, data) => {
    const id = uuidv4()

    // currentBalance should start at 0, not equal to openingBalance
    // openingBalance is a separate field that stays constant
    const supplierData = {
      ...data,
      currentBalance: 0
    }

    const supplier = db
      .insert(schema.suppliers)
      .values({ id, ...supplierData })
      .returning()
      .get()

    // Create opening balance ledger entry if opening balance exists
    if (supplier.openingBalance && supplier.openingBalance !== 0) {
      const ledgerId = uuidv4()
      db.insert(schema.supplierLedgerEntries)
        .values({
          id: ledgerId,
          supplierId: supplier.id,
          type: 'opening_balance',
          referenceNumber: 'OPENING',
          description: 'Opening Balance',
          debit: supplier.openingBalance > 0 ? supplier.openingBalance : 0,
          credit: supplier.openingBalance < 0 ? Math.abs(supplier.openingBalance) : 0,
          balance: supplier.openingBalance,
          transactionDate:
            supplier.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          createdBy: data.userId || null
        })
        .run()
    }

    // Create audit log
    createAuditLog(db, {
      userId: data.createdBy,
      action: 'create',
      entityType: 'supplier',
      entityId: supplier.id,
      entityName: supplier.name
    })

    return supplier
  })

  // Update supplier
  ipcMain.handle('db:suppliers:update', async (_, { id, data }) => {
    // Get old data for audit log
    const oldSupplier = db.select().from(schema.suppliers).where(eq(schema.suppliers.id, id)).get()

    if (!oldSupplier) {
      throw new Error('Supplier not found')
    }

    // Optimistic locking: Check version
    const currentVersion = data.version || oldSupplier.version
    if (currentVersion !== oldSupplier.version) {
      throw new Error(
        'CONCURRENT_EDIT: This supplier was modified by another user. Please refresh and try again.'
      )
    }

    const supplier = db
      .update(schema.suppliers)
      .set({ ...data, version: oldSupplier.version + 1, updatedAt: new Date().toISOString() })
      .where(eq(schema.suppliers.id, id))
      .returning()
      .get()

    // Track changes
    const changes: Record<string, { old: unknown; new: unknown }> = {}
    if (oldSupplier) {
      Object.keys(data).forEach((key) => {
        if (key !== 'version' && oldSupplier[key] !== data[key]) {
          changes[key] = { old: oldSupplier[key], new: data[key] }
        }
      })
    }

    // Create audit log
    if (Object.keys(changes).length > 0) {
      createAuditLog(db, {
        userId: data.updatedBy,
        action: 'update',
        entityType: 'supplier',
        entityId: supplier.id,
        entityName: supplier.name,
        changes
      })
    }

    return supplier
  })

  // Delete supplier (soft delete)
  ipcMain.handle('db:suppliers:delete', async (_, id: string) => {
    // Get supplier data for audit log
    const supplier = db.select().from(schema.suppliers).where(eq(schema.suppliers.id, id)).get()

    db.update(schema.suppliers).set({ isActive: false }).where(eq(schema.suppliers.id, id)).run()

    // Create audit log
    if (supplier) {
      createAuditLog(db, {
        userId: undefined,
        action: 'delete',
        entityType: 'supplier',
        entityId: supplier.id,
        entityName: supplier.name
      })
    }

    return { success: true }
  })

  // ==================== SUPPLIER PAYMENTS ====================

  // Create supplier payment
  ipcMain.handle('db:supplierPayments:create', async (_, data) => {
    // Validate that accountId is provided
    if (!data.accountId) {
      throw new Error('Payment account is required')
    }

    const id = uuidv4()
    const payment = db
      .insert(schema.supplierPayments)
      .values({ id, ...data })
      .returning()
      .get()

    // Update supplier balance
    const supplier = db
      .select()
      .from(schema.suppliers)
      .where(eq(schema.suppliers.id, data.supplierId))
      .get()

    if (!supplier) {
      throw new Error('Supplier not found')
    }

    const previousBalance = supplier.currentBalance ?? 0
    const totalPayments = supplier.totalPayments ?? 0
    const newBalance = previousBalance - data.amount

    db.update(schema.suppliers)
      .set({
        currentBalance: newBalance,
        totalPayments: totalPayments + data.amount,
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.suppliers.id, data.supplierId))
      .run()

    // Update bank account (now required)
    const account = db
      .select()
      .from(schema.bankAccounts)
      .where(eq(schema.bankAccounts.id, data.accountId))
      .get()

    if (!account) {
      throw new Error('Payment account not found')
    }

    const accountBalance = account.currentBalance ?? 0
    if (accountBalance < data.amount) {
      throw new Error(
        `Insufficient balance in ${account.name}. Available: ${accountBalance.toFixed(2)}`
      )
    }

    const totalWithdrawals = account.totalWithdrawals ?? 0

    db.update(schema.bankAccounts)
      .set({
        currentBalance: accountBalance - data.amount,
        totalWithdrawals: totalWithdrawals + data.amount,
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.bankAccounts.id, data.accountId))
      .run()

    // Create ledger entry
    // For supplier ledger: Payment reduces what we owe (credit entry reduces payable balance)
    const ledgerId = uuidv4()

    // Calculate total balance including opening balance
    const openingBalance = supplier.openingBalance ?? 0
    const totalBalance = openingBalance + newBalance

    db.insert(schema.supplierLedgerEntries)
      .values({
        id: ledgerId,
        supplierId: data.supplierId,
        type: 'payment',
        referenceId: id,
        referenceNumber: data.referenceNumber,
        description: `Payment: ${data.notes || 'Supplier payment'}`,
        debit: 0,
        credit: data.amount,
        balance: totalBalance,
        transactionDate: data.paymentDate,
        createdBy: data.userId
      })
      .run()

    // Create audit log
    createAuditLog(db, {
      userId: data.userId,
      action: 'create',
      entityType: 'supplier_payment',
      entityId: payment.id,
      entityName: `Payment to ${supplier.name}`,
      changes: { amount: data.amount, supplierId: data.supplierId }
    })

    return payment
  })

  // Get supplier payments by supplier ID
  ipcMain.handle(
    'db:supplierPayments:getBySupplierId',
    async (_, { supplierId, startDate, endDate }) => {
      if (startDate && endDate) {
        return db
          .select()
          .from(schema.supplierPayments)
          .where(
            and(
              eq(schema.supplierPayments.supplierId, supplierId),
              gte(schema.supplierPayments.paymentDate, startDate),
              lte(schema.supplierPayments.paymentDate, endDate)
            )
          )
          .orderBy(desc(schema.supplierPayments.paymentDate))
          .all()
      }

      return db
        .select()
        .from(schema.supplierPayments)
        .where(eq(schema.supplierPayments.supplierId, supplierId))
        .orderBy(desc(schema.supplierPayments.paymentDate))
        .all()
    }
  )

  // ==================== SUPPLIER LEDGER ====================

  // Get supplier ledger entries
  ipcMain.handle('db:supplierLedger:getEntries', async (_, { supplierId, startDate, endDate }) => {
    if (startDate && endDate) {
      return db
        .select()
        .from(schema.supplierLedgerEntries)
        .where(
          and(
            eq(schema.supplierLedgerEntries.supplierId, supplierId),
            gte(schema.supplierLedgerEntries.transactionDate, startDate),
            lte(schema.supplierLedgerEntries.transactionDate, endDate)
          )
        )
        .orderBy(schema.supplierLedgerEntries.transactionDate)
        .all()
    }

    return db
      .select()
      .from(schema.supplierLedgerEntries)
      .where(eq(schema.supplierLedgerEntries.supplierId, supplierId))
      .orderBy(schema.supplierLedgerEntries.transactionDate)
      .all()
  })

  // Create supplier ledger entry
  ipcMain.handle('db:supplierLedger:createEntry', async (_, data) => {
    const id = uuidv4()
    const entry = db
      .insert(schema.supplierLedgerEntries)
      .values({ id, ...data })
      .returning()
      .get()

    // Create audit log
    createAuditLog(db, {
      userId: data.createdBy,
      action: 'create',
      entityType: 'supplier_ledger_entry',
      entityId: entry.id,
      entityName: `${entry.type}: ${entry.referenceNumber}`,
      changes: { debit: entry.debit, credit: entry.credit }
    })

    return entry
  })
}
