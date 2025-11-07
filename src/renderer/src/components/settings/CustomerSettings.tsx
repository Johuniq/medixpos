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
  Paper,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import React, { useState } from 'react'

interface CustomerSettingsProps {
  settings: Record<string, string>
  onSave: (updates: Record<string, string>) => Promise<void>
}

export default function CustomerSettings({
  settings,
  onSave
}: CustomerSettingsProps): React.ReactElement {
  const [localSettings, setLocalSettings] = useState({
    enableCustomerCreditSales: settings.enable_customer_credit_sales === 'true',
    maxCreditLimit: settings.max_credit_limit || '50000',
    creditDueDays: settings.credit_due_days || '30',
    enablePrescriptionTracking: settings.enable_prescription_tracking === 'true',
    enableBirthdayReminders: settings.enable_birthday_reminders === 'true'
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
        enable_customer_credit_sales: String(localSettings.enableCustomerCreditSales),
        max_credit_limit: localSettings.maxCreditLimit,
        credit_due_days: localSettings.creditDueDays,
        enable_prescription_tracking: String(localSettings.enablePrescriptionTracking),
        enable_birthday_reminders: String(localSettings.enableBirthdayReminders)
      })
      setMessage({ type: 'success', text: 'Customer settings saved successfully!' })
    } catch (error) {
      console.error('Error saving customer settings:', error)
      setMessage({ type: 'error', text: 'Failed to save customer settings' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Customer Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure customer-related features including credit sales, prescriptions, and reminders
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        {/* Credit Sales */}
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Credit Sales
        </Typography>
        <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.enableCustomerCreditSales}
                onChange={(e) => handleChange('enableCustomerCreditSales', e.target.checked)}
              />
            }
            label="Enable Customer Credit Sales"
          />
          {localSettings.enableCustomerCreditSales && (
            <>
              <TextField
                label="Maximum Credit Limit"
                type="number"
                value={localSettings.maxCreditLimit}
                onChange={(e) => handleChange('maxCreditLimit', e.target.value)}
                fullWidth
                helperText="Default credit limit for new customers"
                inputProps={{ min: 0, step: 100 }}
              />
              <TextField
                label="Credit Due Days"
                type="number"
                value={localSettings.creditDueDays}
                onChange={(e) => handleChange('creditDueDays', e.target.value)}
                fullWidth
                helperText="Number of days before credit payment is due"
                inputProps={{ min: 1 }}
              />
            </>
          )}
        </Box>

        {/* Prescription Tracking */}
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Prescription Management
        </Typography>
        <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.enablePrescriptionTracking}
                onChange={(e) => handleChange('enablePrescriptionTracking', e.target.checked)}
              />
            }
            label="Enable Prescription Tracking"
          />
          <Typography variant="caption" color="text.secondary">
            Track prescription details for controlled medicines and customer medication history
          </Typography>
        </Box>

        {/* Birthday Reminders */}
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Customer Reminders
        </Typography>
        <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.enableBirthdayReminders}
                onChange={(e) => handleChange('enableBirthdayReminders', e.target.checked)}
              />
            }
            label="Enable Birthday Reminders"
          />
          <Typography variant="caption" color="text.secondary">
            Send notifications for customer birthdays to improve customer relationships
          </Typography>
        </Box>

        <Button type="submit" variant="contained" disabled={saving} sx={{ mt: 2 }}>
          {saving ? 'Saving...' : 'Save Customer Settings'}
        </Button>
      </Box>
    </Paper>
  )
}
