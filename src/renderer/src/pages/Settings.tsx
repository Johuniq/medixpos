/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { Box, CircularProgress, Container, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import LicenseActivation from '../components/LicenseActivation'
import LicenseInfo from '../components/LicenseInfo'
import BackupRestoreSection from '../components/settings/BackupRestoreSection'
import BusinessInfoSettings from '../components/settings/BusinessInfoSettings'
import CustomerSettings from '../components/settings/CustomerSettings'
import GeneralSettingsForm from '../components/settings/GeneralSettingsForm'
import HardwareSettings from '../components/settings/HardwareSettings'
import InvoiceReceiptSettings from '../components/settings/InvoiceReceiptSettings'
import NotificationSettings from '../components/settings/NotificationSettings'
import POSSettings from '../components/settings/POSSettings'
import PricingDiscountSettings from '../components/settings/PricingDiscountSettings'
import ReceiptSettingsForm from '../components/settings/ReceiptSettingsForm'
import ReportsSettings from '../components/settings/ReportsSettings'
import SecuritySettings from '../components/settings/SecuritySettings'
import SettingsTabs from '../components/settings/SettingsTabs'
import SystemSettingsForm from '../components/settings/SystemSettingsForm'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'

export default function Settings(): React.JSX.Element {
  const user = useAuthStore((state) => state.user)
  const updateSetting = useSettingsStore((state) => state.updateSetting)
  const loadSettingsFn = useSettingsStore((state) => state.loadSettings)
  const storeNameFromStore = useSettingsStore((state) => state.storeName)
  const storePhoneFromStore = useSettingsStore((state) => state.storePhone)
  const storeEmailFromStore = useSettingsStore((state) => state.storeEmail)
  const storeAddressFromStore = useSettingsStore((state) => state.storeAddress)
  const taxRateFromStore = useSettingsStore((state) => state.taxRate)
  const currencyFromStore = useSettingsStore((state) => state.currency)
  const receiptFooterFromStore = useSettingsStore((state) => state.receiptFooter)
  const lowStockThresholdFromStore = useSettingsStore((state) => state.lowStockThreshold)

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('general')
  const [backupRestoreLoading, setBackupRestoreLoading] = useState(false)
  const [activateLicenseDialogOpen, setActivateLicenseDialogOpen] = useState(false)

  // Check if user is admin or super_admin
  const canAccessBackup = user?.role === 'super_admin' || user?.role === 'admin'

  // Form states - initialize from store
  const [storeName, setStoreName] = useState(storeNameFromStore)
  const [storePhone, setStorePhone] = useState(storePhoneFromStore)
  const [storeEmail, setStoreEmail] = useState(storeEmailFromStore)
  const [storeAddress, setStoreAddress] = useState(storeAddressFromStore)
  const [taxRate, setTaxRate] = useState(taxRateFromStore.toString())
  const [currency, setCurrency] = useState(currencyFromStore)
  const [receiptFooter, setReceiptFooter] = useState(receiptFooterFromStore)
  const [lowStockThreshold, setLowStockThreshold] = useState(lowStockThresholdFromStore.toString())

  // All settings state - will be loaded from database
  const [allSettings, setAllSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    loadSettings()
    loadAllSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Update form when store changes
    setStoreName(storeNameFromStore)
    setStorePhone(storePhoneFromStore)
    setStoreEmail(storeEmailFromStore)
    setStoreAddress(storeAddressFromStore)
    setTaxRate(taxRateFromStore.toString())
    setCurrency(currencyFromStore)
    setReceiptFooter(receiptFooterFromStore)
    setLowStockThreshold(lowStockThresholdFromStore.toString())
  }, [
    storeNameFromStore,
    storePhoneFromStore,
    storeEmailFromStore,
    storeAddressFromStore,
    taxRateFromStore,
    currencyFromStore,
    receiptFooterFromStore,
    lowStockThresholdFromStore
  ])

  const loadSettings = async (): Promise<void> => {
    setLoading(true)
    try {
      await loadSettingsFn()
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const loadAllSettings = async (): Promise<void> => {
    try {
      const settings = (await window.api.settings.getAll()) as Array<{ key: string; value: string }>
      const settingsMap: Record<string, string> = {}
      settings.forEach((setting) => {
        settingsMap[setting.key] = setting.value
      })
      setAllSettings(settingsMap)
    } catch (error) {
      console.error('Failed to load all settings:', error)
    }
  }

  const handleSaveSettings = async (updates: Record<string, string>): Promise<void> => {
    const userId = user?.id ?? null
    const username = user?.username ?? user?.fullName ?? null
    try {
      await Promise.all(
        Object.entries(updates).map(([key, value]) =>
          window.api.settings.update(key, value, userId, username)
        )
      )

      // Update local state
      setAllSettings((prev) => ({ ...prev, ...updates }))

      // Update store for existing settings
      Object.entries(updates).forEach(([key, value]) => {
        updateSetting(key, value)
      })
    } catch (error) {
      console.error('Failed to save settings:', error)
      throw error
    }
  }

  const handleSaveGeneral = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      await handleSaveSettings({
        store_name: storeName,
        store_phone: storePhone,
        store_email: storeEmail,
        store_address: storeAddress
      })

      toast.success('General settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    }
  }

  const handleSaveSystem = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      await handleSaveSettings({
        tax_rate: taxRate,
        currency,
        low_stock_threshold: lowStockThreshold
      })

      toast.success('System settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    }
  }

  const handleSaveReceipt = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      await handleSaveSettings({ receipt_footer: receiptFooter })

      toast.success('Receipt settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    }
  }

  const handleBackup = async (): Promise<void> => {
    if (!canAccessBackup) {
      toast.error('You do not have permission to backup the database')
      return
    }

    try {
      setBackupRestoreLoading(true)
      const result = await window.electron.ipcRenderer.invoke('db:backup:create')

      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Backup failed:', error)
      toast.error('Failed to create backup')
    } finally {
      setBackupRestoreLoading(false)
    }
  }

  const handleRestore = async (): Promise<void> => {
    if (!canAccessBackup) {
      toast.error('You do not have permission to restore the database')
      return
    }

    const confirmed = confirm(
      'WARNING: Restoring a backup will replace your current database. ' +
        'A backup of your current database will be created automatically. ' +
        'Do you want to continue?'
    )

    if (!confirmed) {
      return
    }

    try {
      setBackupRestoreLoading(true)
      toast.loading('Opening file picker...', { duration: 1000 })

      const result = await window.electron.ipcRenderer.invoke('db:backup:restore')

      if (result.success) {
        toast.success(result.message, { duration: 3000 })
        if (result.requiresRestart) {
          toast.loading('Restarting application in 2 seconds...', { duration: 2000 })
          setTimeout(() => {
            window.electron.ipcRenderer.send('app:restart')
          }, 2000)
        }
      } else {
        if (result.message === 'Restore canceled') {
          toast('Restore canceled', { icon: 'ℹ️' })
        } else {
          toast.error(result.message)
        }
      }
    } catch (error) {
      console.error('Restore failed:', error)
      toast.error(
        `Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setBackupRestoreLoading(false)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'grey.100', minHeight: '100vh' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px'
          }}
        >
          <CircularProgress size={48} />
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            Loading settings...
          </Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'grey.100', minHeight: '100vh' }}>
      {/* Page Header */}
      <Box
        sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your pharmacy system settings
          </Typography>
        </Box>
      </Box>

      <SettingsTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        canAccessBackup={canAccessBackup}
      />

      {/* General Settings */}
      {activeTab === 'general' && (
        <GeneralSettingsForm
          storeName={storeName}
          storePhone={storePhone}
          storeEmail={storeEmail}
          storeAddress={storeAddress}
          onStoreNameChange={setStoreName}
          onStorePhoneChange={setStorePhone}
          onStoreEmailChange={setStoreEmail}
          onStoreAddressChange={setStoreAddress}
          onSubmit={handleSaveGeneral}
        />
      )}

      {/* System Settings */}
      {activeTab === 'system' && (
        <SystemSettingsForm
          taxRate={taxRate}
          currency={currency}
          lowStockThreshold={lowStockThreshold}
          onTaxRateChange={setTaxRate}
          onCurrencyChange={setCurrency}
          onLowStockThresholdChange={setLowStockThreshold}
          onSubmit={handleSaveSystem}
        />
      )}

      {/* Receipt Settings - Legacy */}
      {activeTab === 'receipt' && (
        <ReceiptSettingsForm
          receiptFooter={receiptFooter}
          onReceiptFooterChange={setReceiptFooter}
          onSubmit={handleSaveReceipt}
        />
      )}

      {/* Business Info Settings */}
      {activeTab === 'business' && (
        <BusinessInfoSettings initialValues={allSettings} onSave={handleSaveSettings} />
      )}

      {/* Invoice & Receipt Settings */}
      {activeTab === 'invoice' && (
        <InvoiceReceiptSettings initialValues={allSettings} onSave={handleSaveSettings} />
      )}

      {/* Inventory & Stock Settings */}
      {activeTab === 'inventory' && (
        <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Inventory & Stock Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure stock tracking, expiry alerts, and batch management settings from the
            Stock/Inventory tab above.
          </Typography>
        </Box>
      )}

      {/* Pricing & Discounts Settings */}
      {activeTab === 'pricing' && (
        <PricingDiscountSettings initialValues={allSettings} onSave={handleSaveSettings} />
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <NotificationSettings settings={allSettings} onSave={handleSaveSettings} />
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <SecuritySettings initialValues={allSettings} onSave={handleSaveSettings} />
      )}

      {/* POS Settings */}
      {activeTab === 'pos' && (
        <POSSettings initialValues={allSettings} onSave={handleSaveSettings} />
      )}

      {/* Reports Settings */}
      {activeTab === 'reports' && (
        <ReportsSettings settings={allSettings} onSave={handleSaveSettings} />
      )}

      {/* Hardware Settings */}
      {activeTab === 'hardware' && (
        <HardwareSettings settings={allSettings} onSave={handleSaveSettings} />
      )}

      {/* Customer Settings */}
      {activeTab === 'customers' && (
        <CustomerSettings settings={allSettings} onSave={handleSaveSettings} />
      )}

      {/* License Settings */}
      {activeTab === 'license' && (
        <LicenseInfo onActivateClick={() => setActivateLicenseDialogOpen(true)} />
      )}

      {/* Backup & Restore Settings */}
      {activeTab === 'backup' && canAccessBackup && (
        <BackupRestoreSection
          loading={backupRestoreLoading}
          onBackup={handleBackup}
          onRestore={handleRestore}
        />
      )}

      {/* License Activation Modal */}
      <LicenseActivation
        open={activateLicenseDialogOpen}
        onClose={() => setActivateLicenseDialogOpen(false)}
        onSuccess={() => setActivateLicenseDialogOpen(false)}
      />
    </Container>
  )
}
