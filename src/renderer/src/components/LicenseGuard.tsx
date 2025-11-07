/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Box, CircularProgress, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import LicenseActivation from './LicenseActivation'

interface LicenseGuardProps {
  children: React.ReactNode
}

export default function LicenseGuard({ children }: LicenseGuardProps): React.JSX.Element {
  const [checking, setChecking] = useState(true)
  const [needsActivation, setNeedsActivation] = useState(false)
  const [licenseValid, setLicenseValid] = useState(false)

  const checkLicense = async (): Promise<void> => {
    try {
      // Get license info
      const info = await window.api.license.getInfo()

      if (!info.isLicensed) {
        setNeedsActivation(true)
        setChecking(false)
        return
      }

      // Check if needs revalidation
      const needsRevalidation = await window.api.license.needsRevalidation()

      if (needsRevalidation) {
        // Validate license
        const validation = await window.api.license.validate()

        if (!validation.valid) {
          setNeedsActivation(true)
          setChecking(false)
          return
        }
      }

      // Check status
      if (info.status === 'active') {
        setLicenseValid(true)
      } else {
        setNeedsActivation(true)
      }
    } catch {
      setNeedsActivation(true)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkLicense()
  }, [])

  const handleActivationSuccess = async (): Promise<void> => {
    setNeedsActivation(false)
    setLicenseValid(true)

    // Refresh renderer so it can load backend resources
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  if (checking) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          Checking license...
        </Typography>
      </Box>
    )
  }

  if (needsActivation && !licenseValid) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <LicenseActivation
          open={true}
          required={true}
          onClose={() => {
            // Don't allow closing without activation for initial app access
          }}
          onSuccess={handleActivationSuccess}
        />
      </Box>
    )
  }

  return <>{children}</>
}
