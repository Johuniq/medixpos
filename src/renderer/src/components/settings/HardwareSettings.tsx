/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Paper,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import React, { useState } from 'react'

interface HardwareSettingsProps {
  settings: Record<string, string>
  onSave: (updates: Record<string, string>) => Promise<void>
}

export default function HardwareSettings({
  settings,
  onSave
}: HardwareSettingsProps): React.ReactElement {
  const [localSettings, setLocalSettings] = useState({
    enableBarcodeScanner: settings.enable_barcode_scanner === 'true',
    barcodeScannerType: settings.barcode_scanner_type || 'usb',
    barcodeScannerPort: settings.barcode_scanner_port || '',
    enableReceiptPrinter: settings.enable_receipt_printer === 'true',
    receiptPrinterName: settings.receipt_printer_name || '',
    receiptPrinterPaperWidth: settings.receipt_printer_paper_width || '80',
    enableCashDrawer: settings.enable_cash_drawer === 'true'
  })

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChange = (field: string, value: string | boolean): void => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      await onSave({
        enable_barcode_scanner: String(localSettings.enableBarcodeScanner),
        barcode_scanner_type: localSettings.barcodeScannerType,
        barcode_scanner_port: localSettings.barcodeScannerPort,
        enable_receipt_printer: String(localSettings.enableReceiptPrinter),
        receipt_printer_name: localSettings.receiptPrinterName,
        receipt_printer_paper_width: localSettings.receiptPrinterPaperWidth,
        enable_cash_drawer: String(localSettings.enableCashDrawer)
      })
      setMessage({ type: 'success', text: 'Hardware settings saved successfully!' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to save hardware settings' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Hardware Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure barcode scanners, receipt printers, and cash drawer integration
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        {/* Barcode Scanner */}
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Barcode Scanner
        </Typography>
        <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.enableBarcodeScanner}
                onChange={(e) => handleChange('enableBarcodeScanner', e.target.checked)}
              />
            }
            label="Enable Barcode Scanner"
          />
          {localSettings.enableBarcodeScanner && (
            <>
              <TextField
                select
                label="Scanner Type"
                value={localSettings.barcodeScannerType}
                onChange={(e) => handleChange('barcodeScannerType', e.target.value)}
                fullWidth
              >
                <MenuItem value="usb">USB Scanner</MenuItem>
                <MenuItem value="serial">Serial Port</MenuItem>
                <MenuItem value="bluetooth">Bluetooth</MenuItem>
              </TextField>
              {localSettings.barcodeScannerType === 'serial' && (
                <TextField
                  label="Scanner Port"
                  value={localSettings.barcodeScannerPort}
                  onChange={(e) => handleChange('barcodeScannerPort', e.target.value)}
                  fullWidth
                  helperText="e.g., COM1, COM3, /dev/ttyUSB0"
                />
              )}
            </>
          )}
        </Box>

        {/* Receipt Printer */}
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Receipt Printer
        </Typography>
        <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.enableReceiptPrinter}
                onChange={(e) => handleChange('enableReceiptPrinter', e.target.checked)}
              />
            }
            label="Enable Receipt Printer"
          />
          {localSettings.enableReceiptPrinter && (
            <>
              <TextField
                label="Printer Name"
                value={localSettings.receiptPrinterName}
                onChange={(e) => handleChange('receiptPrinterName', e.target.value)}
                fullWidth
                helperText="System printer name (leave empty to use default)"
              />
              <TextField
                select
                label="Paper Width (mm)"
                value={localSettings.receiptPrinterPaperWidth}
                onChange={(e) => handleChange('receiptPrinterPaperWidth', e.target.value)}
                fullWidth
              >
                <MenuItem value="58">58mm</MenuItem>
                <MenuItem value="80">80mm</MenuItem>
              </TextField>
            </>
          )}
        </Box>

        {/* Cash Drawer */}
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Cash Drawer
        </Typography>
        <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.enableCashDrawer}
                onChange={(e) => handleChange('enableCashDrawer', e.target.checked)}
              />
            }
            label="Enable Cash Drawer"
          />
          <Typography variant="caption" color="text.secondary">
            Automatically open cash drawer after completing cash sales
          </Typography>
        </Box>

        <Button type="submit" variant="contained" disabled={saving} sx={{ mt: 2 }}>
          {saving ? 'Saving...' : 'Save Hardware Settings'}
        </Button>
      </Box>
    </Paper>
  )
}
