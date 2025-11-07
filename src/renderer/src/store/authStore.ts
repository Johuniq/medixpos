/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useSettingsStore } from './settingsStore'

interface User {
  id: string
  username: string
  fullName: string
  email?: string
  role: 'super_admin' | 'admin' | 'manager' | 'cashier' | 'pharmacist'
  createdBy?: string
}

export interface AuthenticatedUserResponse extends User {
  mustChangePassword?: boolean
  sessionToken: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  lastActivity: number
  sessionToken: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  setUser: (user: User) => void
  applyAuthenticatedUser: (user: AuthenticatedUserResponse) => void
  updateActivity: () => void
  checkSessionTimeout: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      lastActivity: Date.now(),
      sessionToken: null,
      login: async (username: string, password: string) => {
        try {
          if (!window.api) {
            console.error('window.api not available in login')
            return false
          }
          const authenticatedUser = (await window.api.users.authenticate(
            username,
            password
          )) as AuthenticatedUserResponse | null

          if (authenticatedUser) {
            const { sessionToken, ...safeUser } = authenticatedUser
            set({
              user: safeUser,
              sessionToken,
              isAuthenticated: true,
              lastActivity: Date.now()
            })
            try {
              await window.api.auditLogs.create({
                userId: authenticatedUser.id,
                action: 'login',
                entityType: 'user',
                entityId: authenticatedUser.id
              })
            } catch (auditError) {
              console.error('Failed to create audit log:', auditError)
            }
            return true
          }
          return false
        } catch (error) {
          console.error('Login error:', error)
          return false
        }
      },
      logout: () => {
        try {
          const currentState = useAuthStore.getState()
          if (currentState.sessionToken && window.api) {
            window.api.auth.invalidateSession(currentState.sessionToken).catch((error) => {
              console.error('Failed to invalidate session token:', error)
            })
          }

          const currentUser = currentState.user
          if (currentUser && window.api) {
            window.api.auditLogs
              .create({
                userId: currentUser.id,
                username: currentUser.username,
                action: 'logout',
                entityType: 'auth',
                entityName: currentUser.fullName
              })
              .catch((error) => {
                console.error('Failed to create logout audit log:', error)
              })
          }
          set({ user: null, sessionToken: null, isAuthenticated: false })
        } catch (error) {
          console.error('Logout error:', error)
          set({ user: null, sessionToken: null, isAuthenticated: false })
        }
      },
      setUser: (user: User) => {
        set({ user, isAuthenticated: true, lastActivity: Date.now() })
      },
      applyAuthenticatedUser: (authenticatedUser: AuthenticatedUserResponse) => {
        const { sessionToken, ...safeUser } = authenticatedUser
        set({
          user: safeUser,
          sessionToken,
          isAuthenticated: true,
          lastActivity: Date.now()
        })
      },
      updateActivity: () => {
        set({ lastActivity: Date.now() })
      },
      checkSessionTimeout: () => {
        const state = get()
        if (!state.isAuthenticated) return false

        // Get session timeout from settings
        const settingsState = useSettingsStore.getState()
        const timeoutMinutes = settingsState.securitySessionTimeoutMinutes
        const timeoutMs = timeoutMinutes * 60 * 1000

        const elapsed = Date.now() - state.lastActivity
        if (elapsed > timeoutMs) {
          // Session expired, logout
          state.logout()
          return true
        }
        return false
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.sessionToken = null
        }
      }
    }
  )
)
