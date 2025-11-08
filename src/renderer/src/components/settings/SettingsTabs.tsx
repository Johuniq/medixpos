/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import {
  Assessment,
  AttachMoney,
  Business,
  CardMembership,
  Devices,
  Info,
  Inventory,
  LocalAtm,
  Notifications,
  People,
  PointOfSale,
  QrCodeScanner,
  Receipt,
  Security,
  Settings,
  Storage,
  Store
} from '@mui/icons-material'
import { Paper, Tab, Tabs } from '@mui/material'

interface SettingsTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  canAccessBackup: boolean
}

export default function SettingsTabs({
  activeTab,
  onTabChange,
  canAccessBackup
}: SettingsTabsProps): React.JSX.Element {
  const handleChange = (_event: React.SyntheticEvent, newValue: string): void => {
    onTabChange(newValue)
  }

  return (
    <Paper sx={{ mb: 3 }}>
      <Tabs
        value={activeTab}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Tab
          value="general"
          label="General"
          icon={<Store />}
          iconPosition="start"
          sx={{ minHeight: 64 }}
        />
        <Tab
          value="business"
          label="Business Info"
          icon={<Business />}
          iconPosition="start"
          sx={{ minHeight: 64 }}
        />
        <Tab
          value="invoice"
          label="Invoice & Receipt"
          icon={<Receipt />}
          iconPosition="start"
          sx={{ minHeight: 64 }}
        />
        <Tab
          value="inventory"
          label="Inventory & Stock"
          icon={<Inventory />}
          iconPosition="start"
          sx={{ minHeight: 64 }}
        />
        <Tab
          value="pricing"
          label="Pricing & Discounts"
          icon={<AttachMoney />}
          iconPosition="start"
          sx={{ minHeight: 64 }}
        />
        <Tab
          value="notifications"
          label="Notifications"
          icon={<Notifications />}
          iconPosition="start"
          sx={{ minHeight: 64 }}
        />
        <Tab
          value="security"
          label="Security"
          icon={<Security />}
          iconPosition="start"
          sx={{ minHeight: 64 }}
        />
        <Tab
          value="pos"
          label="POS Settings"
          icon={<PointOfSale />}
          iconPosition="start"
          sx={{ minHeight: 64 }}
        />
        <Tab
          value="customers"
          label="Customers"
          icon={<People />}
          iconPosition="start"
          sx={{ minHeight: 64 }}
        />
        <Tab
          value="reports"
          label="Reports"
          icon={<Assessment />}
          iconPosition="start"
          sx={{ minHeight: 64 }}
        />
        <Tab
          value="hardware"
          label="Hardware"
          icon={<Devices />}
          iconPosition="start"
          sx={{ minHeight: 64 }}
        />
        <Tab
          value="barcode"
          label="Barcode Scanner"
          icon={<QrCodeScanner />}
          iconPosition="start"
          sx={{ minHeight: 64 }}
        />
        <Tab
          value="cash-drawer"
          label="Cash Drawer"
          icon={<LocalAtm />}
          iconPosition="start"
          sx={{ minHeight: 64 }}
        />
        <Tab
          value="system"
          label="System"
          icon={<Settings />}
          iconPosition="start"
          sx={{ minHeight: 64 }}
        />
        <Tab
          value="license"
          label="License"
          icon={<CardMembership />}
          iconPosition="start"
          sx={{ minHeight: 64 }}
        />
        <Tab
          value="about"
          label="About"
          icon={<Info />}
          iconPosition="start"
          sx={{ minHeight: 64 }}
        />
        {canAccessBackup && (
          <Tab
            value="backup"
            label="Backup & Restore"
            icon={<Storage />}
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
        )}
      </Tabs>
    </Paper>
  )
}
