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

interface ReportsSettingsProps {
  settings: Record<string, string>
  onSave: (updates: Record<string, string>) => Promise<void>
}

export default function ReportsSettings({
  settings,
  onSave
}: ReportsSettingsProps): React.ReactElement {
  const [localSettings, setLocalSettings] = useState({
    autoExportEnabled: settings.reports_auto_export_enabled === 'true',
    autoExportSchedule: settings.reports_auto_export_schedule || 'daily',
    autoExportFormat: settings.reports_auto_export_format || 'pdf',
    autoExportTypes: settings.reports_auto_export_types || 'sales,inventory',
    defaultDateRange: settings.reports_default_date_range || 'last_30_days',
    includeCharts: settings.reports_include_charts !== 'false',
    emailEnabled: settings.reports_email_enabled === 'true',
    emailRecipients: settings.reports_email_recipients || ''
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
        reports_auto_export_enabled: String(localSettings.autoExportEnabled),
        reports_auto_export_schedule: localSettings.autoExportSchedule,
        reports_auto_export_format: localSettings.autoExportFormat,
        reports_auto_export_types: localSettings.autoExportTypes,
        reports_default_date_range: localSettings.defaultDateRange,
        reports_include_charts: String(localSettings.includeCharts),
        reports_email_enabled: String(localSettings.emailEnabled),
        reports_email_recipients: localSettings.emailRecipients
      })
      setMessage({ type: 'success', text: 'Reports settings saved successfully!' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to save reports settings' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Reports Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure automatic report generation and export preferences
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        {/* Automatic Exports */}
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Automatic Exports
        </Typography>
        <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.autoExportEnabled}
                onChange={(e) => handleChange('autoExportEnabled', e.target.checked)}
              />
            }
            label="Enable Automatic Export"
          />
          {localSettings.autoExportEnabled && (
            <>
              <TextField
                select
                label="Export Schedule"
                value={localSettings.autoExportSchedule}
                onChange={(e) => handleChange('autoExportSchedule', e.target.value)}
                fullWidth
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </TextField>
              <TextField
                label="Report Types"
                value={localSettings.autoExportTypes}
                onChange={(e) => handleChange('autoExportTypes', e.target.value)}
                fullWidth
                helperText="Comma-separated: sales, inventory, purchases, expenses"
              />
            </>
          )}
        </Box>

        {/* Output Preferences */}
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Export Settings
        </Typography>
        <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
          <TextField
            select
            label="Default Export Format"
            value={localSettings.autoExportFormat}
            onChange={(e) => handleChange('autoExportFormat', e.target.value)}
            fullWidth
          >
            <MenuItem value="pdf">PDF</MenuItem>
            <MenuItem value="excel">Excel</MenuItem>
            <MenuItem value="csv">CSV</MenuItem>
          </TextField>
          <TextField
            select
            label="Default Date Range"
            value={localSettings.defaultDateRange}
            onChange={(e) => handleChange('defaultDateRange', e.target.value)}
            fullWidth
          >
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="last_7_days">Last 7 Days</MenuItem>
            <MenuItem value="last_30_days">Last 30 Days</MenuItem>
            <MenuItem value="month_to_date">Month to Date</MenuItem>
            <MenuItem value="year_to_date">Year to Date</MenuItem>
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.includeCharts}
                onChange={(e) => handleChange('includeCharts', e.target.checked)}
              />
            }
            label="Include Charts in Exports"
          />
        </Box>

        {/* Data Retention */}
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Email Delivery
        </Typography>
        <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.emailEnabled}
                onChange={(e) => handleChange('emailEnabled', e.target.checked)}
              />
            }
            label="Email Reports Automatically"
          />
          {localSettings.emailEnabled && (
            <TextField
              label="Email Recipients"
              value={localSettings.emailRecipients}
              onChange={(e) => handleChange('emailRecipients', e.target.value)}
              fullWidth
              helperText="Multiple emails separated by commas"
            />
          )}
        </Box>

        <Button type="submit" variant="contained" disabled={saving} sx={{ mt: 2 }}>
          {saving ? 'Saving...' : 'Save Reports Settings'}
        </Button>
      </Box>
    </Paper>
  )
}
