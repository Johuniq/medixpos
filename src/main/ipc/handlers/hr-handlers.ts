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

export function registerHRHandlers(): void {
  const db = getDatabase()

  // ==================== DAMAGED ITEMS ====================

  // Get paginated damaged items
  ipcMain.handle(
    'db:damagedItems:getPaginated',
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
          conditions.push(gte(schema.damagedItems.createdAt, startDate))
        }

        if (endDate) {
          conditions.push(lte(schema.damagedItems.createdAt, endDate))
        }

        if (search) {
          conditions.push(
            or(
              like(schema.damagedItems.productName, `%${search}%`),
              like(schema.damagedItems.batchNumber, `%${search}%`),
              like(schema.damagedItems.reason, `%${search}%`)
            )!
          )
        }

        // Get total count
        const countQuery = db.select({ count: sql<number>`count(*)` }).from(schema.damagedItems)

        const totalResult =
          conditions.length > 0 ? countQuery.where(and(...conditions)!).get() : countQuery.get()

        const total = totalResult?.count || 0

        // Get paginated data
        const offset = (page - 1) * limit
        const dataQuery = db
          .select({
            id: schema.damagedItems.id,
            productId: schema.damagedItems.productId,
            productName: schema.damagedItems.productName,
            quantity: schema.damagedItems.quantity,
            reason: schema.damagedItems.reason,
            batchNumber: schema.damagedItems.batchNumber,
            expiryDate: schema.damagedItems.expiryDate,
            notes: schema.damagedItems.notes,
            reportedBy: schema.users.fullName,
            createdAt: schema.damagedItems.createdAt
          })
          .from(schema.damagedItems)
          .leftJoin(schema.users, eq(schema.damagedItems.reportedBy, schema.users.id))
          .orderBy(desc(schema.damagedItems.createdAt))
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
        console.error('Error fetching paginated damaged items:', error)
        throw error
      }
    }
  )

  // Get all damaged items
  ipcMain.handle('db:damagedItems:getAll', async () => {
    try {
      const items = db
        .select({
          id: schema.damagedItems.id,
          productId: schema.damagedItems.productId,
          productName: schema.damagedItems.productName,
          quantity: schema.damagedItems.quantity,
          reason: schema.damagedItems.reason,
          batchNumber: schema.damagedItems.batchNumber,
          expiryDate: schema.damagedItems.expiryDate,
          notes: schema.damagedItems.notes,
          reportedBy: schema.users.fullName,
          createdAt: schema.damagedItems.createdAt
        })
        .from(schema.damagedItems)
        .leftJoin(schema.users, eq(schema.damagedItems.reportedBy, schema.users.id))
        .orderBy(desc(schema.damagedItems.createdAt))
        .all()

      return items
    } catch (error) {
      console.error('Failed to get damaged items:', error)
      return []
    }
  })

  // Create damaged item
  ipcMain.handle('db:damagedItems:create', async (_, data) => {
    try {
      const id = uuidv4()

      const damagedItem = {
        id,
        productId: data.productId,
        productName: data.productName,
        quantity: data.quantity,
        reason: data.reason,
        batchNumber: data.batchNumber || null,
        expiryDate: data.expiryDate || null,
        notes: data.notes || null,
        reportedBy: data.reportedBy
      }

      db.insert(schema.damagedItems).values(damagedItem).run()

      // Deduct from inventory
      const inventoryItem = db
        .select()
        .from(schema.inventory)
        .where(eq(schema.inventory.productId, data.productId))
        .get()

      if (inventoryItem) {
        db.update(schema.inventory)
          .set({
            quantity: inventoryItem.quantity - data.quantity,
            updatedAt: new Date().toISOString()
          })
          .where(eq(schema.inventory.id, inventoryItem.id))
          .run()
      }

      // Create audit log
      const auditLog = {
        id: uuidv4(),
        userId: data.reportedBy,
        username: 'system',
        action: 'create',
        entityType: 'damaged_item',
        entityId: id,
        entityName: data.productName,
        changes: JSON.stringify({ reason: data.reason, quantity: data.quantity }),
        createdAt: new Date().toISOString()
      }
      db.insert(schema.auditLogs).values(auditLog).run()

      return damagedItem
    } catch (error) {
      console.error('Failed to create damaged item:', error)
      throw error
    }
  })

  // ==================== ATTENDANCE ====================

  // Get all attendance records (with optional filters)
  ipcMain.handle(
    'db:attendance:getAll',
    async (_event, filters?: { userId?: string; startDate?: string; endDate?: string }) => {
      try {
        let query = db.select().from(schema.attendance).$dynamic()

        if (filters?.userId) {
          query = query.where(eq(schema.attendance.userId, filters.userId))
        }
        if (filters?.startDate) {
          query = query.where(gte(schema.attendance.date, filters.startDate))
        }
        if (filters?.endDate) {
          query = query.where(lte(schema.attendance.date, filters.endDate))
        }

        return query.orderBy(desc(schema.attendance.date)).all()
      } catch (error) {
        console.error('Failed to get attendance:', error)
        throw error
      }
    }
  )

  // Create attendance record
  ipcMain.handle('db:attendance:create', async (_event, data) => {
    try {
      const id = uuidv4()
      const attendance = {
        id,
        userId: data.userId,
        date: data.date,
        checkIn: data.checkIn || null,
        checkOut: data.checkOut || null,
        status: data.status,
        leaveType: data.leaveType || null,
        workHours: data.workHours || 0,
        overtime: data.overtime || 0,
        notes: data.notes || null,
        markedBy: data.markedBy || null
      }

      db.insert(schema.attendance).values(attendance).run()

      createAuditLog(db, {
        userId: data.markedBy,
        action: 'create',
        entityType: 'attendance',
        entityId: id,
        changes: attendance
      })

      return attendance
    } catch (error) {
      console.error('Failed to create attendance:', error)
      throw error
    }
  })

  // Update attendance record
  ipcMain.handle('db:attendance:update', async (_event, id: string, data) => {
    try {
      db.update(schema.attendance)
        .set({
          ...data,
          updatedAt: new Date().toISOString()
        })
        .where(eq(schema.attendance.id, id))
        .run()

      createAuditLog(db, {
        action: 'update',
        entityType: 'attendance',
        entityId: id,
        changes: data
      })

      return db.select().from(schema.attendance).where(eq(schema.attendance.id, id)).get()
    } catch (error) {
      console.error('Failed to update attendance:', error)
      throw error
    }
  })

  // Delete attendance record
  ipcMain.handle('db:attendance:delete', async (_event, id: string) => {
    try {
      db.delete(schema.attendance).where(eq(schema.attendance.id, id)).run()

      createAuditLog(db, {
        action: 'delete',
        entityType: 'attendance',
        entityId: id
      })
    } catch (error) {
      console.error('Failed to delete attendance:', error)
      throw error
    }
  })

  // ==================== SALARY ====================

  // Get all salaries (optionally filtered by user)
  ipcMain.handle('db:salaries:getAll', async (_event, userId?: string) => {
    try {
      if (userId) {
        return db
          .select()
          .from(schema.userSalaries)
          .where(eq(schema.userSalaries.userId, userId))
          .orderBy(desc(schema.userSalaries.effectiveFrom))
          .all()
      }
      return db
        .select()
        .from(schema.userSalaries)
        .orderBy(desc(schema.userSalaries.createdAt))
        .all()
    } catch (error) {
      console.error('Failed to get salaries:', error)
      throw error
    }
  })

  // Create salary record
  ipcMain.handle('db:salaries:create', async (_event, data) => {
    try {
      const id = uuidv4()
      const netSalary = (data.basicSalary || 0) + (data.allowances || 0) - (data.deductions || 0)

      const salary = {
        id,
        userId: data.userId,
        basicSalary: data.basicSalary,
        allowances: data.allowances || 0,
        deductions: data.deductions || 0,
        netSalary,
        paymentFrequency: data.paymentFrequency || 'monthly',
        bankAccountNumber: data.bankAccountNumber || null,
        bankName: data.bankName || null,
        notes: data.notes || null,
        effectiveFrom: data.effectiveFrom,
        createdBy: data.createdBy || null
      }

      db.insert(schema.userSalaries).values(salary).run()

      createAuditLog(db, {
        userId: data.createdBy,
        action: 'create',
        entityType: 'salary',
        entityId: id,
        changes: salary
      })

      return salary
    } catch (error) {
      console.error('Failed to create salary:', error)
      throw error
    }
  })

  // Update salary record
  ipcMain.handle('db:salaries:update', async (_event, id: string, data) => {
    try {
      const updateData: any = { ...data }
      if (
        data.basicSalary !== undefined ||
        data.allowances !== undefined ||
        data.deductions !== undefined
      ) {
        const current = db
          .select()
          .from(schema.userSalaries)
          .where(eq(schema.userSalaries.id, id))
          .get()
        if (current) {
          updateData.netSalary =
            (data.basicSalary ?? current.basicSalary) +
            (data.allowances ?? current.allowances) -
            (data.deductions ?? current.deductions)
        }
      }

      updateData.updatedAt = new Date().toISOString()

      db.update(schema.userSalaries).set(updateData).where(eq(schema.userSalaries.id, id)).run()

      createAuditLog(db, {
        action: 'update',
        entityType: 'salary',
        entityId: id,
        changes: data
      })

      return db.select().from(schema.userSalaries).where(eq(schema.userSalaries.id, id)).get()
    } catch (error) {
      console.error('Failed to update salary:', error)
      throw error
    }
  })

  // ==================== SALARY PAYMENTS ====================

  // Get all salary payments (optionally filtered by user)
  ipcMain.handle('db:salaryPayments:getAll', async (_event, userId?: string) => {
    try {
      if (userId) {
        return db
          .select()
          .from(schema.salaryPayments)
          .where(eq(schema.salaryPayments.userId, userId))
          .orderBy(desc(schema.salaryPayments.paymentDate))
          .all()
      }
      return db
        .select()
        .from(schema.salaryPayments)
        .orderBy(desc(schema.salaryPayments.paymentDate))
        .all()
    } catch (error) {
      console.error('Failed to get salary payments:', error)
      throw error
    }
  })

  // Create salary payment
  ipcMain.handle('db:salaryPayments:create', async (_event, data) => {
    try {
      const id = uuidv4()
      const totalAmount =
        (data.basicAmount || 0) +
        (data.allowances || 0) +
        (data.bonuses || 0) -
        (data.deductions || 0)

      const payment = {
        id,
        userId: data.userId,
        salaryId: data.salaryId,
        paymentDate: data.paymentDate,
        payPeriodStart: data.payPeriodStart,
        payPeriodEnd: data.payPeriodEnd,
        basicAmount: data.basicAmount,
        allowances: data.allowances || 0,
        deductions: data.deductions || 0,
        bonuses: data.bonuses || 0,
        totalAmount,
        paymentMethod: data.paymentMethod,
        accountId: data.accountId || null,
        transactionReference: data.transactionReference || null,
        notes: data.notes || null,
        status: data.status || 'paid',
        paidBy: data.paidBy
      }

      db.insert(schema.salaryPayments).values(payment).run()

      // Update bank account if specified
      if (data.accountId) {
        const account = db
          .select()
          .from(schema.bankAccounts)
          .where(eq(schema.bankAccounts.id, data.accountId))
          .get()

        if (account) {
          db.update(schema.bankAccounts)
            .set({
              currentBalance: (account.currentBalance || 0) - totalAmount,
              totalWithdrawals: (account.totalWithdrawals || 0) + totalAmount,
              updatedAt: new Date().toISOString()
            })
            .where(eq(schema.bankAccounts.id, data.accountId))
            .run()
        }
      }

      createAuditLog(db, {
        userId: data.paidBy,
        action: 'create',
        entityType: 'salary_payment',
        entityId: id,
        changes: payment
      })

      return payment
    } catch (error) {
      console.error('Failed to create salary payment:', error)
      throw error
    }
  })

  // ==================== LEAVE REQUESTS ====================

  // Get all leave requests (with optional filters)
  ipcMain.handle(
    'db:leaveRequests:getAll',
    async (_event, filters?: { userId?: string; status?: string }) => {
      try {
        let query = db.select().from(schema.leaveRequests).$dynamic()

        if (filters?.userId) {
          query = query.where(eq(schema.leaveRequests.userId, filters.userId))
        }
        if (filters?.status) {
          query = query.where(eq(schema.leaveRequests.status, filters.status))
        }

        return query.orderBy(desc(schema.leaveRequests.createdAt)).all()
      } catch (error) {
        console.error('Failed to get leave requests:', error)
        throw error
      }
    }
  )

  // Create leave request
  ipcMain.handle('db:leaveRequests:create', async (_event, data) => {
    try {
      const id = uuidv4()
      const leaveRequest = {
        id,
        userId: data.userId,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: data.totalDays,
        reason: data.reason,
        status: 'pending'
      }

      db.insert(schema.leaveRequests).values(leaveRequest).run()

      createAuditLog(db, {
        userId: data.userId,
        action: 'create',
        entityType: 'leave_request',
        entityId: id,
        changes: leaveRequest
      })

      return leaveRequest
    } catch (error) {
      console.error('Failed to create leave request:', error)
      throw error
    }
  })

  // Update leave request
  ipcMain.handle('db:leaveRequests:update', async (_event, id: string, data) => {
    try {
      db.update(schema.leaveRequests)
        .set({
          ...data,
          updatedAt: new Date().toISOString()
        })
        .where(eq(schema.leaveRequests.id, id))
        .run()

      createAuditLog(db, {
        action: 'update',
        entityType: 'leave_request',
        entityId: id,
        changes: data
      })

      return db.select().from(schema.leaveRequests).where(eq(schema.leaveRequests.id, id)).get()
    } catch (error) {
      console.error('Failed to update leave request:', error)
      throw error
    }
  })
}
