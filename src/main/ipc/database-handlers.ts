/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

/**
 * Main IPC Database Handlers Registry
 *
 * This file serves as the central registration point for all database-related IPC handlers.
 * Each handler module is responsible for a specific domain following Single Responsibility Principle.
 *
 * Handler Modules:
 * - Users: User authentication, CRUD operations, password management
 * - Categories & Units: Product categories and measurement units
 * - Suppliers: Supplier management, payments, and ledger entries
 * - Products & Inventory: Product catalog and stock management
 * - Customers: Customer management
 * - Sales: Sales transactions and returns
 * - Purchases: Purchase orders and returns
 * - Bank Accounts: Financial account management
 * - Reports & Settings: Business reporting and application settings
 * - Database Utils: Backup, restore, and audit logs
 * - HR: Damaged items, attendance, salary, and leave management
 */

import { registerBankAccountHandlers } from './handlers/bank-account-handlers'
import { registerBarcodeHandlers } from './handlers/barcode-handlers'
import { registerCashDrawerHandlers } from './handlers/cash-drawer-handlers'
import { registerCategoryUnitHandlers } from './handlers/category-unit-handlers'
import { registerCustomerHandlers } from './handlers/customer-handlers'
import { registerDatabaseUtilsHandlers } from './handlers/database-utils-handlers'
import { setupFeatureLicensingHandlers } from './handlers/feature-licensing-handlers'
import { registerHRHandlers } from './handlers/hr-handlers'
import { setupNotificationHandlers } from './handlers/notification-handlers'
import { registerPrescriptionHandlers } from './handlers/prescription-handlers'
import { registerProductInventoryHandlers } from './handlers/product-inventory-handlers'
import { registerPurchaseHandlers } from './handlers/purchase-handlers'
import { registerReportsSettingsHandlers } from './handlers/reports-settings-handlers'
import { registerSalesHandlers } from './handlers/sales-handlers'
import { registerSupplierHandlers } from './handlers/supplier-handlers'
import { registerUsersHandlers } from './handlers/users-handlers'

/**
 * Registers all database IPC handlers
 * This is the main entry point that should be called during application initialization
 */
export function registerDatabaseHandlers(): void {
  // Register all handler modules
  registerUsersHandlers()
  registerCategoryUnitHandlers()
  registerSupplierHandlers()
  registerProductInventoryHandlers()
  registerCustomerHandlers()
  registerPrescriptionHandlers()
  registerSalesHandlers()
  registerPurchaseHandlers()
  registerBankAccountHandlers()
  registerReportsSettingsHandlers()
  registerDatabaseUtilsHandlers()
  registerHRHandlers()
  setupNotificationHandlers()
  setupFeatureLicensingHandlers()
  registerBarcodeHandlers()
  registerCashDrawerHandlers()
}
