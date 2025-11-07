/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import {
  ContentCopy,
  LocalPharmacy,
  Login as LoginIcon,
  Person,
  Visibility,
  VisibilityOff,
  VpnKey
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  TextField,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import ChangePasswordModal from '../components/ChangePasswordModal'
import { useAuthStore, type AuthenticatedUserResponse } from '../store/authStore'

type PendingPasswordUser = Pick<
  AuthenticatedUserResponse,
  'id' | 'username' | 'fullName' | 'mustChangePassword'
>

interface InitialCredentials {
  username: string
  password: string
  isFirstSetup: boolean
}

export default function Login(): React.JSX.Element {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<PendingPasswordUser | null>(null)
  const [initialCredentials, setInitialCredentials] = useState<InitialCredentials | null>(null)
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const applyAuthenticatedUser = useAuthStore((state) => state.applyAuthenticatedUser)

  // Check for initial setup credentials on mount and when window gains focus
  useEffect(() => {
    const loadInitialCredentials = async (): Promise<void> => {
      try {
        const creds = await window.api.setup.getInitialCredentials()
        if (creds && creds.isFirstSetup) {
          setInitialCredentials(creds)
          // Auto-fill the credentials
          setUsername(creds.username)
          setPassword(creds.password)
        }
      } catch (error) {
        console.error('Failed to load initial credentials:', error)
      }
    }

    // Load immediately on mount
    loadInitialCredentials()

    // Also check when window gains focus (handles case where license was just activated)
    const handleFocus = (): void => {
      loadInitialCredentials()
    }

    window.addEventListener('focus', handleFocus)

    // Also do a delayed check in case database was just initialized
    const timer = setTimeout(() => {
      loadInitialCredentials()
    }, 1000)

    return () => {
      window.removeEventListener('focus', handleFocus)
      clearTimeout(timer)
    }
  }, [])

  const handleCopyCredential = (text: string, type: string): void => {
    navigator.clipboard.writeText(text)
    toast.success(`${type} copied to clipboard`)
  }

  const handleDismissInitialCredentials = async (): Promise<void> => {
    try {
      await window.api.setup.clearInitialCredentials()
      setInitialCredentials(null)
      toast.success('Initial credentials cleared')
    } catch (error) {
      console.error('Failed to clear initial credentials:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!username || !password) {
      toast.error('Please enter username and password')
      return
    }

    setLoading(true)
    try {
      const authenticatedUser = (await window.api.users.authenticate(
        username,
        password
      )) as AuthenticatedUserResponse | null

      if (authenticatedUser) {
        // Clear initial credentials after successful first login
        if (initialCredentials) {
          await window.api.setup.clearInitialCredentials()
          setInitialCredentials(null)
        }

        // Log successful login attempt
        await window.api.auditLogs.create({
          userId: authenticatedUser.id,
          username: authenticatedUser.username,
          action: 'login',
          entityType: 'auth',
          entityName: authenticatedUser.fullName || authenticatedUser.username
        })

        // Check if user must change password
        if (authenticatedUser.mustChangePassword) {
          setLoggedInUser({
            id: authenticatedUser.id,
            username: authenticatedUser.username,
            fullName: authenticatedUser.fullName,
            mustChangePassword: authenticatedUser.mustChangePassword
          })
          setShowChangePassword(true)
          toast('You must change your password before continuing', {
            icon: 'ℹ️',
            duration: 5000
          })
        } else {
          // Normal login flow
          applyAuthenticatedUser(authenticatedUser)
          toast.success('Login successful!')
          navigate('/')
        }
      } else {
        toast.error('Invalid username or password')
      }
    } catch {
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChanged = async (): Promise<void> => {
    setShowChangePassword(false)
    // Complete login after password change
    const success = await login(username, password)
    if (success) {
      toast.success('Password changed! Logging in...')
      navigate('/')
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
        p: 2
      }}
    >
      <Container maxWidth="sm">
        {/* Logo and Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              bgcolor: 'primary.main',
              borderRadius: 2,
              mb: 2
            }}
          >
            <LocalPharmacy sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography variant="h4" fontWeight="600" color="text.primary" gutterBottom>
            MedixPOS
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pharmacy Management System
          </Typography>
        </Box>

        {/* Initial Setup Credentials Alert */}
        {initialCredentials && (
          <Alert
            severity="info"
            sx={{ mb: 3 }}
            onClose={handleDismissInitialCredentials}
            action={
              <Button size="small" color="inherit" onClick={handleDismissInitialCredentials}>
                Got It
              </Button>
            }
          >
            <Typography variant="subtitle2" fontWeight="600" gutterBottom>
              🎉 First Time Setup Complete
            </Typography>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              Your admin account has been created with the credentials below. Please change the
              password after logging in.
            </Typography>
            <Box
              sx={{
                bgcolor: 'rgba(0, 0, 0, 0.05)',
                p: 2,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="body2" fontWeight="600">
                  Username:
                </Typography>
                <Typography variant="body2">{initialCredentials.username}</Typography>
                <IconButton
                  size="small"
                  onClick={() => handleCopyCredential(initialCredentials.username, 'Username')}
                  sx={{ ml: 'auto' }}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight="600">
                  Password:
                </Typography>
                <Typography variant="body2">{initialCredentials.password}</Typography>
                <IconButton
                  size="small"
                  onClick={() => handleCopyCredential(initialCredentials.password, 'Password')}
                  sx={{ ml: 'auto' }}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Alert>
        )}

        {/* Login Card */}
        <Card elevation={0} sx={{ borderRadius: 2, border: 1, borderColor: 'divider' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight="500" gutterBottom align="center" sx={{ mb: 3 }}>
              Sign In
            </Typography>

            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Username Field */}
                <TextField
                  fullWidth
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                  placeholder="Enter your username"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    )
                  }}
                />

                {/* Password Field */}
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKey color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          disabled={loading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={
                    loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />
                  }
                  sx={{ py: 1.5, mt: 1 }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © 2025 Johuniq. All rights reserved.
          </Typography>
        </Box>
      </Container>

      {/* Change Password Modal */}
      {showChangePassword && loggedInUser && (
        <ChangePasswordModal
          userId={loggedInUser.id}
          username={loggedInUser.username}
          onSuccess={handlePasswordChanged}
          isFirstLogin={true}
        />
      )}
    </Box>
  )
}
