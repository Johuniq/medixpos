/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import {
  getFeatureLimitations,
  getFeaturesForRoute,
  getFeaturesForTier,
  isComponentEnabled,
  isFeatureAvailable,
  isPageAccessible,
  LICENSE_TIER_INFO,
  LicenseTier
} from '../types/featurePlans'
import { LicenseService } from './license'

/**
 * Feature Licensing Service
 * Manages feature access based on license tier using Polar licensing system
 */
export class FeatureLicensingService {
  private static instance: FeatureLicensingService
  private licenseService: LicenseService
  private currentTier: LicenseTier = 'TRIAL'

  private constructor() {
    this.licenseService = LicenseService.getInstance()
  }

  public static getInstance(): FeatureLicensingService {
    if (!FeatureLicensingService.instance) {
      FeatureLicensingService.instance = new FeatureLicensingService()
    }
    return FeatureLicensingService.instance
  }

  /**
   * Initialize feature licensing and determine current tier
   */
  public async initialize(): Promise<void> {
    await this.licenseService.whenReady()
    await this.refreshLicenseStatus()
  }

  /**
   * Refresh license status and determine tier from license key
   */
  public async refreshLicenseStatus(): Promise<void> {
    const licenseInfo = this.licenseService.getLicenseInfo()

    console.log('[FeatureLicensing] Refreshing license status', {
      isLicensed: licenseInfo.isLicensed,
      status: licenseInfo.status,
      hasLicenseKey: !!licenseInfo.licenseKey,
      licenseKeyPrefix: licenseInfo.licenseKey?.substring(0, 10)
    })

    if (!licenseInfo.isLicensed || licenseInfo.status !== 'active') {
      console.log('[FeatureLicensing] License not active, setting tier to TRIAL')
      this.currentTier = 'TRIAL'
      return
    }

    // Extract tier directly from license key if available (most reliable)
    if (licenseInfo.licenseKey) {
      this.currentTier = this.extractTierFromLicenseKey(licenseInfo.licenseKey)
      console.log('[FeatureLicensing] Extracted tier from license key:', this.currentTier)
      return
    }

    // Fallback: Get license validation details for metadata check
    const validation = await this.licenseService.validateLicense()
    if (validation.valid && validation.details) {
      this.currentTier = this.extractTierFromLicense(validation.details, licenseInfo.licenseKey)
      console.log('[FeatureLicensing] Extracted tier from validation:', this.currentTier)
    } else {
      console.log('[FeatureLicensing] No validation details, defaulting to TRIAL')
      this.currentTier = 'TRIAL'
    }
  }

  /**
   * Extract tier from license key prefix
   */
  private extractTierFromLicenseKey(licenseKey: string): LicenseTier {
    const upperKey = licenseKey.toUpperCase()
    console.log('[FeatureLicensing] Checking license key prefix:', upperKey.substring(0, 10))

    if (upperKey.startsWith('PRO_') || upperKey.startsWith('PRO-')) {
      console.log('[FeatureLicensing] Detected PRO tier from license key prefix')
      return 'PRO'
    }
    if (upperKey.startsWith('BASIC_') || upperKey.startsWith('BASIC-')) {
      console.log('[FeatureLicensing] Detected BASIC tier from license key prefix')
      return 'BASIC'
    }
    if (upperKey.startsWith('LITE_') || upperKey.startsWith('LITE-')) {
      console.log('[FeatureLicensing] Detected LITE tier from license key prefix')
      return 'LITE'
    }
    if (upperKey.startsWith('TRIAL_') || upperKey.startsWith('TRIAL-')) {
      console.log('[FeatureLicensing] Detected TRIAL tier from license key prefix')
      return 'TRIAL'
    }

    console.warn('[FeatureLicensing] No tier prefix found in license key, defaulting to TRIAL')
    return 'TRIAL'
  }

