/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { and, desc, eq, isNull, or, sql } from 'drizzle-orm'
import { ipcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../../database'
import * as schema from '../../database/schema'
import { triggerExpiryCheck } from '../../services/expiryNotificationService'

interface CreateNotificationInput {
  userId?: string | null
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'low_stock' | 'expiry' | 'sale' | 'purchase'
  category?: 'system' | 'inventory' | 'sales' | 'general' | 'alert'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  actionUrl?: string
  actionText?: string
  metadata?: Record<string, unknown>
  expiresAt?: string
}

export function setupNotificationHandlers(): void {
  const db = getDatabase()

  // Create a new notification
  ipcMain.handle('notifications:create', async (_, input: CreateNotificationInput) => {
    try {
      const notification = {
        id: uuidv4(),
        userId: input.userId || null,
        title: input.title,
        message: input.message,
        type: input.type,
        category: input.category || 'general',
        priority: input.priority || 'medium',
        isRead: false,
        readAt: null,
        actionUrl: input.actionUrl || null,
        actionText: input.actionText || null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        expiresAt: input.expiresAt || null
      }

      const result = db.insert(schema.notifications).values(notification).run()

      return {
        success: true,
        data: { ...notification, lastInsertRowid: result.lastInsertRowid }
      }
    } catch (error) {
      console.error('Failed to create notification:', error)
      return { success: false, error: 'Failed to create notification' }
    }
  })

  // Get notifications for a user
  ipcMain.handle(
    'notifications:getByUser',
    async (_, userId: string | null, limit = 50, offset = 0) => {
      try {
        const baseQuery = db
          .select()
          .from(schema.notifications)
          .orderBy(desc(schema.notifications.createdAt))
          .limit(limit)
          .offset(offset)

        let results
        if (userId) {
          results = baseQuery
            .where(or(eq(schema.notifications.userId, userId), isNull(schema.notifications.userId)))
            .all()
        } else {
          results = baseQuery.all()
        }

        return { success: true, data: results }
      } catch (error) {
        console.error('Failed to get notifications:', error)
        return { success: false, error: 'Failed to get notifications' }
      }
    }
  )

  // Get unread count for a user
  ipcMain.handle('notifications:getUnreadCount', async (_, userId: string | null) => {
    try {
      const countResult = db
        .select({ count: sql<number>`count(*)` })
        .from(schema.notifications)
        .where(
          userId
            ? and(
                eq(schema.notifications.isRead, false),
                or(eq(schema.notifications.userId, userId), isNull(schema.notifications.userId))
              )
            : eq(schema.notifications.isRead, false)
        )
        .get()

      return { success: true, data: countResult?.count || 0 }
    } catch (error) {
      console.error('Failed to get unread count:', error)
      return { success: false, error: 'Failed to get unread count' }
    }
  })

  // Mark notification as read
  ipcMain.handle('notifications:markAsRead', async (_, notificationId: string) => {
    try {
      const result = db
        .update(schema.notifications)
        .set({
          isRead: true,
          readAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .where(eq(schema.notifications.id, notificationId))
        .run()

      return {
        success: result.changes > 0,
        data: { changed: result.changes }
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      return { success: false, error: 'Failed to mark notification as read' }
    }
  })

  // Delete a notification
  ipcMain.handle('notifications:delete', async (_, notificationId: string) => {
    try {
      const result = db
        .delete(schema.notifications)
        .where(eq(schema.notifications.id, notificationId))
        .run()

      return {
        success: result.changes > 0,
        data: { changed: result.changes }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
      return { success: false, error: 'Failed to delete notification' }
    }
  })

  // Create system notification
  ipcMain.handle(
    'notifications:createSystem',
    async (_, title: string, message: string, type = 'info', priority = 'medium') => {
      try {
        const notification = {
          id: uuidv4(),
          userId: null,
          title,
          message,
          type,
          category: 'system',
          priority,
          isRead: false,
          readAt: null,
          actionUrl: null,
          actionText: null,
          metadata: null,
          expiresAt: null
        }

        const result = db.insert(schema.notifications).values(notification).run()

        return {
          success: true,
          data: { ...notification, lastInsertRowid: result.lastInsertRowid }
        }
      } catch (error) {
        console.error('Failed to create system notification:', error)
        return { success: false, error: 'Failed to create system notification' }
      }
    }
  )

  // Trigger manual expiry check
  ipcMain.handle('notifications:checkExpiry', async () => {
    try {
      const result = await triggerExpiryCheck()
      return result
    } catch (error) {
      console.error('Failed to trigger expiry check:', error)
      return { success: false, error: 'Failed to trigger expiry check', notificationsCreated: 0 }
    }
  })
}
