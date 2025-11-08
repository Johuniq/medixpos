/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { eq, like, or } from 'drizzle-orm'
import { ipcMain } from 'electron'
import { getDatabase } from '../../database'
import * as schema from '../../database/schema'

/**
 * Barcode validation and format detection
 */
const BARCODE_PATTERNS = {
  EAN13: /^\d{13}$/,
  UPCA: /^\d{12}$/,
  CODE128: /^[\x20-\x7F]{1,128}$/,
  CODE39: /^[0-9A-Z\-.$/+%]{1,}$/
}

interface BarcodeValidationResult {
  isValid: boolean
  format?: string
  cleaned?: string
  error?: string
}

/**
 * Validate and detect barcode format
 */
function validateBarcode(barcode: string): BarcodeValidationResult {
  if (!barcode || barcode.length === 0) {
    return { isValid: false, error: 'Empty barcode' }
  }

  // Remove common prefixes/suffixes
  const cleaned = barcode.trim()

  // Check EAN-13 (most common for medicines)
  if (BARCODE_PATTERNS.EAN13.test(cleaned)) {
    // Validate EAN-13 checksum
    const digits = cleaned.split('').map(Number)
    const checksum = digits.pop()!
    const sum = digits.reduce((acc, digit, idx) => {
      return acc + digit * (idx % 2 === 0 ? 1 : 3)
    }, 0)
    const calculatedChecksum = (10 - (sum % 10)) % 10

    if (checksum === calculatedChecksum) {
      return { isValid: true, format: 'EAN-13', cleaned }
    }
    return { isValid: false, error: 'Invalid EAN-13 checksum' }
  }

  // Check UPC-A
  if (BARCODE_PATTERNS.UPCA.test(cleaned)) {
    // Validate UPC-A checksum
    const digits = cleaned.split('').map(Number)
    const checksum = digits.pop()!
    const sum = digits.reduce((acc, digit, idx) => {
      return acc + digit * (idx % 2 === 0 ? 3 : 1)
    }, 0)
    const calculatedChecksum = (10 - (sum % 10)) % 10

    if (checksum === calculatedChecksum) {
      return { isValid: true, format: 'UPC-A', cleaned }
    }
    return { isValid: false, error: 'Invalid UPC-A checksum' }
  }

  // Check Code 128
  if (BARCODE_PATTERNS.CODE128.test(cleaned)) {
    return { isValid: true, format: 'CODE-128', cleaned }
  }

  // Check Code 39
  if (BARCODE_PATTERNS.CODE39.test(cleaned)) {
    return { isValid: true, format: 'CODE-39', cleaned }
  }

  return { isValid: false, error: 'Unknown barcode format' }
}

/**
 * Register barcode-related IPC handlers
 */
