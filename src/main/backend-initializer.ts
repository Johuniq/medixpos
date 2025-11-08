/**
 * Centralized backend initialization helper to avoid duplicate registration.
 */

import { initDatabase } from './database'
import { registerDatabaseHandlers } from './ipc/database-handlers'
import { startExpiryNotificationScheduler } from './services/expiryNotificationService'

let backendInitialized = false
let initializationPromise: Promise<void> | null = null
let expirySchedulerInterval: NodeJS.Timeout | null = null

export function isBackendInitialized(): boolean {
  return backendInitialized
}

export async function initializeBackend(): Promise<void> {
  if (backendInitialized) {
    return
  }

  if (!initializationPromise) {
    initializationPromise = (async () => {
      await initDatabase()
      registerDatabaseHandlers()

      // Start expiry notification scheduler (checks every 24 hours)
      expirySchedulerInterval = startExpiryNotificationScheduler({
        checkIntervalHours: 24,
        thresholds: {
          critical: 7, // 7 days
          high: 30, // 30 days
          medium: 90 // 90 days
        }
      })
      console.log('[Backend] Expiry notification scheduler started')

      backendInitialized = true
    })().catch((error) => {
      initializationPromise = null
      throw error
    })
  }

  await initializationPromise
}

export function getExpirySchedulerInterval(): NodeJS.Timeout | null {
  return expirySchedulerInterval
}
