/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Polar } from '@polar-sh/sdk'
import crypto from 'crypto'
import { app } from 'electron'
import { machineId } from 'node-machine-id'

// Use require for electron-store to avoid ESM/CJS issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ElectronStore = require('electron-store')
const Store = ElectronStore.default || ElectronStore

/**
 * License configuration stored securely with encryption
 */
type LicenseStatus = 'active' | 'expired' | 'invalid' | 'inactive'

interface LicenseConfig {
  licenseKey?: string
  activationId?: string
  organizationId: string
  lastValidated?: string
  expiresAt?: string
  status?: LicenseStatus
  validations?: number
  usage?: number
  limitUsage?: number
  machineId?: string
  signature?: string
}

/**
 * License validation response
 */
interface LicenseValidationResponse {
  valid: boolean
  status: LicenseStatus
  expiresAt?: string
  usage?: number
  limitUsage?: number
  message?: string
  details?: Record<string, unknown>
}

type KeytarModule = typeof import('keytar')

/**
 * Secure License service for managing Polar.sh license keys
 *
 * Security Features:
 * 1. Encrypted storage using electron-store
 * 2. Hardware fingerprinting (machine ID binding)
 * 3. HMAC signature validation to prevent tampering
 * 4. Anti-debugging detection
 * 5. Periodic online validation
 * 6. Secure logging (no sensitive data in production)
 *
 * Uses Customer Portal API (unauthenticated endpoints) which are designed
 * for public client applications like desktop apps.
 *
 * See: https://polar.sh/docs/api-reference/customer-portal/license-keys
 */
export class LicenseService {
  private static instance: LicenseService

  /**
   * Your Polar Organization ID (UUID format)
   * In production, this should come from environment variable
   * Get this from: https://polar.sh/dashboard/[your-org]/settings
   */
  private readonly ORGANIZATION_ID =
    process.env.POLAR_ORG_ID || '9cce1897-ade4-4777-81fb-e40048b6a22d'
  private readonly KEYTAR_SERVICE = 'medixpos-license'
  private readonly KEYTAR_ENCRYPTION_ACCOUNT = 'secure-storage'
  private readonly KEYTAR_HMAC_ACCOUNT = 'integrity-key'

  private store: typeof Store | null = null
  private licenseConfig: LicenseConfig = { organizationId: this.ORGANIZATION_ID }
  private polar: Polar
  private keytar: KeytarModule | null = null
  private currentMachineId: string = ''
  private cachedHmacSecret: string | null = null
  private encryptionKey: string | null = null
  private lastTamperCheck: number = 0
  private readonly readyPromise: Promise<void>

  private constructor() {
    this.polar = new Polar()
    this.readyPromise = this.initialize()
    this.startTamperDetection()
  }

  public static getInstance(): LicenseService {
    if (!LicenseService.instance) {
      LicenseService.instance = new LicenseService()
    }
    return LicenseService.instance
  }

  public async whenReady(): Promise<void> {
    await this.readyPromise
  }

  public hasStoredLicense(): boolean {
    return !!this.licenseConfig.licenseKey
  }

  private async initialize(): Promise<void> {
    try {
      await this.loadKeytar()
      this.encryptionKey = await this.getOrCreateEncryptionKey()
      this.store = new Store({
        name: 'license',
        encryptionKey: this.encryptionKey,
        clearInvalidConfig: true,
        schema: {
          organizationId: { type: 'string' },
          licenseKey: { type: 'string' },
          activationId: { type: 'string' },
          lastValidated: { type: 'string' },
          expiresAt: { type: 'string' },
          status: { type: 'string' },
          machineId: { type: 'string' },
          signature: { type: 'string' }
        }
      })
      this.licenseConfig = await this.loadConfig()
    } catch (error) {
      this.secureLog('error', 'License service initialization failed', error)
      this.store = new Store({ name: 'license-fallback', clearInvalidConfig: true })
      this.licenseConfig = { organizationId: this.ORGANIZATION_ID }
    }
  }

  private async loadKeytar(): Promise<void> {
    if (this.keytar !== null) {
      return
    }

    try {
      const module = await import('keytar')
      this.keytar = module.default ?? module
    } catch (error) {
      this.keytar = null
      this.secureLog('warn', 'Keytar unavailable, falling back to derived secrets', error)
    }
  }