  /**
   * Extract license tier from Polar license validation response
   */
  private extractTierFromLicense(
    licenseDetails: Record<string, unknown>,
    licenseKey?: string
  ): LicenseTier {
    console.log('[FeatureLicensing] Extracting tier from license', {
      hasLicenseKey: !!licenseKey,
      licenseKeyPrefix: licenseKey?.substring(0, 15),
      hasDetails: !!licenseDetails,
      detailsKeys: Object.keys(licenseDetails)
    })

    // First priority: Check license key prefix (most reliable)
    if (licenseKey && typeof licenseKey === 'string') {
      const upperKey = licenseKey.toUpperCase()
      console.log('[FeatureLicensing] Checking license key prefix:', upperKey.substring(0, 10))

      if (upperKey.startsWith('PRO_') || upperKey.startsWith('PRO-')) {
        console.log('[FeatureLicensing] Detected PRO tier from license key prefix')
        return 'PRO'
      }
      if (upperKey.startsWith('BASIC_') || upperKey.startsWith('BASIC-')) {
        console.log('[FeatureLicensing] Detected BASIC tier from license key prefix')
        return 'BASIC'
      }
      if (upperKey.startsWith('LITE_') || upperKey.startsWith('LITE-')) {
        console.log('[FeatureLicensing] Detected LITE tier from license key prefix')
        return 'LITE'
      }
      if (upperKey.startsWith('TRIAL_') || upperKey.startsWith('TRIAL-')) {
        console.log('[FeatureLicensing] Detected TRIAL tier from license key prefix')
        return 'TRIAL'
      }
    }

    // Second priority: Check license metadata for tier information
    if (licenseDetails.meta && typeof licenseDetails.meta === 'object') {
      const meta = licenseDetails.meta as Record<string, unknown>
      if (meta.tier && typeof meta.tier === 'string') {
        const tier = meta.tier.toUpperCase() as LicenseTier
        if (['TRIAL', 'LITE', 'BASIC', 'PRO'].includes(tier)) {
          console.log('[FeatureLicensing] Detected tier from metadata:', tier)
          return tier
        }
      }
    }

    // Third priority: Check product/subscription metadata
    if (licenseDetails.subscription && typeof licenseDetails.subscription === 'object') {
      const subscription = licenseDetails.subscription as Record<string, unknown>
      if (subscription.product && typeof subscription.product === 'object') {
        const product = subscription.product as Record<string, unknown>
        if (product.name && typeof product.name === 'string') {
          const productName = product.name.toUpperCase()
          console.log('[FeatureLicensing] Checking product name:', productName)
          if (productName.includes('PRO')) {
            console.log('[FeatureLicensing] Detected PRO tier from product name')
            return 'PRO'
          }
          if (productName.includes('BASIC')) {
            console.log('[FeatureLicensing] Detected BASIC tier from product name')
            return 'BASIC'
          }
          if (productName.includes('LITE')) {
            console.log('[FeatureLicensing] Detected LITE tier from product name')
            return 'LITE'
          }
        }
      }
    }

    // Default to TRIAL if no tier found
    console.warn(
      '[FeatureLicensing] Could not determine license tier from license key or metadata, defaulting to TRIAL'
    )
    return 'TRIAL'
  }

  /**
   * Get current license tier
   */
  public getCurrentTier(): LicenseTier {
    return this.currentTier
  }

  /**
   * Get license tier information
   */
  public getCurrentTierInfo(): (typeof LICENSE_TIER_INFO)[LicenseTier] {
    return LICENSE_TIER_INFO[this.currentTier]
  }

  /**
   * Check if a feature is available for current license
   */
  public isFeatureEnabled(featureId: string): boolean {
    return isFeatureAvailable(featureId, this.currentTier)
  }

  /**
   * Check if a page is accessible for current license
   */
  public canAccessPage(route: string): boolean {
    return isPageAccessible(route, this.currentTier)
  }

  /**
   * Check if a component should be rendered for current license
   */
  public canRenderComponent(componentName: string): boolean {
    return isComponentEnabled(componentName, this.currentTier)
  }

  /**
   * Get feature limitations for current tier
   */
  public getFeatureLimitations(featureId: string): ReturnType<typeof getFeatureLimitations> {
    return getFeatureLimitations(featureId, this.currentTier)
  }

  /**
   * Get all available features for current tier
   */
  public getAvailableFeatures(): ReturnType<typeof getFeaturesForTier> {
    return getFeaturesForTier(this.currentTier)
  }

  /**
   * Get blocked features with upgrade requirements
   */
  public getBlockedFeatures(): ReturnType<typeof getFeaturesForTier> {
    const allFeatures = getFeaturesForTier('PRO') // Get all possible features
    const availableFeatures = this.getAvailableFeatures()
    const availableIds = new Set(availableFeatures.map((f) => f.id))

    return allFeatures.filter((feature) => !availableIds.has(feature.id))
  }

