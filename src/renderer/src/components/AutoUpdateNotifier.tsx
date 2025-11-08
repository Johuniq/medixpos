/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import {
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Snackbar,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function AutoUpdateNotifier(): React.JSX.Element {
  const [currentVersion, setCurrentVersion] = useState<string>('')
  const [updateInfo, setUpdateInfo] = useState<{
    version: string
    releaseNotes?: string
  } | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [showDownloadedDialog, setShowDownloadedDialog] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    // Get current version
    void loadCurrentVersion()

    // Listen for update status changes
    window.api.autoUpdate.onStatusChange(handleUpdateStatus)

    return () => {
      window.api.autoUpdate.removeStatusListener()
    }
  }, [])

  const loadCurrentVersion = async (): Promise<void> => {
    try {
      const result = await window.api.autoUpdate.getVersion()
      if (result.success) {
        setCurrentVersion(result.version)
      }
    } catch (error) {
      console.error('Failed to get version:', error)
    }
  }

  const handleUpdateStatus = (event: string, data: Record<string, unknown>): void => {
    console.log('Update status:', event, data)

    switch (event) {
      case 'checking-for-update':
        setChecking(true)
        break

      case 'update-available':
        setChecking(false)
        setUpdateInfo({
          version: data.version as string,
          releaseNotes: Array.isArray(data.releaseNotes)
            ? data.releaseNotes.join('\n')
            : (data.releaseNotes as string)
        })
        setShowUpdateDialog(true)
        break

      case 'update-not-available':
        setChecking(false)
        toast.success('You are using the latest version!')
        break

      case 'download-started':
        setDownloading(true)
        setDownloadProgress(0)
        toast.success('Downloading update...')
        break

      case 'download-progress':
        setDownloadProgress((data.percent as number) || 0)
        break

      case 'update-downloaded':
        setDownloading(false)
        setShowDownloadedDialog(true)
        toast.success('Update downloaded successfully!')
        break

      case 'update-error':
        setChecking(false)
        setDownloading(false)
        toast.error((data.error as string) || 'Update failed')
        break

      default:
        break
    }
  }

  const handleCheckForUpdates = async (): Promise<void> => {
    try {
      setChecking(true)
      const result = await window.api.autoUpdate.checkForUpdates()
      if (!result.success) {
        toast.error(result.error || 'Failed to check for updates')
        setChecking(false)
      }
    } catch {
      toast.error('Failed to check for updates')
      setChecking(false)
    }
  }

  const handleDownloadUpdate = async (): Promise<void> => {
    try {
      setShowUpdateDialog(false)
      const result = await window.api.autoUpdate.downloadUpdate()
      if (!result.success) {
        toast.error(result.error || 'Failed to download update')
      }
    } catch {
      toast.error('Failed to download update')
    }
  }

  const handleInstallUpdate = async (): Promise<void> => {
    try {
      const result = await window.api.autoUpdate.installUpdate()
      if (!result.success) {
        toast.error(result.error || 'Failed to install update')
      }
      // App will quit and restart automatically
    } catch {
      toast.error('Failed to install update')
    }
  }

  return (
    <>
      {/* Update Available Dialog */}
      <Dialog
        open={showUpdateDialog}
        onClose={() => setShowUpdateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <InfoIcon color="primary" />
              <Typography variant="h6">Update Available</Typography>
            </Box>
            <IconButton size="small" onClick={() => setShowUpdateDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography>
              A new version <strong>{updateInfo?.version}</strong> is available!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Current version: {currentVersion}
            </Typography>
            {updateInfo?.releaseNotes && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  What&apos;s New:
                </Typography>
                <Box
                  sx={{
                    bgcolor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    maxHeight: 200,
                    overflow: 'auto'
                  }}
                >
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
                  >
                    {updateInfo.releaseNotes}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpdateDialog(false)}>Later</Button>
          <Button variant="contained" onClick={handleDownloadUpdate} startIcon={<DownloadIcon />}>
            Download
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Downloaded Dialog */}
      <Dialog
        open={showDownloadedDialog}
        onClose={() => setShowDownloadedDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircleIcon color="success" />
            <Typography variant="h6">Update Ready</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Version <strong>{updateInfo?.version}</strong> has been downloaded successfully.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            The update will be installed when you restart the application.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDownloadedDialog(false)}>Later</Button>
          <Button
            variant="contained"
            onClick={handleInstallUpdate}
            startIcon={<RefreshIcon />}
            color="primary"
          >
            Restart Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Download Progress Snackbar */}
      <Snackbar
        open={downloading}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ width: 400 }}
      >
        <Alert
          severity="info"
          sx={{ width: '100%' }}
          action={
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2">{Math.round(downloadProgress)}%</Typography>
            </Box>
          }
        >
          <Box>
            <Typography variant="body2" gutterBottom>
              Downloading Update
            </Typography>
            <LinearProgress variant="determinate" value={downloadProgress} sx={{ mt: 1 }} />
          </Box>
        </Alert>
      </Snackbar>

      {/* Check for Updates Button (can be placed in settings or about page) */}
      <Box display="none">
        <Button
          variant="outlined"
          startIcon={checking ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={handleCheckForUpdates}
          disabled={checking || downloading}
        >
          {checking ? 'Checking...' : 'Check for Updates'}
        </Button>
      </Box>
    </>
  )
}

// Export a simple button component that can be used in settings
export function CheckForUpdatesButton(): React.JSX.Element {
  const [checking, setChecking] = useState(false)

  const handleCheckForUpdates = async (): Promise<void> => {
    try {
      setChecking(true)
      const result = await window.api.autoUpdate.checkForUpdates()
      if (!result.success) {
        toast.error(result.error || 'Failed to check for updates')
      }
    } catch {
      toast.error('Failed to check for updates')
    } finally {
      setTimeout(() => setChecking(false), 2000)
    }
  }

  return (
    <Button
      variant="outlined"
      startIcon={checking ? <CircularProgress size={16} /> : <RefreshIcon />}
      onClick={handleCheckForUpdates}
      disabled={checking}
      fullWidth
    >
      {checking ? 'Checking for Updates...' : 'Check for Updates'}
    </Button>
  )
}
