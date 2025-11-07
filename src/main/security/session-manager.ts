import crypto from 'crypto'
import type { IpcMainInvokeEvent } from 'electron'

export type SessionRole = 'super_admin' | 'admin' | 'manager' | 'cashier' | 'pharmacist'

interface SessionRecord {
  token: string
  userId: string
  role: SessionRole
  webContentsId: number
  createdAt: number
  lastSeen: number
}

const SESSION_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

class SessionManager {
  private sessions = new Map<string, SessionRecord>()

  public issueToken(event: IpcMainInvokeEvent, userId: string, role: SessionRole): string {
    this.purgeExpired()

    const token = crypto.randomBytes(32).toString('hex')
    const webContentsId = event.sender.id
    const record: SessionRecord = {
      token,
      userId,
      role,
      webContentsId,
      createdAt: Date.now(),
      lastSeen: Date.now()
    }

    this.sessions.set(token, record)
    return token
  }

  public validateToken(
    event: IpcMainInvokeEvent,
    token: string | undefined | null,
    allowedRoles: SessionRole[]
  ): SessionRecord | null {
    if (!token) {
      return null
    }

    const record = this.sessions.get(token)
    if (!record) {
      return null
    }

    // Ensure the token is tied to the same renderer process
    if (record.webContentsId !== event.sender.id) {
      return null
    }

    // Enforce role-based access
    if (!allowedRoles.includes(record.role)) {
      return null
    }

    // Enforce session timeout
    if (Date.now() - record.lastSeen > SESSION_TTL_MS) {
      this.sessions.delete(token)
      return null
    }

    record.lastSeen = Date.now()
    return record
  }

  public invalidateToken(token: string | null | undefined): void {
    if (!token) {
      return
    }
    this.sessions.delete(token)
  }

  private purgeExpired(): void {
    const now = Date.now()
    for (const [token, record] of this.sessions.entries()) {
      if (now - record.lastSeen > SESSION_TTL_MS) {
        this.sessions.delete(token)
      }
    }
  }
}

export const sessionManager = new SessionManager()
