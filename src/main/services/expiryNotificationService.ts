/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { and, gte, lt, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../database'
import * as schema from '../database/schema'

interface ExpiryNotificationConfig {
  checkIntervalHours: number // How often to check (default: 24 hours)
  thresholds: {
    critical: number // Days (default: 7)
    high: number // Days (default: 30)
    medium: number // Days (default: 90)
  }
}

const defaultConfig: ExpiryNotificationConfig = {
  checkIntervalHours: 24,
  thresholds: {
    critical: 7,
    high: 30,
    medium: 90
  }
}

/**
 * Check for expiring batches and create notifications
 */
export async function checkExpiringBatches(
  config: ExpiryNotificationConfig = defaultConfig
): Promise<{
  success: boolean
  notificationsCreated: number
  error?: string
}> {
  const db = getDatabase()

  try {
    const now = new Date()
    const { critical, high, medium } = config.thresholds

    // Calculate threshold dates
    const criticalDate = new Date()
    criticalDate.setDate(criticalDate.getDate() + critical)

    const highDate = new Date()
    highDate.setDate(highDate.getDate() + high)

    const mediumDate = new Date()
    mediumDate.setDate(mediumDate.getDate() + medium)

    // Get all expiring batches grouped by urgency
    const expiringBatches = await db
      .select({
        id: schema.inventoryBatches.id,
        batchNumber: schema.inventoryBatches.batchNumber,
        quantity: schema.inventoryBatches.quantity,
        expiryDate: schema.inventoryBatches.expiryDate,
        unitCost: schema.inventoryBatches.unitCost,
        productId: schema.inventoryBatches.productId,
        productName: schema.products.name,
        productSku: schema.products.sku
      })
      .from(schema.inventoryBatches)
      .leftJoin(schema.products, sql`${schema.inventoryBatches.productId} = ${schema.products.id}`)
      .where(
        and(
          gte(schema.inventoryBatches.expiryDate, now.toISOString()),
          lt(schema.inventoryBatches.expiryDate, mediumDate.toISOString()),
          sql`${schema.inventoryBatches.quantity} > 0`
        )
      )
      .orderBy(schema.inventoryBatches.expiryDate)
      .all()

    // Group batches by urgency
    const criticalBatches = expiringBatches.filter((b) => new Date(b.expiryDate) <= criticalDate)
    const highBatches = expiringBatches.filter(
      (b) => new Date(b.expiryDate) > criticalDate && new Date(b.expiryDate) <= highDate
    )
    const mediumBatches = expiringBatches.filter(
      (b) => new Date(b.expiryDate) > highDate && new Date(b.expiryDate) <= mediumDate
    )

    let notificationsCreated = 0

    // Create critical notifications (expiring within 7 days)
    if (criticalBatches.length > 0) {
      const totalValue = criticalBatches.reduce((sum, b) => sum + b.quantity * (b.unitCost || 0), 0)

      // Create system-wide notification
      db.insert(schema.notifications)
        .values({
          id: uuidv4(),
          userId: null, // System-wide
          title: `CRITICAL: ${criticalBatches.length} Batch(es) Expiring Within ${critical} Days!`,
          message: `${criticalBatches.length} batch(es) will expire within the next ${critical} days. Total value at risk: ${totalValue.toFixed(2)}. Immediate action required!`,
          type: 'error',
          category: 'alert',
          priority: 'urgent',
          actionUrl: '/batches',
          actionText: 'View Batches',
          metadata: JSON.stringify({
            batchCount: criticalBatches.length,
            totalValue,
            urgency: 'critical',
            daysThreshold: critical,
            batches: criticalBatches.map((b) => ({
              batchNumber: b.batchNumber,
              productName: b.productName,
              expiryDate: b.expiryDate,
              quantity: b.quantity,
              valueAtRisk: b.quantity * (b.unitCost || 0)
            }))
          }),
          expiresAt: null, // Don't expire until read
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .run()

      notificationsCreated++
    }

    // Create high priority notifications (expiring within 30 days)
    if (highBatches.length > 0) {
      const totalValue = highBatches.reduce((sum, b) => sum + b.quantity * (b.unitCost || 0), 0)

      db.insert(schema.notifications)
        .values({
          id: uuidv4(),
          userId: null,
          title: `WARNING: ${highBatches.length} Batch(es) Expiring Within ${high} Days`,
          message: `${highBatches.length} batch(es) will expire within the next ${high} days. Total value at risk: ${totalValue.toFixed(2)}. Plan sales or promotions to move inventory.`,
          type: 'warning',
          category: 'alert',
          priority: 'high',
          actionUrl: '/batches',
          actionText: 'View Batches',
          metadata: JSON.stringify({
            batchCount: highBatches.length,
            totalValue,
            urgency: 'high',
            daysThreshold: high,
            batches: highBatches.slice(0, 10).map((b) => ({
              // Top 10
              batchNumber: b.batchNumber,
              productName: b.productName,
              expiryDate: b.expiryDate,
              quantity: b.quantity,
              valueAtRisk: b.quantity * (b.unitCost || 0)
            }))
          }),
          expiresAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .run()

      notificationsCreated++
    }

    // Create medium priority notifications (expiring within 90 days)
    if (mediumBatches.length > 0) {
      const totalValue = mediumBatches.reduce((sum, b) => sum + b.quantity * (b.unitCost || 0), 0)

      db.insert(schema.notifications)
        .values({
          id: uuidv4(),
          userId: null,
          title: `INFO: ${mediumBatches.length} Batch(es) Expiring Within ${medium} Days`,
          message: `${mediumBatches.length} batch(es) will expire within the next ${medium} days. Total value: ${totalValue.toFixed(2)}. Monitor and plan inventory rotation.`,
          type: 'info',
          category: 'inventory',
          priority: 'medium',
          actionUrl: '/batches',
          actionText: 'View Batches',
          metadata: JSON.stringify({
            batchCount: mediumBatches.length,
            totalValue,
            urgency: 'medium',
            daysThreshold: medium
          }),
          expiresAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .run()

      notificationsCreated++
    }

    console.log(
      `[ExpiryNotificationService] Created ${notificationsCreated} notifications for ${expiringBatches.length} expiring batches`
    )

    return {
      success: true,
      notificationsCreated
    }
  } catch (error) {
    console.error('[ExpiryNotificationService] Failed to check expiring batches:', error)
    return {
      success: false,
      notificationsCreated: 0,
      error: (error as Error).message
    }
  }
}

/**
 * Start periodic expiry checks
 * @param intervalHours How often to check (default: 24 hours)
 */
export function startExpiryNotificationScheduler(
  config: ExpiryNotificationConfig = defaultConfig
): NodeJS.Timeout {
  console.log(
    `[ExpiryNotificationService] Starting scheduler with ${config.checkIntervalHours}h interval`
  )

  // Run immediately on start
  checkExpiringBatches(config)

  // Schedule periodic checks
  const intervalMs = config.checkIntervalHours * 60 * 60 * 1000
  const intervalId = setInterval(() => {
    console.log('[ExpiryNotificationService] Running scheduled expiry check...')
    checkExpiringBatches(config)
  }, intervalMs)

  return intervalId
}

/**
 * Stop the expiry notification scheduler
 */
export function stopExpiryNotificationScheduler(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId)
  console.log('[ExpiryNotificationService] Scheduler stopped')
}

/**
 * Manual trigger for expiry check (for testing or manual refresh)
 */
export async function triggerExpiryCheck(): Promise<{
  success: boolean
  notificationsCreated: number
  error?: string
}> {
  console.log('[ExpiryNotificationService] Manual expiry check triggered')
  return await checkExpiringBatches()
}