  private async getOrCreateEncryptionKey(): Promise<string> {
    const envKey = process.env.MEDIXPOS_LICENSE_ENC_KEY
    if (envKey && envKey.length >= 32) {
      return envKey
    }

    const machine = await this.getMachineId()

    if (this.keytar) {
      try {
        const account = `${machine}-${this.KEYTAR_ENCRYPTION_ACCOUNT}`
        const existing = await this.keytar.getPassword(this.KEYTAR_SERVICE, account)
        if (existing) {
          return existing
        }

        const newKey = crypto.randomBytes(32).toString('hex')
        await this.keytar.setPassword(this.KEYTAR_SERVICE, account, newKey)
        return newKey
      } catch (error) {
        this.secureLog('warn', 'Failed to access system credential store', error)
      }
    }

    return crypto.createHash('sha256').update(`${machine}|${this.ORGANIZATION_ID}`).digest('hex')
  }

  private async getHmacSecret(): Promise<string> {
    if (this.cachedHmacSecret) {
      return this.cachedHmacSecret
    }

    const envSecret = process.env.POLAR_LICENSE_SECRET
    if (envSecret && envSecret.length >= 32) {
      this.cachedHmacSecret = envSecret
      return envSecret
    }

    const machine = await this.getMachineId()

    if (this.keytar) {
      try {
        const account = `${machine}-${this.KEYTAR_HMAC_ACCOUNT}`
        const existing = await this.keytar.getPassword(this.KEYTAR_SERVICE, account)
        if (existing) {
          this.cachedHmacSecret = existing
          return existing
        }

        const derived = crypto.randomBytes(32).toString('hex')
        await this.keytar.setPassword(this.KEYTAR_SERVICE, account, derived)
        this.cachedHmacSecret = derived
        return derived
      } catch (error) {
        this.secureLog('warn', 'Failed to persist HMAC secret to credential store', error)
      }
    }

    const fallback = crypto
      .createHash('sha256')
      .update(`${machine}|${this.encryptionKey ?? ''}|medixpos`)
      .digest('hex')
    this.cachedHmacSecret = fallback
    return fallback
  }

  /**
   * Get machine ID (hardware fingerprint)
   */
  private async getMachineId(): Promise<string> {
    if (this.currentMachineId) {
      return this.currentMachineId
    }

    try {
      this.currentMachineId = await machineId()
      return this.currentMachineId
    } catch {
      this.secureLog('error', 'Failed to get machine ID')
      // Fallback to a hash of system info
      const systemInfo = `${process.platform}-${process.arch}-${app.getPath('userData')}`
      this.currentMachineId = crypto.createHash('sha256').update(systemInfo).digest('hex')
      return this.currentMachineId
    }
  }

  /**
   * Generate HMAC signature for license data
   */
  private async generateSignature(data: Partial<LicenseConfig>): Promise<string> {
    const secret = await this.getHmacSecret()
    const payload = JSON.stringify({
      licenseKey: data.licenseKey,
      activationId: data.activationId,
      expiresAt: data.expiresAt,
      machineId: data.machineId
    })

    return crypto.createHmac('sha256', secret).update(payload).digest('hex')
  }

  /**
   * Verify HMAC signature
   */
  private async verifySignature(data: LicenseConfig): Promise<boolean> {
    if (!data.signature) {
      return false
    }

    const expectedSignature = await this.generateSignature(data)
    return crypto.timingSafeEqual(Buffer.from(data.signature), Buffer.from(expectedSignature))
  }