export function registerBarcodeHandlers(): void {
  // Validate barcode format
  ipcMain.handle('barcode:validate', async (_, barcode: string) => {
    try {
      const result = validateBarcode(barcode)
      return { success: true, data: result }
    } catch (error) {
      console.error('Error validating barcode:', error)
      return { success: false, error: 'Failed to validate barcode' }
    }
  })

  // Search product by barcode
  ipcMain.handle('barcode:searchProduct', async (_, barcode: string) => {
    try {
      const db = getDatabase()
      const validation = validateBarcode(barcode)

      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error || 'Invalid barcode format'
        }
      }

      const cleanedBarcode = validation.cleaned!

      // Search for product by barcode
      const product = db
        .select({
          id: schema.products.id,
          name: schema.products.name,
          barcode: schema.products.barcode,
          sellingPrice: schema.products.sellingPrice,
          costPrice: schema.products.costPrice,
          taxRate: schema.products.taxRate,
          categoryId: schema.products.categoryId,
          unit: schema.products.unit,
          manufacturer: schema.products.manufacturer,
          strength: schema.products.strength,
          isActive: schema.products.isActive,
          prescriptionRequired: schema.products.prescriptionRequired
        })
        .from(schema.products)
        .where(
          or(
            eq(schema.products.barcode, cleanedBarcode),
            eq(schema.products.barcode, barcode), // Try original too
            like(schema.products.barcode, `%${cleanedBarcode}%`)
          )
        )
        .get()

      if (!product) {
        return {
          success: false,
          error: 'Product not found',
          barcode: cleanedBarcode,
          format: validation.format
        }
      }

      // Get inventory information
      const inventory = db
        .select()
        .from(schema.inventory)
        .where(eq(schema.inventory.productId, product.id))
        .get()

      return {
        success: true,
        data: {
          product,
          inventory,
          barcode: cleanedBarcode,
          format: validation.format
        }
      }
    } catch (error) {
      console.error('Error searching product by barcode:', error)
      return { success: false, error: 'Failed to search product' }
    }
  })

  // Get barcode scanner settings
  ipcMain.handle('barcode:getSettings', async () => {
    try {
      const db = getDatabase()
      const settings = db
        .select()
        .from(schema.settings)
        .where(like(schema.settings.key, 'barcode_%'))
        .all()

      const settingsMap = settings.reduce(
        (acc, setting) => {
          acc[setting.key] = setting.value
          return acc
        },
        {} as Record<string, string>
      )

      // Default settings
      const defaults = {
        barcode_enabled: settingsMap.barcode_enabled || 'true',
        barcode_prefix: settingsMap.barcode_prefix || '',
        barcode_suffix: settingsMap.barcode_suffix || '',
        barcode_timeout: settingsMap.barcode_timeout || '100',
        barcode_min_length: settingsMap.barcode_min_length || '8',
        barcode_beep_enabled: settingsMap.barcode_beep_enabled || 'true',
        barcode_auto_add_to_cart: settingsMap.barcode_auto_add_to_cart || 'true',
        barcode_supported_formats: settingsMap.barcode_supported_formats || 'EAN-13,UPC-A,CODE-128'
      }

      return { success: true, data: defaults }
    } catch (error) {
      console.error('Error getting barcode settings:', error)
      return { success: false, error: 'Failed to get settings' }
    }
  })

  // Update barcode scanner settings
  ipcMain.handle('barcode:updateSettings', async (_, settings: Record<string, string>) => {
    try {
      const db = getDatabase()
      for (const [key, value] of Object.entries(settings)) {
        // Check if setting exists
        const existing = db.select().from(schema.settings).where(eq(schema.settings.key, key)).get()

        if (existing) {
          // Update existing
          db.update(schema.settings)
            .set({ value, updatedAt: new Date().toISOString() })
            .where(eq(schema.settings.key, key))
            .run()
        } else {
          // Insert new
          db.insert(schema.settings)
            .values({
              id: crypto.randomUUID(),
              key,
              value,
              updatedAt: new Date().toISOString()
            })
            .run()
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Error updating barcode settings:', error)
      return { success: false, error: 'Failed to update settings' }
    }
  })

  // Test barcode scanner
  ipcMain.handle('barcode:test', async (_, testBarcode: string) => {
    try {
      const validation = validateBarcode(testBarcode)

      // Get search result manually
      const db = getDatabase()
      let searchResult: {
        product: (typeof schema.products)['$inferSelect']
        inventory?: (typeof schema.inventory)['$inferSelect']
      } | null = null

      if (validation.isValid) {
        const product = db
          .select()
          .from(schema.products)
          .where(eq(schema.products.barcode, validation.cleaned!))
          .get()

        if (product) {
          const inventory = db
            .select()
            .from(schema.inventory)
            .where(eq(schema.inventory.productId, product.id))
            .get()

          searchResult = { product, inventory }
        }
      }

      return {
        success: true,
        data: {
          validation,
          searchResult,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Error testing barcode:', error)
      return { success: false, error: 'Failed to test barcode' }
    }
  })

  // Get barcode scan history (for debugging)
  ipcMain.handle('barcode:getHistory', async () => {
    try {
      // This would typically come from a barcode_scans table
      // For now, we'll return an empty array
      // TODO: Create barcode_scans table for audit trail
      return { success: true, data: [] }
    } catch (error) {
      console.error('Error getting barcode history:', error)
      return { success: false, error: 'Failed to get history' }
    }
  })

  // Bulk barcode validation (for testing multiple barcodes)
  ipcMain.handle('barcode:bulkValidate', async (_, barcodes: string[]) => {
    try {
      const results = barcodes.map((barcode) => ({
        barcode,
        ...validateBarcode(barcode)
      }))

      return { success: true, data: results }
    } catch (error) {
      console.error('Error bulk validating barcodes:', error)
      return { success: false, error: 'Failed to validate barcodes' }
    }
  })
}
