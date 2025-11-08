/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import {
  Error as ErrorIcon,
  Info as InfoIcon,
  OpenInNew as OpenInNewIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Skeleton,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface ExpiringBatch {
  id: string
  batchNumber: string
  quantity: number
  expiryDate: string
  unitCost: number | null
  productId: string
  productName: string | null
  productSku: string | null
  daysUntilExpiry: number
  valueAtRisk: number
  urgency: 'critical' | 'high' | 'medium'
}

interface ExpiryStats {
  expired: {
    count: number
    value: number
  }
  expiring7Days: {
    count: number
    value: number
  }
  expiring30Days: {
    count: number
    value: number
  }
  expiring90Days: {
    count: number
    value: number
  }
}

interface ExpiryAlertCardProps {
  currencySymbol: string
}

export default function ExpiryAlertCard({
  currencySymbol
}: ExpiryAlertCardProps): React.JSX.Element {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ExpiryStats>({
    expired: { count: 0, value: 0 },
    expiring7Days: { count: 0, value: 0 },
    expiring30Days: { count: 0, value: 0 },
    expiring90Days: { count: 0, value: 0 }
  })
  const [criticalBatches, setCriticalBatches] = useState<ExpiringBatch[]>([])

  const loadExpiryData = async (): Promise<void> => {
    try {
      setLoading(true)

      // Get all batches expiring in next 90 days
      const result = await window.api.batches.getExpiring(90)

      if (!result.success || !result.batches) {
        throw new Error(result.error || 'Failed to load expiry data')
      }

      const batches = result.batches as ExpiringBatch[]
      const now = new Date()

      // Calculate stats
      const newStats: ExpiryStats = {
        expired: { count: 0, value: 0 },
        expiring7Days: { count: 0, value: 0 },
        expiring30Days: { count: 0, value: 0 },
        expiring90Days: { count: 0, value: 0 }
      }

      const critical: ExpiringBatch[] = []

      batches.forEach((batch) => {
        const expiryDate = new Date(batch.expiryDate)
        const daysUntilExpiry = Math.floor(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Check if expired (should not happen, but safety check)
        if (daysUntilExpiry < 0) {
          newStats.expired.count++
          newStats.expired.value += batch.valueAtRisk
          critical.push(batch)
        } else if (daysUntilExpiry <= 7) {
          newStats.expiring7Days.count++
          newStats.expiring7Days.value += batch.valueAtRisk
          critical.push(batch)
        } else if (daysUntilExpiry <= 30) {
          newStats.expiring30Days.count++
          newStats.expiring30Days.value += batch.valueAtRisk
          if (critical.length < 5) critical.push(batch) // Show top 5 critical
        } else if (daysUntilExpiry <= 90) {
          newStats.expiring90Days.count++
          newStats.expiring90Days.value += batch.valueAtRisk
        }
      })

      setStats(newStats)
      setCriticalBatches(critical.slice(0, 5)) // Top 5 most critical
    } catch (error) {
      console.error('Error loading expiry data:', error)
      toast.error('Failed to load expiry alerts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExpiryData()
  }, [])

  const handleViewAll = (): void => {
    navigate('/batches')
  }

  const getUrgencyColor = (urgency: 'critical' | 'high' | 'medium'): string => {
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

  const getUrgencyIcon = (urgency: 'critical' | 'high' | 'medium'): React.JSX.Element => {
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

  const formatCurrency = (amount: number): string => {
    return `${currencySymbol}${amount.toFixed(2)}`
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
          >
            <Skeleton variant="text" width={200} height={32} />
            <Skeleton variant="circular" width={40} height={40} />
          </Box>
          <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={80} />
        </CardContent>
      </Card>
    )
  }

  const hasExpired = stats.expired.count > 0
  const hasCritical = stats.expiring7Days.count > 0
  const hasWarning = stats.expiring30Days.count > 0

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Expiry Alerts
          </Typography>
          <Box>
            <IconButton size="small" onClick={loadExpiryData} title="Refresh">
              <RefreshIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handleViewAll} title="View All Batches">
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Alert Banner */}
        {hasExpired && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>{stats.expired.count} Expired Batch(es)</strong> - Value at Risk:{' '}
            {formatCurrency(stats.expired.value)}
          </Alert>
        )}
        {!hasExpired && hasCritical && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>{stats.expiring7Days.count} Batch(es) Expiring Within 7 Days</strong> - Value at
            Risk: {formatCurrency(stats.expiring7Days.value)}
          </Alert>
        )}
        {!hasExpired && !hasCritical && hasWarning && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>{stats.expiring30Days.count} Batch(es) Expiring Within 30 Days</strong> - Value
            at Risk: {formatCurrency(stats.expiring30Days.value)}
          </Alert>
        )}
        {!hasExpired && !hasCritical && !hasWarning && (
          <Alert severity="success" sx={{ mb: 2 }}>
            No critical expiry alerts
          </Alert>
        )}

        {/* Stats Summary */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 2,
            mb: 2
          }}
        >
          {/* Expiring in 7 Days */}
          <Box
            sx={{
              p: 2,
              bgcolor: stats.expiring7Days.count > 0 ? '#ffebee' : '#f5f5f5',
              borderRadius: 1,
              border: stats.expiring7Days.count > 0 ? '1px solid #ef5350' : '1px solid #e0e0e0'
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              7 Days
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#d32f2f' }}>
              {stats.expiring7Days.count}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatCurrency(stats.expiring7Days.value)}
            </Typography>
          </Box>

          {/* Expiring in 30 Days */}
          <Box
            sx={{
              p: 2,
              bgcolor: stats.expiring30Days.count > 0 ? '#fff3e0' : '#f5f5f5',
              borderRadius: 1,
              border: stats.expiring30Days.count > 0 ? '1px solid #ff9800' : '1px solid #e0e0e0'
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              30 Days
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#ed6c02' }}>
              {stats.expiring30Days.count}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatCurrency(stats.expiring30Days.value)}
            </Typography>
          </Box>

          {/* Expiring in 90 Days */}
          <Box
            sx={{
              p: 2,
              bgcolor: stats.expiring90Days.count > 0 ? '#fffde7' : '#f5f5f5',
              borderRadius: 1,
              border: stats.expiring90Days.count > 0 ? '1px solid #fbc02d' : '1px solid #e0e0e0'
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              90 Days
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#f9a825' }}>
              {stats.expiring90Days.count}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatCurrency(stats.expiring90Days.value)}
            </Typography>
          </Box>

          {/* Total Value at Risk */}
          <Box
            sx={{
              p: 2,
              bgcolor: '#f3e5f5',
              borderRadius: 1,
              border: '1px solid #ab47bc'
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total at Risk
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#7b1fa2' }}>
              {formatCurrency(
                stats.expiring7Days.value + stats.expiring30Days.value + stats.expiring90Days.value
              )}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.expiring7Days.count + stats.expiring30Days.count + stats.expiring90Days.count}{' '}
              batches
            </Typography>
          </Box>
        </Box>

        {/* Critical Batches List */}
        {criticalBatches.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, mt: 2 }}>
              Most Critical Batches
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {criticalBatches.map((batch) => (
                <Box
                  key={batch.id}
                  sx={{
                    p: 1.5,
                    bgcolor: '#fff',
                    border: `1px solid ${getUrgencyColor(batch.urgency)}`,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      {getUrgencyIcon(batch.urgency)}
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {batch.productName || 'Unknown Product'}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Batch: {batch.batchNumber} • Qty: {batch.quantity} • Expires in{' '}
                      {batch.daysUntilExpiry} day(s)
                    </Typography>
                  </Box>
                  <Chip
                    label={formatCurrency(batch.valueAtRisk)}
                    size="small"
                    sx={{
                      bgcolor: `${getUrgencyColor(batch.urgency)}15`,
                      color: getUrgencyColor(batch.urgency),
                      fontWeight: 600
                    }}
                  />
                </Box>
              ))}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}