  /**
   * Check if user has exceeded feature limits
   */
  public async checkFeatureLimits(
    featureId: string,
    currentUsage: number
  ): Promise<{
    withinLimits: boolean
    limit?: number
    usage: number
    message?: string
  }> {
    const limitations = this.getFeatureLimitations(featureId)
    if (!limitations) {
      return { withinLimits: true, usage: currentUsage }
    }

    // Check various limits based on feature
    const checks: Array<{ limit?: number; field: string }> = [
      { limit: limitations.maxProducts, field: 'products' },
      { limit: limitations.maxCustomers, field: 'customers' },
      { limit: limitations.maxUsers, field: 'users' },
      { limit: limitations.maxSalesPerDay, field: 'daily sales' },
      { limit: limitations.maxBankAccounts, field: 'bank accounts' }
    ]

    for (const check of checks) {
      if (check.limit !== undefined && currentUsage >= check.limit) {
        return {
          withinLimits: false,
          limit: check.limit,
          usage: currentUsage,
          message: `You've reached the ${check.field} limit for ${this.currentTier} plan (${check.limit})`
        }
      }
    }

    return { withinLimits: true, usage: currentUsage }
  }

  /**
   * Get upgrade suggestions for blocked features
   */
  public getUpgradeSuggestions(featureId: string): {
    requiredTier: LicenseTier
    tierInfo: (typeof LICENSE_TIER_INFO)[LicenseTier]
    benefits: string[]
  } | null {
    const blockedFeatures = this.getBlockedFeatures()
    const feature = blockedFeatures.find((f) => f.id === featureId)

    if (!feature) return null

    const requiredTier = feature.requiredTier
    const tierInfo = LICENSE_TIER_INFO[requiredTier]

    // Get benefits of upgrading
    const currentFeatures = this.getAvailableFeatures()
    const upgradeFeatures = getFeaturesForTier(requiredTier)
    const newFeatures = upgradeFeatures.filter((f) => !currentFeatures.some((cf) => cf.id === f.id))

    return {
      requiredTier,
      tierInfo,
      benefits: newFeatures.map((f) => f.name)
    }
  }

  /**
   * Validate page access and get redirect info if blocked
   */
  public validatePageAccess(route: string): {
    allowed: boolean
    redirectTo?: string
    message?: string
    upgradeInfo?: {
      requiredTier: LicenseTier
      tierInfo: (typeof LICENSE_TIER_INFO)[LicenseTier]
      benefits: string[]
    } | null
  } {
    if (this.canAccessPage(route)) {
      return { allowed: true }
    }

    const requiredFeatures = getFeaturesForRoute(route)
    const blockedFeature = requiredFeatures.find((featureId) => !this.isFeatureEnabled(featureId))

    const upgradeInfo = blockedFeature ? this.getUpgradeSuggestions(blockedFeature) : null

    return {
      allowed: false,
      redirectTo: '/',
      message: `This feature requires ${upgradeInfo?.requiredTier || 'a higher'} plan`,
      upgradeInfo
    }
  }

  /**
   * Get license status for UI display
   */
  public getLicenseStatus(): {
    isActive: boolean
    tier: LicenseTier
    tierInfo: (typeof LICENSE_TIER_INFO)[LicenseTier]
    expiresAt?: string
    daysRemaining?: number
  } {
    const licenseInfo = this.licenseService.getLicenseInfo()

    let daysRemaining: number | undefined
    if (licenseInfo.expiresAt) {
      const expiryDate = new Date(licenseInfo.expiresAt)
      const now = new Date()
      const diffTime = expiryDate.getTime() - now.getTime()
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    return {
      isActive: licenseInfo.isLicensed && licenseInfo.status === 'active',
      tier: this.currentTier,
      tierInfo: this.getCurrentTierInfo(),
      expiresAt: licenseInfo.expiresAt,
      daysRemaining
    }
  }

  /**
   * Force refresh license status (useful after license changes)
   */
  public async forceRefresh(): Promise<void> {
    // Force revalidation of license
    await this.licenseService.validateLicense()
    await this.refreshLicenseStatus()
  }
}
