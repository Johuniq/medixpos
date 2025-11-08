/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { and, desc, eq, like, or, sql, SQL } from 'drizzle-orm'
import { ipcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../../database'
import * as schema from '../../database/schema'
import { createAuditLog } from '../utils/audit-logger'

export function registerPrescriptionHandlers(): void {
  const db = getDatabase()

  // Get paginated prescriptions
  ipcMain.handle(
    'db:prescriptions:getPaginated',
    async (
      _,
      {
        page = 1,
        limit = 50,
        search,
        customerId
      }: {
        page?: number
        limit?: number
        search?: string
        customerId?: string
      } = {}
    ) => {
      try {
        // Build conditions
        const conditions: SQL<unknown>[] = []

        if (customerId) {
          conditions.push(eq(schema.prescriptions.customerId, customerId))
        }

        if (search) {
          conditions.push(
            or(
              like(schema.prescriptions.prescriptionNumber, `%${search}%`),
              like(schema.prescriptions.doctorName, `%${search}%`),
              like(schema.customers.name, `%${search}%`),
              like(schema.customers.phone, `%${search}%`)
            )!
          )
        }

        // Get total count
        const countQuery = db
          .select({ count: sql<number>`count(*)` })
          .from(schema.prescriptions)
          .leftJoin(schema.customers, eq(schema.prescriptions.customerId, schema.customers.id))

        const totalResult =
          conditions.length > 0 ? countQuery.where(and(...conditions)!).get() : countQuery.get()

        const total = totalResult?.count || 0

        // Get paginated data
        const offset = (page - 1) * limit
        const dataQuery = db
          .select({
            prescription: schema.prescriptions,
            customer: {
              id: schema.customers.id,
              name: schema.customers.name,
              phone: schema.customers.phone
            },
            sale: {
              id: schema.sales.id,
              invoiceNumber: schema.sales.invoiceNumber,
              totalAmount: schema.sales.totalAmount
            }
          })
          .from(schema.prescriptions)
          .leftJoin(schema.customers, eq(schema.prescriptions.customerId, schema.customers.id))
          .leftJoin(schema.sales, eq(schema.prescriptions.saleId, schema.sales.id))
          .orderBy(desc(schema.prescriptions.createdAt))
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
        console.error('Error fetching paginated prescriptions:', error)
        throw error
      }
    }
  )

  // Get all prescriptions (with optional customer filter)
  ipcMain.handle('db:prescriptions:getAll', async (_, customerId?: string) => {
    try {
      let query = db
        .select({
          prescription: schema.prescriptions,
          customer: {
            id: schema.customers.id,
            name: schema.customers.name,
            phone: schema.customers.phone
          },
          sale: {
            id: schema.sales.id,
            invoiceNumber: schema.sales.invoiceNumber,
            totalAmount: schema.sales.totalAmount
          }
        })
        .from(schema.prescriptions)
        .leftJoin(schema.customers, eq(schema.prescriptions.customerId, schema.customers.id))
        .leftJoin(schema.sales, eq(schema.prescriptions.saleId, schema.sales.id))
        .orderBy(desc(schema.prescriptions.createdAt))

      if (customerId) {
        query = query.where(eq(schema.prescriptions.customerId, customerId)) as typeof query
      }

      return query.all()
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
      throw error
    }
  })

  // Get prescription by ID
  ipcMain.handle('db:prescriptions:getById', async (_, id: string) => {
    try {
      return db
        .select({
          prescription: schema.prescriptions,
          customer: {
            id: schema.customers.id,
            name: schema.customers.name,
            phone: schema.customers.phone,
            email: schema.customers.email
          },
          sale: {
            id: schema.sales.id,
            invoiceNumber: schema.sales.invoiceNumber,
            totalAmount: schema.sales.totalAmount,
            createdAt: schema.sales.createdAt
          }
        })
        .from(schema.prescriptions)
        .leftJoin(schema.customers, eq(schema.prescriptions.customerId, schema.customers.id))
        .leftJoin(schema.sales, eq(schema.prescriptions.saleId, schema.sales.id))
        .where(eq(schema.prescriptions.id, id))
        .get()
    } catch (error) {
      console.error('Error fetching prescription by ID:', error)
      throw error
    }
  })

  // Get prescriptions by customer ID
  ipcMain.handle('db:prescriptions:getByCustomer', async (_, customerId: string) => {
    try {
      return db
        .select({
          prescription: schema.prescriptions,
          sale: {
            id: schema.sales.id,
            invoiceNumber: schema.sales.invoiceNumber,
            totalAmount: schema.sales.totalAmount
          }
        })
        .from(schema.prescriptions)
        .leftJoin(schema.sales, eq(schema.prescriptions.saleId, schema.sales.id))
        .where(eq(schema.prescriptions.customerId, customerId))
        .orderBy(desc(schema.prescriptions.createdAt))
        .all()
    } catch (error) {
      console.error('Error fetching prescriptions by customer:', error)
      throw error
    }
  })

  // Create new prescription
  ipcMain.handle('db:prescriptions:create', async (_, data) => {
    try {
      const id = uuidv4()

      const prescriptionData = {
        id,
        customerId: data.customerId,
        saleId: data.saleId || null,
        doctorName: data.doctorName || null,
        doctorPhone: data.doctorPhone || null,
        prescriptionNumber: data.prescriptionNumber || null,
        prescriptionDate: data.prescriptionDate,
        diagnosis: data.diagnosis || null,
        notes: data.notes || null,
        imageUrl: data.imageUrl || null,
        createdAt: new Date().toISOString()
      }

      const result = db.insert(schema.prescriptions).values(prescriptionData).returning().get()

      // Get customer name for audit log
      const customer = db
        .select()
        .from(schema.customers)
        .where(eq(schema.customers.id, data.customerId))
        .get()

      createAuditLog(db, {
        action: 'create',
        entityType: 'prescription',
        entityId: id,
        entityName: customer ? `Prescription for ${customer.name}` : 'Prescription'
      })

      return result
    } catch (error) {
      console.error('Error creating prescription:', error)
      throw error
    }
  })

  // Update prescription
  ipcMain.handle('db:prescriptions:update', async (_, { id, data }) => {
    try {
      const oldPrescription = db
        .select()
        .from(schema.prescriptions)
        .where(eq(schema.prescriptions.id, id))
        .get()

      const updateData = {
        customerId: data.customerId,
        saleId: data.saleId || null,
        doctorName: data.doctorName || null,
        doctorPhone: data.doctorPhone || null,
        prescriptionNumber: data.prescriptionNumber || null,
        prescriptionDate: data.prescriptionDate,
        diagnosis: data.diagnosis || null,
        notes: data.notes || null,
        imageUrl: data.imageUrl || null
      }

      const result = db
        .update(schema.prescriptions)
        .set(updateData)
        .where(eq(schema.prescriptions.id, id))
        .returning()
        .get()

      const changes: Record<string, { old: unknown; new: unknown }> = {}
      if (oldPrescription) {
        Object.keys(updateData).forEach((key) => {
          if (oldPrescription[key] !== updateData[key]) {
            changes[key] = { old: oldPrescription[key], new: updateData[key] }
          }
        })
      }

      // Get customer name for audit log
      const customer = db
        .select()
        .from(schema.customers)
        .where(eq(schema.customers.id, data.customerId))
        .get()

      createAuditLog(db, {
        action: 'update',
        entityType: 'prescription',
        entityId: id,
        entityName: customer ? `Prescription for ${customer.name}` : 'Prescription',
        changes: Object.keys(changes).length > 0 ? changes : undefined
      })

      return result
    } catch (error) {
      console.error('Error updating prescription:', error)
      throw error
    }
  })

  // Delete prescription
  ipcMain.handle('db:prescriptions:delete', async (_, id: string) => {
    try {
      const prescription = db
        .select()
        .from(schema.prescriptions)
        .where(eq(schema.prescriptions.id, id))
        .get()

      if (!prescription) {
        throw new Error('Prescription not found')
      }

      db.delete(schema.prescriptions).where(eq(schema.prescriptions.id, id)).run()

      // Get customer name for audit log
      const customer = db
        .select()
        .from(schema.customers)
        .where(eq(schema.customers.id, prescription.customerId))
        .get()

      createAuditLog(db, {
        action: 'delete',
        entityType: 'prescription',
        entityId: id,
        entityName: customer ? `Prescription for ${customer.name}` : 'Prescription'
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting prescription:', error)
      throw error
    }
  })

  // Search prescriptions
  ipcMain.handle('db:prescriptions:search', async (_, searchTerm: string) => {
    try {
      return db
        .select({
          prescription: schema.prescriptions,
          customer: {
            id: schema.customers.id,
            name: schema.customers.name,
            phone: schema.customers.phone
          },
          sale: {
            id: schema.sales.id,
            invoiceNumber: schema.sales.invoiceNumber,
            totalAmount: schema.sales.totalAmount
          }
        })
        .from(schema.prescriptions)
        .leftJoin(schema.customers, eq(schema.prescriptions.customerId, schema.customers.id))
        .leftJoin(schema.sales, eq(schema.prescriptions.saleId, schema.sales.id))
        .where(
          sql`(${schema.prescriptions.prescriptionNumber} LIKE ${`%${searchTerm}%`} 
            OR ${schema.prescriptions.doctorName} LIKE ${`%${searchTerm}%`}
            OR ${schema.customers.name} LIKE ${`%${searchTerm}%`}
            OR ${schema.customers.phone} LIKE ${`%${searchTerm}%`})`
        )
        .orderBy(desc(schema.prescriptions.createdAt))
        .all()
    } catch (error) {
      console.error('Error searching prescriptions:', error)
      throw error
    }
  })

  // Get prescription statistics
  ipcMain.handle('db:prescriptions:getStats', async () => {
    try {
      const totalPrescriptions = db
        .select({ count: sql<number>`count(*)` })
        .from(schema.prescriptions)
        .get()

      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)

      const monthlyPrescriptions = db
        .select({ count: sql<number>`count(*)` })
        .from(schema.prescriptions)
        .where(sql`${schema.prescriptions.createdAt} >= ${thisMonth.toISOString()}`)
        .get()

      const prescriptionsWithSales = db
        .select({ count: sql<number>`count(*)` })
        .from(schema.prescriptions)
        .where(sql`${schema.prescriptions.saleId} IS NOT NULL`)
        .get()

      return {
        total: totalPrescriptions?.count || 0,
        thisMonth: monthlyPrescriptions?.count || 0,
        withSales: prescriptionsWithSales?.count || 0
      }
    } catch (error) {
      console.error('Error fetching prescription stats:', error)
      throw error
    }
  })
}
