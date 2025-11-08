/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

interface BarcodeScannerSettings {
  enabled: boolean
  prefix: string
  suffix: string
  timeout: number
  minLength: number
  beepEnabled: boolean
  autoAddToCart: boolean
  supportedFormats: string[]
}

interface BarcodeResult {
  barcode: string
  product?: unknown
  inventory?: unknown
  format?: string
  timestamp: number
}

interface UseBarcodeScanner {
  isScanning: boolean
  lastScan: BarcodeResult | null
  settings: BarcodeScannerSettings | null
  updateSettings: (newSettings: Partial<BarcodeScannerSettings>) => Promise<void>
  testBarcode: (barcode: string) => Promise<void>
  manualScan: (barcode: string) => Promise<BarcodeResult | null>
  clearBuffer: () => void
}

const DEFAULT_SETTINGS: BarcodeScannerSettings = {
  enabled: true,
  prefix: '',
  suffix: '',
  timeout: 100,
  minLength: 8,
  beepEnabled: true,
  autoAddToCart: true,
  supportedFormats: ['EAN-13', 'UPC-A', 'CODE-128']
}

/**
 * Hook for barcode scanner functionality
 * Listens for keyboard wedge input from USB barcode scanners
 */
export function useBarcodeScanner(
  onScan?: (result: BarcodeResult) => void,
  enabled = true
): UseBarcodeScanner {
  const [isScanning, setIsScanning] = useState(false)
  const [lastScan, setLastScan] = useState<BarcodeResult | null>(null)
  const [settings, setSettings] = useState<BarcodeScannerSettings | null>(null)

  // Buffer for barcode characters
  const buffer = useRef<string>('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastKeyTime = useRef<number>(0)

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async (): Promise<void> => {
    try {
      const result = await window.api.barcode.getSettings()
      if (result.success && result.data) {
        const loadedSettings: BarcodeScannerSettings = {
          enabled: result.data.barcode_enabled === 'true',
          prefix: result.data.barcode_prefix || '',
          suffix: result.data.barcode_suffix || '',
          timeout: parseInt(result.data.barcode_timeout || '100'),
          minLength: parseInt(result.data.barcode_min_length || '8'),
          beepEnabled: result.data.barcode_beep_enabled === 'true',
          autoAddToCart: result.data.barcode_auto_add_to_cart === 'true',
          supportedFormats: (
            result.data.barcode_supported_formats || 'EAN-13,UPC-A,CODE-128'
          ).split(',')
        }
        setSettings(loadedSettings)
      } else {
        setSettings(DEFAULT_SETTINGS)
      }
    } catch (error) {
      console.error('Error loading barcode settings:', error)
      setSettings(DEFAULT_SETTINGS)
    }
  }

  const updateSettings = async (newSettings: Partial<BarcodeScannerSettings>): Promise<void> => {
    try {
      const updatedSettings = { ...settings, ...newSettings } as BarcodeScannerSettings

      // Convert to database format
      const dbSettings: Record<string, string> = {
        barcode_enabled: updatedSettings.enabled ? 'true' : 'false',
        barcode_prefix: updatedSettings.prefix || '',
        barcode_suffix: updatedSettings.suffix || '',
        barcode_timeout: updatedSettings.timeout.toString(),
        barcode_min_length: updatedSettings.minLength.toString(),
        barcode_beep_enabled: updatedSettings.beepEnabled ? 'true' : 'false',
        barcode_auto_add_to_cart: updatedSettings.autoAddToCart ? 'true' : 'false',
        barcode_supported_formats: updatedSettings.supportedFormats.join(',')
      }

      const result = await window.api.barcode.updateSettings(dbSettings)

      if (result.success) {
        setSettings(updatedSettings)
        toast.success('Barcode scanner settings updated')
      } else {
        toast.error('Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating barcode settings:', error)
      toast.error('Failed to update settings')
    }
  }

  const clearBuffer = useCallback(() => {
    buffer.current = ''
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const playBeep = useCallback(() => {
    if (settings?.beepEnabled) {
      // Create a short beep sound
      const audioContext = new (window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.value = 0.1

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.1)
    }
  }, [settings?.beepEnabled])

  const processBarcode = useCallback(
    async (rawBarcode: string): Promise<BarcodeResult | null> => {
      try {
        setIsScanning(true)

        // Remove prefix/suffix if configured
        let cleanedBarcode = rawBarcode
        if (settings?.prefix && cleanedBarcode.startsWith(settings.prefix)) {
          cleanedBarcode = cleanedBarcode.substring(settings.prefix.length)
        }
        if (settings?.suffix && cleanedBarcode.endsWith(settings.suffix)) {
          cleanedBarcode = cleanedBarcode.substring(
            0,
            cleanedBarcode.length - settings.suffix.length
          )
        }

        // Validate and search product
        const result = await window.api.barcode.searchProduct(cleanedBarcode)

        if (result.success && result.data) {
          const barcodeResult: BarcodeResult = {
            barcode: result.data.barcode,
            product: result.data.product,
            inventory: result.data.inventory,
            format: result.data.format,
            timestamp: Date.now()
          }

          setLastScan(barcodeResult)
          playBeep()

          if (onScan) {
            onScan(barcodeResult)
          }

          return barcodeResult
        } else {
          // Product not found
          toast.error(`Product not found for barcode: ${cleanedBarcode}`)
          // Still play beep to indicate scan was detected
          playBeep()
          return null
        }
      } catch (error) {
        console.error('Error processing barcode:', error)
        toast.error('Failed to process barcode scan')
        return null
      } finally {
        setIsScanning(false)
        clearBuffer()
      }
    },
    [settings, onScan, playBeep, clearBuffer]
  )

  const manualScan = useCallback(
    async (barcode: string): Promise<BarcodeResult | null> => {
      return processBarcode(barcode)
    },
    [processBarcode]
  )

  const testBarcode = useCallback(async (barcode: string): Promise<void> => {
    try {
      const result = await window.api.barcode.test(barcode)
      if (result.success && result.data) {
        const { validation, searchResult } = result.data

        if (validation.isValid) {
          toast.success(
            `Valid ${validation.format} barcode${searchResult ? ' - Product found!' : ' - No product found'}`
          )
        } else {
          toast.error(`Invalid barcode: ${validation.error}`)
        }
      } else {
        toast.error('Failed to test barcode')
      }
    } catch (error) {
      console.error('Error testing barcode:', error)
      toast.error('Failed to test barcode')
    }
  }, [])

  // Keyboard event listener for barcode scanner
  useEffect(() => {
    if (!enabled || !settings?.enabled) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      const now = Date.now()
      const timeDiff = now - lastKeyTime.current
      lastKeyTime.current = now

      // Check if this is rapid typing (typical of barcode scanner)
      if (timeDiff > settings.timeout && buffer.current.length > 0) {
        // Timeout exceeded, clear buffer
        clearBuffer()
      }

      // Handle Enter key (end of barcode)
      if (event.key === 'Enter') {
        event.preventDefault()
        event.stopPropagation()

        if (buffer.current.length >= settings.minLength) {
          processBarcode(buffer.current)
        } else {
          clearBuffer()
        }
        return
      }

      // Ignore special keys
      if (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.key.length > 1 ||
        event.key === 'Shift'
      ) {
        return
      }

      // Add character to buffer
      buffer.current += event.key

      // Set timeout to clear buffer if no more characters come
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        clearBuffer()
      }, settings.timeout)
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, settings, processBarcode, clearBuffer])

  return {
    isScanning,
    lastScan,
    settings,
    updateSettings,
    testBarcode,
    manualScan,
    clearBuffer
  }
}
