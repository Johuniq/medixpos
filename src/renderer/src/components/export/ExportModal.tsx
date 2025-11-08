/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import {
  Article,
  CloudDownload,
  Inventory2,
  People,
  Receipt,
  ShoppingCart,
  Store
} from '@mui/icons-material'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  TextField,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  defaultExportType?: ExportType
}

type ExportType = 'products' | 'customers' | 'suppliers' | 'inventory' | 'sales' | 'purchases'
type ExportFormat = 'csv' | 'xlsx' | 'json'

export default function ExportModal({
  isOpen,
  onClose,
  defaultExportType = 'products'
}: ExportModalProps): React.JSX.Element {
  const [exportType, setExportType] = useState<ExportType>(defaultExportType)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  // Update export type when modal opens with different default
  useEffect(() => {
    if (isOpen) {
      setExportType(defaultExportType)
    }
  }, [isOpen, defaultExportType])

  const exportTypes = [
    { value: 'products', label: 'Products', icon: <Article />, description: 'Export all products' },
    {
      value: 'customers',
      label: 'Customers',
      icon: <People />,
      description: 'Export customer data'
    },
    {
      value: 'suppliers',
      label: 'Suppliers',
      icon: <Store />,
      description: 'Export supplier information'
    },
    {
      value: 'inventory',
      label: 'Inventory',
      icon: <Inventory2 />,
      description: 'Export inventory levels'
    },
    {
      value: 'sales',
      label: 'Sales',
      icon: <Receipt />,
      description: 'Export sales transactions'
    },
    {
      value: 'purchases',
      label: 'Purchases',
      icon: <ShoppingCart />,
      description: 'Export purchase orders'
    }
  ]

  const showDateRange = exportType === 'sales' || exportType === 'purchases'

  const handleExport = async (): Promise<void> => {
    if (showDateRange && (!startDate || !endDate)) {
      toast.error('Please select both start and end dates')
      return
    }

    if (showDateRange && new Date(startDate) > new Date(endDate)) {
      toast.error('Start date must be before end date')
      return
    }

    setIsExporting(true)

    try {
      const options = {
        format: exportFormat,
        ...(showDateRange && { startDate, endDate })
      }

      let result
      switch (exportType) {
        case 'products':
          result = await window.api.export.products(options)
          break
        case 'customers':
          result = await window.api.export.customers(options)
          break
        case 'suppliers':
          result = await window.api.export.suppliers(options)
          break
        case 'inventory':
          result = await window.api.export.inventory(options)
          break
        case 'sales':
          result = await window.api.export.sales(options)
          break
        case 'purchases':
          result = await window.api.export.purchases(options)
          break
      }

      if (result.success) {
        toast.success(
          `Successfully exported ${result.recordCount} records to ${result.filePath?.split('\\').pop()}`
        )
        onClose()
      } else {
        toast.error(result.error || 'Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const handleClose = (): void => {
    if (!isExporting) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudDownload />
          <Typography variant="h6">
            Export {exportTypes.find((t) => t.value === exportType)?.label}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Date Range for Sales/Purchases */}
          {showDateRange && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Date Range (Optional)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start Date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Export Format Selection */}
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Export Format
          </Typography>
          <RadioGroup
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
          >
            <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
              <FormControlLabel
                value="xlsx"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Excel (.xlsx)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Best for Excel, formatted with headers and auto-fit columns
                    </Typography>
                  </Box>
                }
              />
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
              <FormControlLabel
                value="csv"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      CSV (.csv)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Compatible with all spreadsheet applications
                    </Typography>
                  </Box>
                }
              />
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <FormControlLabel
                value="json"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      JSON (.json)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      For data transfer and integration with other systems
                    </Typography>
                  </Box>
                }
              />
            </Paper>
          </RadioGroup>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isExporting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={isExporting}
          startIcon={isExporting ? <CircularProgress size={20} /> : <CloudDownload />}
        >
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
