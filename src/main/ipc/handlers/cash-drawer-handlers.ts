/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { ipcMain } from 'electron'
import { CashDrawerService } from '../../services/cashDrawer'

const cashDrawerService = CashDrawerService.getInstance()

export function registerCashDrawerHandlers(): void {
  // List available serial ports
  ipcMain.handle('cash-drawer:list-ports', async () => {
    try {
      const ports = await cashDrawerService.listPorts()
      return { success: true, ports }
    } catch (error) {
      console.error('Failed to list ports:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list ports'
      }
    }
  })

  // Connect to cash drawer
  ipcMain.handle('cash-drawer:connect', async (_event, portPath: string, baudRate = 9600) => {
    try {
      const success = await cashDrawerService.connect(portPath, baudRate)
      return {
        success,
        message: success ? 'Connected to cash drawer' : 'Failed to connect to cash drawer'
      }
    } catch (error) {
      console.error('Failed to connect to cash drawer:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }
    }
  })

  // Disconnect from cash drawer
  ipcMain.handle('cash-drawer:disconnect', async () => {
    try {
      await cashDrawerService.disconnect()
      return { success: true, message: 'Disconnected from cash drawer' }
    } catch (error) {
      console.error('Failed to disconnect:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Disconnection failed'
      }
    }
  })

  // Open cash drawer
  ipcMain.handle(
    'cash-drawer:open',
    async (_event, commandType: 'STANDARD' | 'ALTERNATIVE' | 'EPSON' | 'STAR' = 'STANDARD') => {
      try {
        const success = await cashDrawerService.openDrawer(commandType)
        return {
          success,
          message: success ? 'Cash drawer opened' : 'Failed to open cash drawer'
        }
      } catch (error) {
        console.error('Failed to open cash drawer:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to open drawer'
        }
      }
    }
  )

  // Test cash drawer
  ipcMain.handle('cash-drawer:test', async () => {
    try {
      const success = await cashDrawerService.testDrawer()
      return {
        success,
        message: success ? 'Cash drawer test successful' : 'Cash drawer test failed'
      }
    } catch (error) {
      console.error('Failed to test cash drawer:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      }
    }
  })

  // Get connection status
  ipcMain.handle('cash-drawer:get-status', () => {
    try {
      const status = cashDrawerService.getStatus()
      return { success: true, status }
    } catch (error) {
      console.error('Failed to get status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get status'
      }
    }
  })

  // Auto-connect to first available port
  ipcMain.handle('cash-drawer:auto-connect', async () => {
    try {
      const success = await cashDrawerService.autoConnect()
      return {
        success,
        message: success
          ? 'Auto-connected to cash drawer'
          : 'No serial ports found or connection failed'
      }
    } catch (error) {
      console.error('Auto-connect failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Auto-connect failed'
      }
    }
  })

  // Reconnect to last used port
  ipcMain.handle('cash-drawer:reconnect', async () => {
    try {
      const success = await cashDrawerService.reconnect()
      return {
        success,
        message: success ? 'Reconnected to cash drawer' : 'Reconnection failed'
      }
    } catch (error) {
      console.error('Reconnect failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Reconnection failed'
      }
    }
  })
}
