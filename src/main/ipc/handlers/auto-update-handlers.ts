/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { ipcMain } from 'electron'
import { AutoUpdateService } from '../../services/autoUpdater'

/**
 * Register IPC handlers for auto-update functionality
 */
export function registerAutoUpdateHandlers(): void {
  const autoUpdateService = AutoUpdateService.getInstance()

  // Check for updates manually
  ipcMain.handle('auto-update:check', async () => {
    try {
      await autoUpdateService.checkForUpdates()
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check for updates'
      }
    }
  })

  // Download update
  ipcMain.handle('auto-update:download', async () => {
    try {
      await autoUpdateService.downloadUpdate()
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to download update'
      }
    }
  })

  // Install update and restart
  ipcMain.handle('auto-update:install', () => {
    try {
      autoUpdateService.quitAndInstall()
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to install update'
      }
    }
  })

  // Get current version
  ipcMain.handle('auto-update:get-version', () => {
    return {
      success: true,
      version: autoUpdateService.getCurrentVersion()
    }
  })

  // Get update status
  ipcMain.handle('auto-update:get-status', () => {
    return {
      success: true,
      status: autoUpdateService.getStatus()
    }
  })
}
