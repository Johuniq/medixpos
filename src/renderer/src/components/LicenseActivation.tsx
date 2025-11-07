/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography
} from '@mui/material'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

interface LicenseActivationProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  required?: boolean // If true, user cannot close without activating
}

export default function LicenseActivation({
  open,
  onClose,
  onSuccess,
  required = false
}: LicenseActivationProps): React.JSX.Element {
  const [licenseKey, setLicenseKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sessionToken = useAuthStore((state) => state.sessionToken)

  const handleActivate = async (): Promise<void> => {
    if (!licenseKey.trim()) {
      setError('Please enter a license key')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // First, try to activate the license (if activation limits are enabled)
      const activateResult = await window.api.license.activate(
        licenseKey.trim(),
        undefined,
        sessionToken ?? undefined
      )

      if (!activateResult.success) {
        // If activation failed, it might not require activation
        // Try to validate directly
        const validateResult = await window.api.license.validate(licenseKey.trim())

        if (!validateResult.valid) {
          setError(validateResult.message || 'License validation failed')
          setLoading(false)
          return
        }
      }

      // Final validation to ensure license is active
      const finalValidation = await window.api.license.validate()

      if (finalValidation.valid) {
        toast.success('License activated successfully!')
        onSuccess()
        onClose()
      } else {
        setError(finalValidation.message || 'License activation failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate license')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = (): void => {
    if (!loading && !required) {
      setLicenseKey('')
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={required ? undefined : handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={required}
    >
      <DialogTitle>{required ? 'License Required' : 'Activate License'}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {required && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              A valid license is required to use MedixPOS. Please enter your license key to
              continue.
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter your MedixPOS license key to activate the software. You can purchase a license
            from our website.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="License Key"
            placeholder="Enter your license key"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            disabled={loading}
            error={!!error}
            sx={{ mb: 2 }}
          />

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                How to get a license:
              </Typography>
              <Typography variant="body2" color="text.secondary" component="div">
                <ol style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Visit our website</li>
                  <li>Choose your preferred subscription plan</li>
                  <li>Complete the purchase</li>
                  <li>You&apos;ll receive your license key via email</li>
                  <li>Enter the key here to activate</li>
                </ol>
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {!required && (
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleActivate}
          variant="contained"
          disabled={loading || !licenseKey.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          fullWidth={required}
          sx={{
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)'
            }
          }}
        >
          {loading ? 'Activating...' : 'Activate License'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
