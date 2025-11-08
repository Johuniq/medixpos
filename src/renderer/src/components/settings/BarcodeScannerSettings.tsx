/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { BugReport, QrCodeScanner } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  TextField,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function BarcodeScannerSettings(): React.JSX.Element {
  const [settings, setSettings] = useState({
    enabled: true,
    prefix: '',
    suffix: '',
    timeout: 100,
    minLength: 8,
    beepEnabled: true,
    autoAddToCart: true,
    supportedFormats: 'EAN-13,UPC-A,CODE-128'
  })

  const [testBarcode, setTestBarcode] = useState('')
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async (): Promise<void> => {
    try {
      const result = await window.api.barcode.getSettings()
      if (result.success && result.data) {
        setSettings({
          enabled: result.data.barcode_enabled === 'true',
          prefix: result.data.barcode_prefix || '',
          suffix: result.data.barcode_suffix || '',
          timeout: parseInt(result.data.barcode_timeout || '100'),
          minLength: parseInt(result.data.barcode_min_length || '8'),
          beepEnabled: result.data.barcode_beep_enabled === 'true',
          autoAddToCart: result.data.barcode_auto_add_to_cart === 'true',
          supportedFormats: result.data.barcode_supported_formats || 'EAN-13,UPC-A,CODE-128'
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Failed to load barcode scanner settings')
    }
  }

  const saveSettings = async (): Promise<void> => {
    try {
      setSaving(true)
      const dbSettings = {
        barcode_enabled: settings.enabled ? 'true' : 'false',
        barcode_prefix: settings.prefix,
        barcode_suffix: settings.suffix,
        barcode_timeout: settings.timeout.toString(),
        barcode_min_length: settings.minLength.toString(),
        barcode_beep_enabled: settings.beepEnabled ? 'true' : 'false',
        barcode_auto_add_to_cart: settings.autoAddToCart ? 'true' : 'false',
        barcode_supported_formats: settings.supportedFormats
      }

      const result = await window.api.barcode.updateSettings(dbSettings)
      if (result.success) {
        toast.success('Barcode scanner settings saved')
      } else {
        toast.error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (): Promise<void> => {
    if (!testBarcode) {
      toast.error('Please enter a barcode to test')
      return
    }

    try {
      setTesting(true)
      const result = await window.api.barcode.test(testBarcode)

      if (result.success && result.data) {
        const { validation, searchResult } = result.data

        if (validation.isValid) {
          if (searchResult && searchResult.product) {
            toast.success(
              `✅ Valid ${validation.format} barcode - Product: ${(searchResult.product as { name?: string }).name || 'Unknown'}`
            )
          } else {
            toast.success(`✅ Valid ${validation.format} barcode - No product found in database`)
          }
        } else {
          toast.error(`❌ Invalid barcode: ${validation.error}`)
        }
      } else {
        toast.error('Failed to test barcode')
      }
    } catch (error) {
      console.error('Error testing barcode:', error)
      toast.error('Failed to test barcode')
    } finally {
      setTesting(false)
    }
  }

  return (
    <Box>
      <Typography gutterBottom variant="h6">
        Barcode Scanner Settings
      </Typography>
      <Typography color="text.secondary" gutterBottom variant="body2">
        Configure USB barcode scanner behavior
      </Typography>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Enable/Disable Scanner */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                />
              }
              label="Enable Barcode Scanner"
            />

            {/* Prefix */}
            <TextField
              label="Barcode Prefix"
              helperText="Characters to remove from the beginning of scanned barcodes"
              value={settings.prefix}
              onChange={(e) => setSettings({ ...settings, prefix: e.target.value })}
              size="small"
              fullWidth
              disabled={!settings.enabled}
            />

            {/* Suffix */}
            <TextField
              label="Barcode Suffix"
              helperText="Characters to remove from the end of scanned barcodes"
              value={settings.suffix}
              onChange={(e) => setSettings({ ...settings, suffix: e.target.value })}
              size="small"
              fullWidth
              disabled={!settings.enabled}
            />

            {/* Timeout */}
            <TextField
              label="Scan Timeout (ms)"
              helperText="Milliseconds between characters to detect scanner vs keyboard"
              type="number"
              value={settings.timeout}
              onChange={(e) =>
                setSettings({ ...settings, timeout: parseInt(e.target.value) || 100 })
              }
              size="small"
              fullWidth
              disabled={!settings.enabled}
              inputProps={{ min: 50, max: 500 }}
            />

            {/* Min Length */}
            <TextField
              label="Minimum Barcode Length"
              helperText="Minimum number of characters for a valid barcode"
              type="number"
              value={settings.minLength}
              onChange={(e) =>
                setSettings({ ...settings, minLength: parseInt(e.target.value) || 8 })
              }
              size="small"
              fullWidth
              disabled={!settings.enabled}
              inputProps={{ min: 1, max: 50 }}
            />

            {/* Beep on Scan */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.beepEnabled}
                  onChange={(e) => setSettings({ ...settings, beepEnabled: e.target.checked })}
                  disabled={!settings.enabled}
                />
              }
              label="Play Beep Sound on Successful Scan"
            />

            {/* Auto Add to Cart */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.autoAddToCart}
                  onChange={(e) => setSettings({ ...settings, autoAddToCart: e.target.checked })}
                  disabled={!settings.enabled}
                />
              }
              label="Automatically Add Scanned Products to Cart"
            />

            {/* Supported Formats */}
            <Box>
              <Typography gutterBottom variant="subtitle2">
                Supported Barcode Formats
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                {['EAN-13', 'UPC-A', 'CODE-128', 'CODE-39'].map((format) => (
                  <Chip
                    key={format}
                    label={format}
                    color={settings.supportedFormats.includes(format) ? 'primary' : 'default'}
                    onClick={() => {
                      if (!settings.enabled) return
                      const formats = settings.supportedFormats.split(',')
                      if (formats.includes(format)) {
                        setSettings({
                          ...settings,
                          supportedFormats: formats.filter((f) => f !== format).join(',')
                        })
                      } else {
                        setSettings({
                          ...settings,
                          supportedFormats: [...formats, format].join(',')
                        })
                      }
                    }}
                    disabled={!settings.enabled}
                  />
                ))}
              </Box>
              <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">
                Click to toggle format support
              </Typography>
            </Box>

            {/* Save Button */}
            <Button
              variant="contained"
              onClick={saveSettings}
              disabled={saving || !settings.enabled}
              fullWidth
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Barcode Testing Tool */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <BugReport color="primary" />
            <Typography variant="h6">Barcode Testing Tool</Typography>
          </Box>
          <Typography color="text.secondary" gutterBottom variant="body2">
            Test barcode validation and product lookup
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              label="Test Barcode"
              placeholder="Enter or scan a barcode..."
              value={testBarcode}
              onChange={(e) => setTestBarcode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTest()
                }
              }}
              size="small"
              fullWidth
            />
            <Button
              variant="outlined"
              startIcon={<QrCodeScanner />}
              onClick={handleTest}
              disabled={testing || !testBarcode}
            >
              {testing ? 'Testing...' : 'Test'}
            </Button>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography color="text.secondary" variant="caption">
              💡 Tip: You can scan a barcode directly into this field using your scanner
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card sx={{ mt: 3, bgcolor: 'info.lighter' }}>
        <CardContent>
          <Typography gutterBottom variant="subtitle2">
            📖 How to Use Barcode Scanner
          </Typography>
          <Box component="ol" sx={{ pl: 2, m: 0 }}>
            <li>
              <Typography variant="body2">Connect your USB barcode scanner</Typography>
            </li>
            <li>
              <Typography variant="body2">Enable barcode scanner in settings above</Typography>
            </li>
            <li>
              <Typography variant="body2">
                Go to POS (Sales) page and scan product barcodes
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Products will be automatically added to cart (if enabled)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Use the testing tool above to verify barcode formats
              </Typography>
            </li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
