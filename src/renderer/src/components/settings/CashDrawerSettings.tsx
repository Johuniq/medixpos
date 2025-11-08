/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import {
  CableOutlined,
  CheckCircleOutline,
  ErrorOutline,
  OpenInNew,
  RefreshOutlined,
  UsbOutlined
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface SerialPort {
  path: string
  manufacturer?: string
}

interface CashDrawerStatus {
  isConnected: boolean
  portPath: string | null
  baudRate: number
}

export default function CashDrawerSettings(): React.JSX.Element {
  const [ports, setPorts] = useState<SerialPort[]>([])
  const [selectedPort, setSelectedPort] = useState<string>('')
  const [baudRate, setBaudRate] = useState<number>(9600)
  const [commandType, setCommandType] = useState<'STANDARD' | 'ALTERNATIVE' | 'EPSON' | 'STAR'>(
    'STANDARD'
  )
  const [status, setStatus] = useState<CashDrawerStatus>({
    isConnected: false,
    portPath: null,
    baudRate: 9600
  })
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [openOnSale, setOpenOnSale] = useState(false)

  // Load ports and status on mount
  useEffect(() => {
    loadPorts()
    loadStatus()
    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadPorts = async (): Promise<void> => {
    try {
      const result = await window.api.cashDrawer.listPorts()
      if (result.success && result.ports) {
        setPorts(result.ports)
      }
    } catch {
      console.error('Failed to load ports:', error)
    }
  }

  const loadStatus = async (): Promise<void> => {
    try {
      const result = await window.api.cashDrawer.getStatus()
      if (result.success && result.status) {
        setStatus(result.status)
        if (result.status.portPath) {
          setSelectedPort(result.status.portPath)
          setBaudRate(result.status.baudRate)
        }
      }
    } catch {
      console.error('Failed to load status:', error)
    }
  }

  const loadSettings = async (): Promise<void> => {
    try {
      const enabledResult = await window.api.settings.get('cash_drawer_enabled')
      const commandResult = await window.api.settings.get('cash_drawer_command_type')

      if (enabledResult) {
        setOpenOnSale(enabledResult.value === 'true')
      }
      if (commandResult) {
        setCommandType((commandResult.value as typeof commandType) || 'STANDARD')
      }
    } catch {
      // Settings not found, use defaults
    }
  }

  const handleConnect = async (): Promise<void> => {
    if (!selectedPort) {
      toast.error('Please select a serial port')
      return
    }

    setLoading(true)
    try {
      const result = await window.api.cashDrawer.connect(selectedPort, baudRate)
      if (result.success) {
        toast.success(result.message || 'Connected to cash drawer')
        await loadStatus()
      } else {
        toast.error(result.error || 'Failed to connect')
      }
    } catch {
      toast.error('Connection failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async (): Promise<void> => {
    setLoading(true)
    try {
      const result = await window.api.cashDrawer.disconnect()
      if (result.success) {
        toast.success(result.message || 'Disconnected from cash drawer')
        await loadStatus()
      } else {
        toast.error(result.error || 'Failed to disconnect')
      }
    } catch {
      toast.error('Disconnection failed')
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async (): Promise<void> => {
    setTesting(true)
    try {
      const result = await window.api.cashDrawer.open(commandType)
      if (result.success) {
        toast.success('Cash drawer opened! Did it work?', { duration: 4000 })
      } else {
        toast.error(result.error || 'Failed to open drawer')
      }
    } catch {
      toast.error('Test failed')
    } finally {
      setTesting(false)
    }
  }

  const handleAutoConnect = async (): Promise<void> => {
    setLoading(true)
    try {
      await loadPorts()
      const result = await window.api.cashDrawer.autoConnect()
      if (result.success) {
        toast.success(result.message || 'Auto-connected successfully')
        await loadStatus()
      } else {
        toast.error(result.error || 'Auto-connect failed')
      }
    } catch {
      toast.error('Auto-connect failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async (): Promise<void> => {
    try {
      await window.api.settings.update('cash_drawer_enabled', openOnSale ? 'true' : 'false')
      await window.api.settings.update('cash_drawer_command_type', commandType)
      toast.success('Settings saved successfully')
    } catch {
      toast.error('Failed to save settings')
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Cash Drawer Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure serial port connection for your cash drawer
      </Typography>

      {/* Status Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6">Connection Status</Typography>
            <Chip
              icon={status.isConnected ? <CheckCircleOutline /> : <ErrorOutline />}
              label={status.isConnected ? 'Connected' : 'Disconnected'}
              color={status.isConnected ? 'success' : 'default'}
              size="small"
            />
          </Box>

          {status.isConnected && status.portPath && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Port:</strong> {status.portPath}
              </Typography>
              <Typography variant="body2">
                <strong>Baud Rate:</strong> {status.baudRate}
              </Typography>
            </Alert>
          )}

          {!status.isConnected && (
            <Alert severity="info">
              No cash drawer connected. Select a serial port below to connect.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Connection Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Serial Port Configuration
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshOutlined />}
            onClick={loadPorts}
            disabled={loading}
          >
            Refresh Ports
          </Button>
          <Button
            variant="outlined"
            startIcon={<UsbOutlined />}
            onClick={handleAutoConnect}
            disabled={loading}
          >
            Auto-Connect
          </Button>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Serial Port</InputLabel>
            <Select
              value={selectedPort}
              label="Serial Port"
              onChange={(e: SelectChangeEvent) => setSelectedPort(e.target.value)}
              disabled={loading || status.isConnected}
            >
              {ports.length === 0 ? (
                <MenuItem value="">
                  <em>No ports found</em>
                </MenuItem>
              ) : (
                ports.map((port) => (
                  <MenuItem key={port.path} value={port.path}>
                    {port.path} {port.manufacturer && `(${port.manufacturer})`}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          <TextField
            label="Baud Rate"
            type="number"
            value={baudRate}
            onChange={(e) => setBaudRate(Number(e.target.value))}
            disabled={loading || status.isConnected}
            fullWidth
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {!status.isConnected ? (
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <CableOutlined />}
              onClick={handleConnect}
              disabled={loading || !selectedPort}
            >
              Connect
            </Button>
          ) : (
            <Button variant="outlined" color="error" onClick={handleDisconnect} disabled={loading}>
              Disconnect
            </Button>
          )}
        </Box>
      </Paper>

      {/* Drawer Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Drawer Behavior
        </Typography>

        <FormControlLabel
          control={
            <Switch checked={openOnSale} onChange={(e) => setOpenOnSale(e.target.checked)} />
          }
          label="Automatically open drawer on sale completion"
        />

        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Kick Command Type</InputLabel>
          <Select
            value={commandType}
            label="Kick Command Type"
            onChange={(e: SelectChangeEvent) =>
              setCommandType(e.target.value as typeof commandType)
            }
          >
            <MenuItem value="STANDARD">Standard (ESC p 0)</MenuItem>
            <MenuItem value="ALTERNATIVE">Alternative (ESC p 1)</MenuItem>
            <MenuItem value="EPSON">Epson</MenuItem>
            <MenuItem value="STAR">Star Micronics</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" onClick={handleSaveSettings} sx={{ mt: 2 }}>
          Save Settings
        </Button>
      </Paper>

      {/* Test Drawer */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Cash Drawer
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click the button below to send an open command to your cash drawer.
        </Typography>

        <Button
          variant="contained"
          color="secondary"
          startIcon={testing ? <CircularProgress size={20} /> : <OpenInNew />}
          onClick={handleTest}
          disabled={!status.isConnected || testing}
        >
          Open Drawer Now
        </Button>
      </Paper>
    </Box>
  )
}
