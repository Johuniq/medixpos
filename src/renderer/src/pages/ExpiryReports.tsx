/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Alert,
  Divider
} from '@mui/material'
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSettingsStore } from '../store/settingsStore'
import { useAuthStore } from '../store/authStore'

interface ExpiringBatch {
  id: string
  batchNumber: string
  quantity: number
  expiryDate: string
  manufactureDate: string | null
  unitCost: number | null
  productId: string
  productName: string | null
  productSku: string | null
  productBarcode: string | null
  daysUntilExpiry: number
  valueAtRisk: number
  urgency: 'critical' | 'high' | 'medium'
}

interface ExpiryStats {
  totalBatches: number
  totalValue: number
  critical: { count: number; value: number }
  high: { count: number; value: number }
  medium: { count: number; value: number }
}

export default function ExpiryReports(): React.JSX.Element {
  const currency = useSettingsStore((state) => state.currency)
  const user = useAuthStore((state) => state.user)

  const [loading, setLoading] = useState(true)
  const [batches, setBatches] = useState<ExpiringBatch[]>([])
  const [filteredBatches, setFilteredBatches] = useState<ExpiringBatch[]>([])
  const [stats, setStats] = useState<ExpiryStats>({
    totalBatches: 0,
    totalValue: 0,
    critical: { count: 0, value: 0 },
    high: { count: 0, value: 0 },
    medium: { count: 0, value: 0 }
  })

  // Filters
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all')
  const [daysFilter, setDaysFilter] = useState<string>('90')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [disposalMode, setDisposalMode] = useState<boolean>(false)

  const getCurrencySymbol = (): string => {
    switch (currency) {
      case 'USD':
        return '$'
      case 'EUR':
        return '€'
      case 'GBP':
        return '£'
      case 'BDT':
        return '৳'
      case 'INR':
        return '₹'
      default:
        return '$'
    }
  }

  const currencySymbol = getCurrencySymbol()

  const loadExpiryData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const days = parseInt(daysFilter)
      const result = await window.api.batches.getExpiring(days)

      if (!result.success || !result.batches) {
        throw new Error(result.error || 'Failed to load expiry data')
      }

      const batchData = result.batches as ExpiringBatch[]
      setBatches(batchData)

      // Calculate stats
      const newStats: ExpiryStats = {
        totalBatches: batchData.length,
        totalValue: 0,
        critical: { count: 0, value: 0 },
        high: { count: 0, value: 0 },
        medium: { count: 0, value: 0 }
      }

      batchData.forEach((batch) => {
        newStats.totalValue += batch.valueAtRisk

        if (batch.urgency === 'critical') {
          newStats.critical.count++
          newStats.critical.value += batch.valueAtRisk
        } else if (batch.urgency === 'high') {
          newStats.high.count++
          newStats.high.value += batch.valueAtRisk
        } else if (batch.urgency === 'medium') {
          newStats.medium.count++
          newStats.medium.value += batch.valueAtRisk
        }
      })

      setStats(newStats)
      applyFilters(batchData, urgencyFilter, searchQuery)
    } catch (error) {
      console.error('Error loading expiry data:', error)
      toast.error('Failed to load expiry data')
    } finally {
      setLoading(false)
    }
  }, [daysFilter, urgencyFilter, searchQuery])

  const applyFilters = (data: ExpiringBatch[], urgency: string, search: string): void => {
    let filtered = [...data]

    // Apply urgency filter
    if (urgency !== 'all') {
      filtered = filtered.filter((batch) => batch.urgency === urgency)
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (batch) =>
          batch.productName?.toLowerCase().includes(searchLower) ||
          batch.batchNumber.toLowerCase().includes(searchLower) ||
          batch.productSku?.toLowerCase().includes(searchLower) ||
          batch.productBarcode?.toLowerCase().includes(searchLower)
      )
    }

    setFilteredBatches(filtered)
  }

  useEffect(() => {
    loadExpiryData()
  }, [loadExpiryData])

  useEffect(() => {
    applyFilters(batches, urgencyFilter, searchQuery)
  }, [urgencyFilter, searchQuery, batches])

  const handleExport = (): void => {
    try {
      // Create CSV content
      const headers = [
        'Batch Number',
        'Product Name',
        'SKU',
        'Quantity',
        'Expiry Date',
        'Days Until Expiry',
        'Unit Cost',
        'Value at Risk',
        'Urgency'
      ]

      const rows = filteredBatches.map((batch) => [
        batch.batchNumber,
        batch.productName || '',
        batch.productSku || '',
        batch.quantity,
        new Date(batch.expiryDate).toLocaleDateString(),
        batch.daysUntilExpiry,
        batch.unitCost?.toFixed(2) || '0.00',
        batch.valueAtRisk.toFixed(2),
        batch.urgency.toUpperCase()
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
      ].join('\n')

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `expiry-report-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Report exported successfully')
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Failed to export report')
    }
  }

  const handleDispose = async (batch: ExpiringBatch): Promise<void> => {
    if (!user) {
      toast.error('User not authenticated')
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to dispose of batch "${batch.batchNumber}" for "${batch.productName}"?\n\nThis will:\n- Set quantity to 0\n- Record disposal in audit log\n- Cannot be undone\n\nValue: ${currencySymbol}${batch.valueAtRisk.toFixed(2)}`
    )

    if (!confirmed) return

    const reason = window.prompt(
      'Please provide a reason for disposal:',
      'Expired - beyond usable date'
    )

    if (!reason) {
      toast.error('Disposal reason is required')
      return
    }

    try {
      // Dispose batch using dedicated disposal handler
      const result = await window.api.batches.dispose({
        batchId: batch.id,
        reason: reason,
        userId: user.id
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to dispose batch')
      }

      toast.success(
        `Batch ${batch.batchNumber} disposed successfully. ${result.data?.disposedQuantity} units written off.`
      )
      loadExpiryData() // Reload data
    } catch (error) {
      console.error('Error disposing batch:', error)
      toast.error('Failed to dispose batch')
    }
  }

  const getUrgencyColor = (urgency: string): string => {
    switch (urgency) {
      case 'critical':
        return '#d32f2f'
      case 'high':
        return '#ed6c02'
      case 'medium':
        return '#fbc02d'
      default:
        return '#757575'
    }
  }

  const getUrgencyIcon = (urgency: string): React.JSX.Element => {
    switch (urgency) {
      case 'critical':
        return <ErrorIcon fontSize="small" />
      case 'high':
        return <WarningIcon fontSize="small" />
      case 'medium':
        return <InfoIcon fontSize="small" />
      default:
        return <InfoIcon fontSize="small" />
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          Expiry Reports
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Comprehensive report of all expiring inventory batches
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3
        }}
      >
        {/* Total Batches */}
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total Expiring Batches
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {stats.totalBatches}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currencySymbol}
              {stats.totalValue.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>

        {/* Critical */}
        <Card sx={{ borderLeft: '4px solid #d32f2f' }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Critical (≤7 days)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#d32f2f' }}>
              {stats.critical.count}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currencySymbol}
              {stats.critical.value.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>

        {/* High */}
        <Card sx={{ borderLeft: '4px solid #ed6c02' }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              High (≤30 days)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#ed6c02' }}>
              {stats.high.count}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currencySymbol}
              {stats.high.value.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>

        {/* Medium */}
        <Card sx={{ borderLeft: '4px solid #fbc02d' }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Medium (≤90 days)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#f9a825' }}>
              {stats.medium.count}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currencySymbol}
              {stats.medium.value.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters & Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
              alignItems: { md: 'center' },
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flex: 1 }}>
              {/* Days Filter */}
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Time Period</InputLabel>
                <Select
                  value={daysFilter}
                  label="Time Period"
                  onChange={(e) => setDaysFilter(e.target.value)}
                >
                  <MenuItem value="7">Next 7 Days</MenuItem>
                  <MenuItem value="30">Next 30 Days</MenuItem>
                  <MenuItem value="90">Next 90 Days</MenuItem>
                  <MenuItem value="180">Next 180 Days</MenuItem>
                </Select>
              </FormControl>

              {/* Urgency Filter */}
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Urgency</InputLabel>
                <Select
                  value={urgencyFilter}
                  label="Urgency"
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                </Select>
              </FormControl>

              {/* Search */}
              <TextField
                label="Search"
                placeholder="Product, batch, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ minWidth: 250 }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh data">
                <IconButton onClick={loadExpiryData} color="primary">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                disabled={filteredBatches.length === 0}
              >
                Export CSV
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Disposal Mode:
            </Typography>
            <Button
              variant={disposalMode ? 'contained' : 'outlined'}
              color={disposalMode ? 'error' : 'inherit'}
              size="small"
              onClick={() => setDisposalMode(!disposalMode)}
            >
              {disposalMode ? 'Active' : 'Inactive'}
            </Button>
            {disposalMode && (
              <Alert severity="warning" sx={{ flex: 1 }}>
                Disposal mode active - Click trash icon to dispose expired batches
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Expiring Batches ({filteredBatches.length})
          </Typography>

          {filteredBatches.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No expiring batches found with current filters
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell>Urgency</TableCell>
                    <TableCell>Product Name</TableCell>
                    <TableCell>Batch Number</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell>Expiry Date</TableCell>
                    <TableCell align="right">Days Left</TableCell>
                    <TableCell align="right">Unit Cost</TableCell>
                    <TableCell align="right">Value at Risk</TableCell>
                    {disposalMode && <TableCell align="center">Action</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredBatches.map((batch) => (
                    <TableRow
                      key={batch.id}
                      sx={{
                        '&:hover': { bgcolor: '#f5f5f5' },
                        borderLeft: `4px solid ${getUrgencyColor(batch.urgency)}`
                      }}
                    >
                      <TableCell>
                        <Chip
                          icon={getUrgencyIcon(batch.urgency)}
                          label={batch.urgency.toUpperCase()}
                          size="small"
                          sx={{
                            bgcolor: `${getUrgencyColor(batch.urgency)}15`,
                            color: getUrgencyColor(batch.urgency),
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {batch.productName}
                        </Typography>
                        {batch.productSku && (
                          <Typography variant="caption" color="text.secondary">
                            SKU: {batch.productSku}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{batch.batchNumber}</TableCell>
                      <TableCell align="right">{batch.quantity}</TableCell>
                      <TableCell>{new Date(batch.expiryDate).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: getUrgencyColor(batch.urgency)
                          }}
                        >
                          {batch.daysUntilExpiry}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {currencySymbol}
                        {batch.unitCost?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {currencySymbol}
                          {batch.valueAtRisk.toFixed(2)}
                        </Typography>
                      </TableCell>
                      {disposalMode && (
                        <TableCell align="center">
                          <Tooltip title="Dispose batch">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDispose(batch)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
