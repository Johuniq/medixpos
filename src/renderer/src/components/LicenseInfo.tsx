/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import WarningIcon from '@mui/icons-material/Warning'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Typography
} from '@mui/material'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

interface LicenseInfoProps {
  onActivateClick: () => void
}

interface LicenseData {
  isLicensed: boolean
  status?: string
  expiresAt?: string
  lastValidated?: string
  usage?: number
  limitUsage?: number
}

export default function LicenseInfo({ onActivateClick }: LicenseInfoProps): React.JSX.Element {
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const sessionToken = useAuthStore((state) => state.sessionToken)

  const loadLicenseInfo = async (): Promise<void> => {
    try {
      const info = await window.api.license.getInfo()
      setLicenseData(info)
    } catch {
      toast.error('Failed to load license information')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLicenseInfo()
  }, [])

  const handleValidate = async (): Promise<void> => {
    setValidating(true)
    try {
      const result = await window.api.license.validate()
      if (result.valid) {
        toast.success('License validated successfully')
        await loadLicenseInfo()
      } else {
        toast.error(result.message || 'License validation failed')
      }
    } catch {
      toast.error('Failed to validate license')
    } finally {
      setValidating(false)
    }
  }

  const handleDeactivate = async (): Promise<void> => {
    try {
      const result = await window.api.license.deactivate(sessionToken ?? undefined)
      if (result.success) {
        toast.success('License deactivated successfully')
        await loadLicenseInfo()
      } else {
        toast.error(result.message || 'Failed to deactivate license')
      }
    } catch {
      toast.error('Failed to deactivate license')
    } finally {
      setDeactivateDialogOpen(false)
    }
  }

  const getStatusColor = (
    status?: string
  ): 'success' | 'error' | 'warning' | 'default' | 'primary' | 'secondary' | 'info' => {
    switch (status) {
      case 'active':
        return 'success'
      case 'expired':
        return 'error'
      case 'invalid':
        return 'error'
      case 'inactive':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status?: string): React.JSX.Element => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon color="success" />
      case 'expired':
        return <ErrorIcon color="error" />
      case 'invalid':
        return <ErrorIcon color="error" />
      case 'inactive':
        return <WarningIcon color="warning" />
      default:
        return <WarningIcon color="disabled" />
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    )
  }

  if (!licenseData?.isLicensed) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            No active license found. Please activate a license to use MedixPOS.
          </Alert>
          <Button variant="contained" onClick={onActivateClick} fullWidth>
            Activate License
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">License Information</Typography>
            <Chip
              icon={getStatusIcon(licenseData.status)}
              label={licenseData.status?.toUpperCase() || 'UNKNOWN'}
              color={getStatusColor(licenseData.status)}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2
            }}
          >
            {licenseData.expiresAt && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Expires At
                </Typography>
                <Typography variant="body1">
                  {format(new Date(licenseData.expiresAt), 'PPP')}
                </Typography>
              </Box>
            )}

            {licenseData.lastValidated && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Last Validated
                </Typography>
                <Typography variant="body1">
                  {format(new Date(licenseData.lastValidated), 'PPp')}
                </Typography>
              </Box>
            )}

            {licenseData.limitUsage !== undefined && licenseData.usage !== undefined && (
              <>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Usage
                  </Typography>
                  <Typography variant="body1">{licenseData.usage}</Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Usage Limit
                  </Typography>
                  <Typography variant="body1">{licenseData.limitUsage || 'Unlimited'}</Typography>
                </Box>
              </>
            )}
          </Box>

          {licenseData.status === 'expired' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Your license has expired. Please renew your license to continue using MedixPOS.
            </Alert>
          )}

          {licenseData.status === 'invalid' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Your license is invalid. Please contact support or activate a new license.
            </Alert>
          )}

          <Box display="flex" gap={1} mt={3}>
            <Button
              variant="outlined"
              onClick={handleValidate}
              disabled={validating}
              startIcon={validating ? <CircularProgress size={20} /> : null}
            >
              {validating ? 'Validating...' : 'Validate License'}
            </Button>
            <Button variant="outlined" color="error" onClick={() => setDeactivateDialogOpen(true)}>
              Deactivate License
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={deactivateDialogOpen} onClose={() => setDeactivateDialogOpen(false)}>
        <DialogTitle>Deactivate License</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to deactivate this license? You will need to reactivate it to
            continue using MedixPOS.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeactivateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeactivate} color="error" variant="contained">
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
