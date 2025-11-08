/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { app, BrowserWindow, dialog } from 'electron'
import log from 'electron-log'
import { autoUpdater } from 'electron-updater'

/**
 * Auto-Update Service
 * Handles application updates using electron-updater
 *
 * Features:
 * - Automatic update checks on startup
 * - Manual update checks
 * - Download progress tracking
 * - Update notifications
 * - Install on next restart
 * - Update settings (auto/manual)
 */

export class AutoUpdateService {
  private static instance: AutoUpdateService
  private mainWindow: BrowserWindow | null = null
  private updateCheckInterval: NodeJS.Timeout | null = null
  private isChecking = false
  private isDownloading = false

  private constructor() {
    this.setupLogging()
    this.setupAutoUpdater()
  }

  public static getInstance(): AutoUpdateService {
    if (!AutoUpdateService.instance) {
      AutoUpdateService.instance = new AutoUpdateService()
    }
    return AutoUpdateService.instance
  }

  /**
   * Setup logging for auto-updater
   */
  private setupLogging(): void {
    // Configure logging
    log.transports.file.level = 'info'
    autoUpdater.logger = log

    // Log update events
    log.info('Auto-updater initialized')
    log.info('App version:', app.getVersion())
  }

  /**
   * Setup auto-updater configuration and event listeners
   */
  private setupAutoUpdater(): void {
    // Configure auto-updater
    autoUpdater.autoDownload = false // Don't auto-download, ask user first
    autoUpdater.autoInstallOnAppQuit = true // Install when app quits

    // Allow pre-release updates in development
    if (process.env.NODE_ENV === 'development') {
      autoUpdater.allowPrerelease = true
    }

    // Event: Checking for update
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for updates...')
      this.isChecking = true
      this.sendStatusToWindow('checking-for-update', {
        message: 'Checking for updates...'
      })
    })

    // Event: Update available
    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info)
      this.isChecking = false
      this.sendStatusToWindow('update-available', {
        message: 'A new version is available!',
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
        currentVersion: app.getVersion()
      })

      // Show notification to user
      this.showUpdateAvailableDialog(info)
    })

    // Event: Update not available
    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info)
      this.isChecking = false
      this.sendStatusToWindow('update-not-available', {
        message: 'You are using the latest version.',
        version: info.version,
        currentVersion: app.getVersion()
      })
    })

    // Event: Error
    autoUpdater.on('error', (error) => {
      log.error('Update error:', error)
      this.isChecking = false
      this.isDownloading = false
      this.sendStatusToWindow('update-error', {
        message: 'Error checking for updates',
        error: error.message || String(error)
      })
    })

    // Event: Download progress
    autoUpdater.on('download-progress', (progressObj) => {
      log.info('Download progress:', progressObj)
      this.sendStatusToWindow('download-progress', {
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
        bytesPerSecond: progressObj.bytesPerSecond
      })
    })

    // Event: Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info)
      this.isDownloading = false
      this.sendStatusToWindow('update-downloaded', {
        message: 'Update downloaded. Restart to install.',
        version: info.version,
        releaseNotes: info.releaseNotes
      })

      // Show dialog to restart
      this.showUpdateDownloadedDialog(info)
    })
  }

  /**
   * Set the main window reference for sending updates
   */
  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  /**
   * Send update status to renderer process
   */
  private sendStatusToWindow(event: string, data: Record<string, unknown>): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('auto-update-status', { event, data })
    }
  }

  /**
   * Show dialog when update is available
   */
  private showUpdateAvailableDialog(info: {
    version: string
    releaseNotes?: string | string[]
  }): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return
    }

    const releaseNotes = Array.isArray(info.releaseNotes)
      ? info.releaseNotes.join('\n')
      : info.releaseNotes || 'No release notes available.'

    dialog
      .showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Update Available',
        message: `A new version (${info.version}) is available!`,
        detail: `Current version: ${app.getVersion()}\n\nRelease Notes:\n${releaseNotes}\n\nWould you like to download it now?`,
        buttons: ['Download', 'Later'],
        defaultId: 0,
        cancelId: 1
      })
      .then((result) => {
        if (result.response === 0) {
          // User clicked "Download"
          this.downloadUpdate()
        }
      })
      .catch((error) => {
        log.error('Error showing update dialog:', error)
      })
  }

  /**
   * Show dialog when update is downloaded
   */
  private showUpdateDownloadedDialog(info: { version: string }): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return
    }

    dialog
      .showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: `Version ${info.version} has been downloaded.`,
        detail:
          'The update will be installed when you restart the application.\n\nWould you like to restart now?',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1
      })
      .then((result) => {
        if (result.response === 0) {
          // User clicked "Restart Now"
          setImmediate(() => {
            autoUpdater.quitAndInstall(false, true)
          })
        }
      })
      .catch((error) => {
        log.error('Error showing restart dialog:', error)
      })
  }

  /**
   * Check for updates manually
   */
  public async checkForUpdates(): Promise<void> {
    if (this.isChecking || this.isDownloading) {
      log.info('Update check already in progress')
      return
    }

    try {
      log.info('Manual update check initiated')
      await autoUpdater.checkForUpdates()
    } catch (error) {
      log.error('Error checking for updates:', error)
      this.sendStatusToWindow('update-error', {
        message: 'Failed to check for updates',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * Check for updates automatically (silent)
   */
  public async checkForUpdatesQuietly(): Promise<void> {
    if (this.isChecking || this.isDownloading) {
      return
    }

    try {
      log.info('Automatic update check initiated')
      await autoUpdater.checkForUpdates()
    } catch (error) {
      log.error('Error in automatic update check:', error)
      // Don't show error to user for automatic checks
    }
  }

  /**
   * Download the available update
   */
  public async downloadUpdate(): Promise<void> {
    if (this.isDownloading) {
      log.info('Download already in progress')
      return
    }

    try {
      log.info('Starting update download')
      this.isDownloading = true
      this.sendStatusToWindow('download-started', {
        message: 'Downloading update...'
      })
      await autoUpdater.downloadUpdate()
    } catch (error) {
      log.error('Error downloading update:', error)
      this.isDownloading = false
      this.sendStatusToWindow('update-error', {
        message: 'Failed to download update',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * Install the downloaded update and restart
   */
  public quitAndInstall(): void {
    log.info('Quitting and installing update')
    autoUpdater.quitAndInstall(false, true)
  }

  /**
   * Start periodic update checks (every 4 hours)
   */
  public startPeriodicChecks(): void {
    if (this.updateCheckInterval) {
      return
    }

    // Check immediately on startup (after 10 seconds)
    setTimeout(() => {
      this.checkForUpdatesQuietly()
    }, 10000)

    // Check every 4 hours
    this.updateCheckInterval = setInterval(
      () => {
        this.checkForUpdatesQuietly()
      },
      4 * 60 * 60 * 1000
    ) // 4 hours in milliseconds
  }

  /**
   * Stop periodic update checks
   */
  public stopPeriodicChecks(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval)
      this.updateCheckInterval = null
    }
  }

  /**
   * Get current app version
   */
  public getCurrentVersion(): string {
    return app.getVersion()
  }

  /**
   * Check if update is available
   */
  public isUpdateAvailable(): boolean {
    return autoUpdater.currentVersion.version !== app.getVersion()
  }

  /**
   * Get update check status
   */
  public getStatus(): {
    isChecking: boolean
    isDownloading: boolean
    currentVersion: string
  } {
    return {
      isChecking: this.isChecking,
      isDownloading: this.isDownloading,
      currentVersion: app.getVersion()
    }
  }
}
