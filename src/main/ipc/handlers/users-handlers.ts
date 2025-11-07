/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import bcrypt from 'bcryptjs'
import { and, eq } from 'drizzle-orm'
import { ipcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../../database'
import * as schema from '../../database/schema'
import type { SessionRole } from '../../security/session-manager'
import { sessionManager } from '../../security/session-manager'
import { createAuditLog, SALT_ROUNDS } from '../utils/audit-logger'

export function registerUsersHandlers(): void {
  const db = getDatabase()

  // Get all active users
  ipcMain.handle('db:users:getAll', async () => {
    return db.select().from(schema.users).where(eq(schema.users.isActive, true)).all()
  })

  // Get user by ID
  ipcMain.handle('db:users:getById', async (_, id: string) => {
    return db.select().from(schema.users).where(eq(schema.users.id, id)).get()
  })

  // Authenticate user
  ipcMain.handle('db:users:authenticate', async (event, { username, password }) => {
    // Get user by username
    const user = db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.username, username), eq(schema.users.isActive, true)))
      .get()

    // If user doesn't exist, return null
    if (!user) {
      return null
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return null
    }

    const sessionToken = sessionManager.issueToken(event, user.id, user.role as SessionRole)
    // Exclude password hash before returning to renderer
    const { password: removedPassword, ...safeUser } = user
    void removedPassword
    return { ...safeUser, sessionToken }
  })

  // Create new user
  ipcMain.handle('db:users:create', async (_, data) => {
    const id = uuidv4()

    // Hash password before storing
    let hashedPassword = data.password
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS)
    }

    const result = db
      .insert(schema.users)
      .values({ id, ...data, password: hashedPassword })
      .returning()
      .get()

    // Create audit log
    createAuditLog(db, {
      userId: data.createdBy,
      username: result.username,
      action: 'create',
      entityType: 'user',
      entityId: id,
      entityName: result.fullName
    })

    return result
  })

  // Update user
  ipcMain.handle('db:users:update', async (_, { id, data }) => {
    // Get old user data for audit
    const oldUser = db.select().from(schema.users).where(eq(schema.users.id, id)).get()

    // Hash password if it's being updated
    const updateData = { ...data }
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, SALT_ROUNDS)
    }

    const result = db
      .update(schema.users)
      .set({ ...updateData, updatedAt: new Date().toISOString() })
      .where(eq(schema.users.id, id))
      .returning()
      .get()

    // Create audit log with changes
    const changes: Record<string, { old: unknown; new: unknown }> = {}
    if (oldUser) {
      Object.keys(updateData).forEach((key) => {
        if (key !== 'password' && oldUser[key] !== updateData[key]) {
          changes[key] = { old: oldUser[key], new: updateData[key] }
        }
      })
    }

    createAuditLog(db, {
      userId: data.updatedBy || data.createdBy,
      username: result.username,
      action: 'update',
      entityType: 'user',
      entityId: id,
      entityName: result.fullName,
      changes: Object.keys(changes).length > 0 ? changes : undefined
    })

    return result
  })

  // Delete user (soft delete)
  ipcMain.handle('db:users:delete', async (_, id: string) => {
    const user = db.select().from(schema.users).where(eq(schema.users.id, id)).get()

    const result = db
      .update(schema.users)
      .set({ isActive: false })
      .where(eq(schema.users.id, id))
      .run()

    if (user) {
      createAuditLog(db, {
        username: user.username,
        action: 'delete',
        entityType: 'user',
        entityId: id,
        entityName: user.fullName
      })
    }

    return result
  })

  // Change password (user changing their own password)
  ipcMain.handle('db:users:changePassword', async (_, { userId, currentPassword, newPassword }) => {
    // Get user
    const user = db.select().from(schema.users).where(eq(schema.users.id, userId)).get()

    if (!user) {
      throw new Error('User not found')
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect')
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)

    // Update password and clear mustChangePassword flag
    const updatedUser = db
      .update(schema.users)
      .set({
        password: hashedNewPassword,
        mustChangePassword: false,
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.users.id, userId))
      .returning()
      .get()

    // Create audit log for password change
    createAuditLog(db, {
      userId: userId,
      username: user.username,
      action: 'update',
      entityType: 'user_password',
      entityId: userId,
      entityName: user.fullName,
      changes: { action: 'password_changed_by_user' }
    })

    return updatedUser
  })

  // Admin reset password (for admins to reset user passwords)
  ipcMain.handle('db:users:resetPassword', async (_, { userId, newPassword, adminId }) => {
    // Get admin and target user
    const admin = db.select().from(schema.users).where(eq(schema.users.id, adminId)).get()
    const targetUser = db.select().from(schema.users).where(eq(schema.users.id, userId)).get()

    if (!admin || !targetUser) {
      throw new Error('User not found')
    }

    // Check permissions
    // super_admin can reset super_admin and admin passwords
    // admin can reset manager, pharmacist, and cashier passwords
    if (admin.role === 'super_admin') {
      if (!['super_admin', 'admin'].includes(targetUser.role)) {
        throw new Error('Super admin can only reset super admin and admin passwords')
      }
    } else if (admin.role === 'admin') {
      if (!['manager', 'pharmacist', 'cashier'].includes(targetUser.role)) {
        throw new Error('Admin can only reset manager, pharmacist, and cashier passwords')
      }
    } else {
      throw new Error('Insufficient permissions to reset passwords')
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)

    // Update password and set mustChangePassword flag
    const updatedUser = db
      .update(schema.users)
      .set({
        password: hashedNewPassword,
        mustChangePassword: true, // Force user to change password on next login
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.users.id, userId))
      .returning()
      .get()

    // Create audit log for password reset by admin
    createAuditLog(db, {
      userId: adminId,
      username: admin.username,
      action: 'update',
      entityType: 'user_password',
      entityId: userId,
      entityName: targetUser.fullName,
      changes: { action: 'password_reset_by_admin', adminId, adminName: admin.fullName }
    })

    return updatedUser
  })

  ipcMain.handle('auth:invalidateSession', (_, token: string | null | undefined) => {
    sessionManager.invalidateToken(token)
    return { success: true }
  })
}
