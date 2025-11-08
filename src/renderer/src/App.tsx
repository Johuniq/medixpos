/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'

import { notificationService } from './services/notificationService'
import { useAuthStore } from './store/authStore'
import { useSettingsStore } from './store/settingsStore'

// Components
import AutoUpdateNotifier from './components/AutoUpdateNotifier'
import Layout from './components/Layout'
import LicenseGuard from './components/LicenseGuard'
import { ToastContainer } from './components/notifications'
import OnboardingGuard from './components/OnboardingGuard'
import PageGuard from './components/PageGuard'
import ProtectedRoute from './components/ProtectedRoute'
import SessionChecker from './components/SessionChecker'
import TourManager from './components/TourManager'
import AuditLogs from './pages/AuditLogs'
import BankAccounts from './pages/BankAccounts'
import Batches from './pages/Batches'
import CategoryUnit from './pages/CategoryUnit'
import Customers from './pages/Customers'
import Dashboard from './pages/Dashboard'
import ExpiryReports from './pages/ExpiryReports'
import Inventory from './pages/Inventory'
import Login from './pages/Login'
import POS from './pages/POS'
import Prescriptions from './pages/Prescriptions'
import Products from './pages/Products'
import Purchases from './pages/Purchases'
import Reports from './pages/Reports'
import Returns from './pages/Returns'
import Sales from './pages/Sales'
import Settings from './pages/Settings'
import SupplierLedger from './pages/SupplierLedger'
import Suppliers from './pages/Suppliers'
import Users from './pages/Users'

function AuthRoute({ children }: { children: React.ReactNode }): React.JSX.Element {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App(): React.JSX.Element {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const loadSettings = useSettingsStore((state) => state.loadSettings)

  useEffect(() => {
    if (isAuthenticated) {
      loadSettings()
      // Start notification monitoring for authenticated users
      notificationService.startPeriodicChecks()

      return () => {
        // Cleanup when user logs out or app unmounts
        notificationService.stopPeriodicChecks()
      }
    }
    return
  }, [isAuthenticated, loadSettings])

  return (
    <LicenseGuard>
      <HashRouter>
        <Toaster position="top-right" />
        <ToastContainer />
        <SessionChecker />
        <TourManager />
        <AutoUpdateNotifier />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <AuthRoute>
                <OnboardingGuard>
                  <Layout />
                </OnboardingGuard>
              </AuthRoute>
            }
          >
            <Route
              index
              element={
                <ProtectedRoute permission="view_dashboard">
                  <PageGuard pageId="/">
                    <Dashboard />
                  </PageGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="pos"
              element={
                <ProtectedRoute permission="create_sale">
                  <PageGuard pageId="/pos">
                    <POS />
                  </PageGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="products"
              element={
                <ProtectedRoute permission="view_products">
                  <PageGuard pageId="/products">
                    <Products />
                  </PageGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="categories-units"
              element={
                <ProtectedRoute permission="view_products">
                  <PageGuard pageId="/categories-units">
                    <CategoryUnit />
                  </PageGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="suppliers"
              element={
                <ProtectedRoute permission="view_products">
                  <PageGuard pageId="/suppliers">
                    <Suppliers />
                  </PageGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="supplier-ledger"
              element={
                <ProtectedRoute permission="view_products">
                  <PageGuard pageId="/supplier-ledger">
                    <SupplierLedger />
                  </PageGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="inventory"
              element={
                <ProtectedRoute permission="view_inventory">
                  <PageGuard pageId="/inventory">
                    <Inventory />
                  </PageGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="batches"
              element={
                <ProtectedRoute permission="view_inventory">
                  <PageGuard pageId="/batches">
                    <Batches />
                  </PageGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="expiry-reports"
              element={
                <ProtectedRoute permission="view_inventory">
                  <PageGuard pageId="/expiry-reports">
                    <ExpiryReports />
                  </PageGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="sales"
              element={
                <ProtectedRoute permission="view_sales">
                  <PageGuard pageId="/sales">
                    <Sales />
                  </PageGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="purchases"
              element={
                <ProtectedRoute permission="view_purchases">
                  <PageGuard pageId="/purchases">
                    <Purchases />
                  </PageGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="returns"
              element={
                <ProtectedRoute permission="view_purchases">
                  <PageGuard pageId="/returns">
                    <Returns />
                  </PageGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="customers"
              element={
                <ProtectedRoute permission="view_customers">
                  <PageGuard pageId="/customers">
                    <Customers />
                  </PageGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="prescriptions"
              element={
                <ProtectedRoute permission="view_customers">
                  <PageGuard pageId="/prescriptions">
                    <Prescriptions />
                  </PageGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="bank-accounts"
              element={
                <ProtectedRoute permission="view_reports">
                  <PageGuard pageId="/bank-accounts">
                    <BankAccounts />
                  </PageGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute permission="view_reports">
                  <PageGuard pageId="/reports">
                    <Reports />
                  </PageGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute permission="view_users">
                  <PageGuard pageId="/users">
                    <Users />
                  </PageGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="audit-logs"
              element={
                <ProtectedRoute permission="view_users">
                  <PageGuard pageId="/audit-logs">
                    <AuditLogs />
                  </PageGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute permission="view_settings">
                  <PageGuard pageId="/settings">
                    <Settings />
                  </PageGuard>
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </HashRouter>
    </LicenseGuard>
  )
}

export default App
