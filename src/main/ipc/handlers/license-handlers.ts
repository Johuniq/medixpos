/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { ipcMain } from 'electron'
import { initializeBackend, isBackendInitialized } from '../../backend-initializer'
import { sessionManager } from '../../security/session-manager'
import { LicenseService } from '../../services/license'

export function registerLicenseHandlers(): void {
  const licenseService = LicenseService.getInstance()
  const adminRoles: Array<'super_admin' | 'admin'> = ['super_admin', 'admin']

  // Validate license
  ipcMain.handle('license:validate', async (_event, licenseKey?: string, activationId?: string) => {
    try {
      await licenseService.whenReady()
      const result = await licenseService.validateLicense(licenseKey, activationId)

      // If validation successful and database not initialized yet, initialize it now
      if (result.valid && !isBackendInitialized()) {
        try {
          console.log('License validated successfully. Initializing backend...')
          await initializeBackend()
          console.log('Backend initialized successfully')
        } catch (dbError) {
          console.error('Failed to initialize backend after license validation:', dbError)
          // Backend initialization failed, but license is valid
          // The app can still show the UI but database operations will fail
        }
      }

      return result
    } catch (error) {
      console.error('Error validating license:', error)
      return {
        valid: false,
        status: 'invalid',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  })

  // Activate license
  ipcMain.handle(
    'license:activate',
    async (event, payload: { licenseKey: string; label?: string; sessionToken?: string }) => {
      try {
        await licenseService.whenReady()
        const { licenseKey, label, sessionToken } = payload || {}

        if (!licenseKey) {
          return { success: false, message: 'License key is required' }
        }

        if (licenseService.hasStoredLicense()) {
          const session = sessionManager.validateToken(event, sessionToken, adminRoles)
          if (!session) {
            return { success: false, message: 'Unauthorized license activation' }
          }
        }

        return await licenseService.activateLicense(licenseKey, label)
      } catch (error) {
        console.error('Error activating license:', error)
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      }
    }
  )

  // Deactivate license
  ipcMain.handle('license:deactivate', async (event, payload: { sessionToken?: string }) => {
    try {
      await licenseService.whenReady()
      const session = sessionManager.validateToken(event, payload?.sessionToken, adminRoles)
      if (!session) {
        return { success: false, message: 'Unauthorized license deactivation' }
      }

      return await licenseService.deactivateLicense()
    } catch (error) {
      console.error('Error deactivating license:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  })

  // Get license info
  ipcMain.handle('license:getInfo', async () => {
    try {
      await licenseService.whenReady()
      return licenseService.getLicenseInfo()
    } catch (error) {
      console.error('Error getting license info:', error)
      return {
        isLicensed: false
      }
    }
  })

  // Check if needs revalidation
  ipcMain.handle('license:needsRevalidation', async () => {
    try {
      await licenseService.whenReady()
      return licenseService.needsRevalidation()
    } catch (error) {
      console.error('Error checking revalidation:', error)
      return true
    }
  })

  // Clear license
  ipcMain.handle('license:clear', async (event, payload: { sessionToken?: string }) => {
    try {
      await licenseService.whenReady()
      const session = sessionManager.validateToken(event, payload?.sessionToken, ['super_admin'])
      if (!session) {
        return { success: false, message: 'Unauthorized license removal' }
      }

      await licenseService.clearLicense()
      return { success: true }
    } catch (error) {
      console.error('Error clearing license:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  })

  // Get machine ID for display
  ipcMain.handle('license:getMachineId', async () => {
    try {
      await licenseService.whenReady()
      return await licenseService.getMachineIdForDisplay()
    } catch (error) {
      console.error('Error getting machine ID:', error)
      return 'UNKNOWN'
    }
  })
}