  /**
   * Secure logging - strips sensitive data in production
   */
  private secureLog(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      console[level](`[License] ${message}`, data || '')
    } else {
      // In production, only log errors without sensitive data
      if (level === 'error') {
        console.error(`[License] ${message}`)
      }
    }
  }

  /**
   * Anti-tampering detection
   */
  private startTamperDetection(): void {
    // Check for debugger
    setInterval(() => {
      this.detectDebugger()
      this.checkIntegrity()
    }, 30000) // Every 30 seconds
  }

  /**
   * Detect if debugger is attached
   */
  private detectDebugger(): void {
    const now = Date.now()
    if (now - this.lastTamperCheck < 100) {
      // Debugger might be attached (execution too slow)
      this.secureLog('warn', 'Potential tampering detected')
    }
    this.lastTamperCheck = now
  }

  /**
   * Check app integrity
   */
  private checkIntegrity(): void {
    // Check if critical functions are still intact
    if (typeof this.validateLicense !== 'function' || typeof this.verifySignature !== 'function') {
      this.secureLog('error', 'Critical function tampering detected')
      void this.clearLicense()
    }
  }

  /**
   * Load license config from encrypted store
   */
  private async loadConfig(): Promise<LicenseConfig> {
    try {
      if (!this.store) {
        return { organizationId: this.ORGANIZATION_ID }
      }

      const config = this.store.store as LicenseConfig

      if (Object.keys(config).length > 0) {
        // Verify signature to ensure data hasn't been tampered with
        if (config.signature && !(await this.verifySignature(config))) {
          this.secureLog('warn', 'License signature verification failed - possible tampering')
          // Clear potentially tampered data
          this.store.clear()
          return { organizationId: this.ORGANIZATION_ID }
        }

        return config
      }
    } catch (error) {
      this.secureLog('error', 'Error loading license config', error)
    }

    return {
      organizationId: this.ORGANIZATION_ID
    }
  }

  /**
   * Save license config to encrypted store with signature
   */
  private async saveConfig(): Promise<void> {
    try {
      if (!this.store) {
        throw new Error('License store not initialized')
      }

      // Add machine ID if not present
      if (!this.licenseConfig.machineId) {
        this.licenseConfig.machineId = await this.getMachineId()
      }

      // Generate signature
      this.licenseConfig.signature = await this.generateSignature(this.licenseConfig)

      // Save to encrypted store
      this.store.store = this.licenseConfig
    } catch (error) {
      this.secureLog('error', 'Error saving license config', error)
    }
  }

  /**
   * Validate license key with Polar Customer Portal API using TypeScript SDK
   * This endpoint doesn't require authentication and can be safely used in desktop apps
   */
  public async validateLicense(
    licenseKey?: string,
    activationId?: string
  ): Promise<LicenseValidationResponse> {
    try {
      await this.whenReady()
      const keyToValidate = licenseKey || this.licenseConfig.licenseKey
      const activationToValidate = activationId || this.licenseConfig.activationId

      if (!keyToValidate) {
        return {
          valid: false,
          status: 'inactive',
          message: 'No license key provided'
        }
      }

      // Get machine ID for hardware binding
      const currentMachineId = await this.getMachineId()

      // Verify machine ID matches if license is already activated
      if (this.licenseConfig.machineId && this.licenseConfig.machineId !== currentMachineId) {
        this.secureLog('warn', 'Machine ID mismatch - license bound to different hardware')
        return {
          valid: false,
          status: 'invalid',
          message: 'License is bound to different hardware'
        }
      }

      this.secureLog('info', 'Validating license', {
        hasKey: !!keyToValidate,
        hasActivationId: !!activationToValidate
      })

      // If no activation ID and this is a new license key, try to activate first
      let finalActivationId = activationToValidate
      if (!finalActivationId && licenseKey) {
        this.secureLog('info', 'No activation ID found. Attempting to activate license...')
        try {
          const activation = await this.polar.customerPortal.licenseKeys.activate({
            key: keyToValidate,
            organizationId: this.ORGANIZATION_ID,
            label: `MedixPOS-${currentMachineId.substring(0, 8)}`,
            meta: {
              appVersion: app.getVersion(),
              platform: process.platform,
              arch: process.arch,
              machineId: currentMachineId,
              activatedAt: new Date().toISOString()
            }
          })
          finalActivationId = activation.id
          this.secureLog('info', 'License activated successfully')
        } catch {
          this.secureLog('warn', 'Activation not required or failed')
          // Continue without activation - might not be required
        }
      }

      // Check if we need to validate with API (only once per day to avoid excessive usage)
      const shouldValidateWithAPI =
        !this.licenseConfig.lastValidated ||
        licenseKey || // New license key provided
        activationId || // New activation ID provided
        Date.now() - new Date(this.licenseConfig.lastValidated).getTime() > 24 * 60 * 60 * 1000 // 24 hours

      // If we recently validated and have a cached status, return it
      if (!shouldValidateWithAPI && this.licenseConfig.status) {
        this.secureLog('info', 'Using cached license validation', {
          status: this.licenseConfig.status,
          lastValidated: this.licenseConfig.lastValidated
        })

        const isExpired =
          this.licenseConfig.expiresAt && new Date(this.licenseConfig.expiresAt) < new Date()

        return {
          valid: this.licenseConfig.status === 'active' && !isExpired,
          status: isExpired ? 'expired' : this.licenseConfig.status,
          expiresAt: this.licenseConfig.expiresAt,
          message: isExpired ? 'License has expired' : 'License is valid (cached)'
        }
      }

      // Use Polar SDK to validate the license
      // NOTE: Only increment usage when first activating, not on every validation
      const data = await this.polar.customerPortal.licenseKeys.validate({
        key: keyToValidate,
        organizationId: this.ORGANIZATION_ID,
        activationId: finalActivationId || undefined,
        incrementUsage: licenseKey && !this.licenseConfig.licenseKey ? 1 : 0 // Only increment on new activation
      })

      if (!data) {
        return {
          valid: false,
          status: 'invalid',
          message: 'License validation failed'
        }
      }

      // Check license status
      const isExpired = data.expiresAt && new Date(data.expiresAt) < new Date()
      const usageLimitExceeded = data.limitUsage !== null && data.usage >= data.limitUsage

      let status: LicenseStatus = 'active'
      let message = 'License is valid and active'

      if (isExpired) {
        status = 'expired'
        message = 'License has expired'
      } else if (usageLimitExceeded) {
        status = 'invalid'
        message = 'License usage limit exceeded'
      } else if (data.status !== 'granted') {
        status = 'inactive'
        message = 'License is not active'
      }

      // Update config with hardware binding
      this.licenseConfig = {
        ...this.licenseConfig,
        licenseKey: licenseKey || this.licenseConfig.licenseKey,
        activationId: finalActivationId || activationToValidate,
        lastValidated: new Date().toISOString(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
        status: status,
        validations: data.validations,
        usage: data.usage,
        limitUsage: data.limitUsage || undefined,
        machineId: currentMachineId
      }
      await this.saveConfig()

      return {
        valid: status === 'active',
        status: status,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
        usage: data.usage,
        limitUsage: data.limitUsage || undefined,
        message: message,
        details: data as unknown as Record<string, unknown>
      }
    } catch (error) {
      this.secureLog('error', 'License validation error', error)
      return {
        valid: false,
        status: 'invalid',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Activate license key (if activation limits are enabled)
   * This endpoint doesn't require authentication and can be safely used in desktop apps
   */
  public async activateLicense(
    licenseKey: string,
    label?: string
  ): Promise<{ success: boolean; activationId?: string; message?: string }> {
    try {
      await this.whenReady()
      // Get machine ID for hardware binding
      const currentMachineId = await this.getMachineId()

      // Use Polar SDK to activate the license
      const data = await this.polar.customerPortal.licenseKeys.activate({
        key: licenseKey,
        organizationId: this.ORGANIZATION_ID,
        label: label || `MedixPOS-${currentMachineId.substring(0, 8)}`,
        meta: {
          appVersion: app.getVersion(),
          platform: process.platform,
          arch: process.arch,
          machineId: currentMachineId,
          activatedAt: new Date().toISOString()
        }
      })

      // Save activation ID and bind to machine
      this.licenseConfig.activationId = data.id
      this.licenseConfig.licenseKey = licenseKey
      this.licenseConfig.machineId = currentMachineId
      await this.saveConfig()

      this.secureLog('info', 'License activated and bound to hardware')

      return {
        success: true,
        activationId: data.id,
        message: 'License activated successfully'
      }
    } catch (error) {
      this.secureLog('error', 'License activation error', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Deactivate current license activation
   * This endpoint doesn't require authentication and can be safely used in desktop apps
   */
  public async deactivateLicense(): Promise<{ success: boolean; message?: string }> {
    try {
      await this.whenReady()
      if (!this.licenseConfig.licenseKey || !this.licenseConfig.activationId) {
        return {
          success: false,
          message: 'No active license to deactivate'
        }
      }

      // Use Polar SDK to deactivate the license
      await this.polar.customerPortal.licenseKeys.deactivate({
        key: this.licenseConfig.licenseKey,
        organizationId: this.ORGANIZATION_ID,
        activationId: this.licenseConfig.activationId
      })

      // Clear license config
      await this.clearLicense()

      this.secureLog('info', 'License deactivated successfully')

      return {
        success: true,
        message: 'License deactivated successfully'
      }
    } catch (error) {
      this.secureLog('error', 'License deactivation error', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get current license information
   */
  public getLicenseInfo(): {
    isLicensed: boolean
    status?: string
    expiresAt?: string
    lastValidated?: string
    usage?: number
    limitUsage?: number
  } {
    return {
      isLicensed: !!this.licenseConfig.licenseKey,
      status: this.licenseConfig.status,
      expiresAt: this.licenseConfig.expiresAt,
      lastValidated: this.licenseConfig.lastValidated,
      usage: this.licenseConfig.usage,
      limitUsage: this.licenseConfig.limitUsage
    }
  }

  /**
   * Check if license needs revalidation (every 24 hours)
   */
  public needsRevalidation(): boolean {
    if (!this.licenseConfig.lastValidated) return true

    const lastValidated = new Date(this.licenseConfig.lastValidated)
    const now = new Date()
    const hoursSinceValidation = (now.getTime() - lastValidated.getTime()) / (1000 * 60 * 60)

    return hoursSinceValidation >= 24
  }

  /**
   * Clear license (for removing license)
   */
  public async clearLicense(): Promise<void> {
    await this.whenReady()
    this.licenseConfig = {
      organizationId: this.ORGANIZATION_ID
    }
    this.cachedHmacSecret = null
    if (this.store) {
      this.store.clear()
    }
  }

  /**
   * Get machine ID for display/verification
   */
  public async getMachineIdForDisplay(): Promise<string> {
    await this.whenReady()
    const id = await this.getMachineId()
    // Return first 8 characters for display
    return id.substring(0, 8).toUpperCase()
  }
}
