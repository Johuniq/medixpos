/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { GitHub as GitHubIcon, Language as LanguageIcon } from '@mui/icons-material'
import { Box, Button, Card, CardContent, Divider, Link, Paper, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { CheckForUpdatesButton } from '../AutoUpdateNotifier'

export default function AboutSettings(): React.JSX.Element {
  const [appVersion, setAppVersion] = useState<string>('')

  useEffect(() => {
    loadVersion()
  }, [])

  const loadVersion = async (): Promise<void> => {
    try {
      const result = await window.api.autoUpdate.getVersion()
      if (result.success) {
        setAppVersion(result.version)
      }
    } catch (error) {
      console.error('Failed to get version:', error)
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        About MedixPOS
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Professional Pharmacy Management System
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* App Info */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Application Name
              </Typography>
              <Typography variant="body1">MedixPOS</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Version
              </Typography>
              <Typography variant="body1">{appVersion || 'Loading...'}</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Release Date
              </Typography>
              <Typography variant="body1">2025</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Developer
              </Typography>
              <Typography variant="body1">Johuniq</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Website
              </Typography>
              <Link href="https://medixpos.johuniq.tech" target="_blank" rel="noopener noreferrer">
                https://medixpos.johuniq.tech
              </Link>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Update Section */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Updates
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Keep your application up to date to get the latest features and security improvements.
          </Typography>
          <Box mt={2}>
            <CheckForUpdatesButton />
          </Box>
        </CardContent>
      </Card>

      {/* Links Section */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Resources
          </Typography>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <Button
              variant="outlined"
              startIcon={<LanguageIcon />}
              href="https://medixpos.johuniq.tech"
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
            >
              Visit Website
            </Button>
            <Button
              variant="outlined"
              startIcon={<GitHubIcon />}
              href="https://github.com/Johuniq/medixpos"
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
            >
              View on GitHub
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Copyright */}
      <Box textAlign="center" mt={3}>
        <Typography variant="body2" color="text.secondary">
          © 2025 Johuniq. All rights reserved.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Licensed Software - Proprietary License
        </Typography>
      </Box>
    </Paper>
  )
}
