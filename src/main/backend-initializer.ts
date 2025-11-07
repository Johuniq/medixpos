/**
 * Centralized backend initialization helper to avoid duplicate registration.
 */

import { initDatabase } from './database'
import { registerDatabaseHandlers } from './ipc/database-handlers'

let backendInitialized = false
let initializationPromise: Promise<void> | null = null

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
      backendInitialized = true
    })().catch((error) => {
      initializationPromise = null
      throw error
    })
  }

  await initializationPromise
}
