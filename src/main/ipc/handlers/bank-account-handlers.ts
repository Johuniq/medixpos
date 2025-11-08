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

export function registerBankAccountHandlers(): void {
  const db = getDatabase()

  // Get paginated bank accounts
  ipcMain.handle(
    'db:bankAccounts:getPaginated',
    async (_, params: PaginationParams): Promise<PaginatedResponse<unknown>> => {
      const page = params.page || 1
      const limit = params.limit || 50
      const offset = (page - 1) * limit
      const search = params.search?.trim()

      // Build where clause
      const whereClause = search
        ? and(
            eq(schema.bankAccounts.isActive, true),
            sql`(${schema.bankAccounts.name} LIKE ${`%${search}%`} OR ${schema.bankAccounts.accountNumber} LIKE ${`%${search}%`})`
          )
        : eq(schema.bankAccounts.isActive, true)

      // Get total count
      const countResult = db
        .select({ count: sql<number>`count(*)` })
        .from(schema.bankAccounts)
        .where(whereClause)
        .get()

      const total = countResult?.count || 0

      // Get paginated data
      const data = db
        .select()
        .from(schema.bankAccounts)
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

  // Get all active bank accounts - kept for backward compatibility
  ipcMain.handle('db:bankAccounts:getAll', async () => {
    return db.select().from(schema.bankAccounts).where(eq(schema.bankAccounts.isActive, true)).all()
  })

  // Create new bank account
  ipcMain.handle('db:bankAccounts:create', async (_, data) => {
    const id = uuidv4()
    const currentBalance = data.openingBalance || 0
    const account = db
      .insert(schema.bankAccounts)
      .values({ id, ...data, currentBalance })
      .returning()
      .get()

    // Create audit log
    createAuditLog(db, {
      userId: data.createdBy,
      action: 'create',
      entityType: 'bank_account',
      entityId: account.id,
      entityName: account.name
    })

    return account
  })

  // Update bank account
  ipcMain.handle('db:bankAccounts:update', async (_, { id, data }) => {
    // Get old data for audit log
    const oldAccount = db
      .select()
      .from(schema.bankAccounts)
      .where(eq(schema.bankAccounts.id, id))
      .get()

    if (!oldAccount) {
      throw new Error('Bank account not found')
    }

    // Optimistic locking: Check version
    const currentVersion = data.version || oldAccount.version
    if (currentVersion !== oldAccount.version) {
      throw new Error(
        'CONCURRENT_EDIT: This bank account was modified by another user. Please refresh and try again.'
      )
    }

    const account = db
      .update(schema.bankAccounts)
      .set({ ...data, version: oldAccount.version + 1, updatedAt: new Date().toISOString() })
      .where(eq(schema.bankAccounts.id, id))
      .returning()
      .get()

    // Track changes
    const changes: Record<string, { old: unknown; new: unknown }> = {}
    if (oldAccount) {
      Object.keys(data).forEach((key) => {
        if (key !== 'version' && oldAccount[key] !== data[key]) {
          changes[key] = { old: oldAccount[key], new: data[key] }
        }
      })
    }

    // Create audit log
    if (Object.keys(changes).length > 0) {
      createAuditLog(db, {
        userId: data.updatedBy,
        action: 'update',
        entityType: 'bank_account',
        entityId: account.id,
        entityName: account.name,
        changes
      })
    }

    return account
  })

  // Delete bank account (soft delete)
  ipcMain.handle('db:bankAccounts:delete', async (_, id: string) => {
    // Get account data for audit log
    const account = db
      .select()
      .from(schema.bankAccounts)
      .where(eq(schema.bankAccounts.id, id))
      .get()

    db.update(schema.bankAccounts)
      .set({ isActive: false })
      .where(eq(schema.bankAccounts.id, id))
      .run()

    // Create audit log
    if (account) {
      createAuditLog(db, {
        userId: undefined, // Bank accounts don't have createdBy field
        action: 'delete',
        entityType: 'bank_account',
        entityId: account.id,
        entityName: account.name
      })
    }

    return { success: true }
  })

  // Update bank account balance
  ipcMain.handle(
    'db:bankAccounts:updateBalance',
    async (_, { id, amount, type, userId, username }) => {
      const account = db
        .select()
        .from(schema.bankAccounts)
        .where(eq(schema.bankAccounts.id, id))
        .get()

      if (!account) throw new Error('Account not found')

      const currentBalance = account.currentBalance ?? 0
      const totalWithdrawals = account.totalWithdrawals ?? 0
      const totalDeposits = account.totalDeposits ?? 0

      const newBalance = type === 'debit' ? currentBalance - amount : currentBalance + amount
      const newTotalWithdrawals = type === 'debit' ? totalWithdrawals + amount : totalWithdrawals
      const newTotalDeposits = type === 'credit' ? totalDeposits + amount : totalDeposits

      const result = db
        .update(schema.bankAccounts)
        .set({
          currentBalance: newBalance,
          totalWithdrawals: newTotalWithdrawals,
          totalDeposits: newTotalDeposits,
          updatedAt: new Date().toISOString()
        })
        .where(eq(schema.bankAccounts.id, id))
        .returning()
        .get()

      // Create audit log for balance adjustment
      createAuditLog(db, {
        userId: userId,
        username: username,
        action: 'update',
        entityType: 'bank_account_balance',
        entityId: account.id,
        entityName: account.name,
        changes: {
          type: type === 'debit' ? 'withdrawal' : 'deposit',
          amount,
          oldBalance: currentBalance,
          newBalance
        }
      })

      return result
    }
  )
}
