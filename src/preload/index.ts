/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  // License Management
  license: {
    validate: (licenseKey?: string, activationId?: string) =>
      ipcRenderer.invoke('license:validate', licenseKey, activationId),
    activate: (licenseKey: string, label?: string, sessionToken?: string) =>
      ipcRenderer.invoke('license:activate', { licenseKey, label, sessionToken }),
    deactivate: (sessionToken?: string) =>
      ipcRenderer.invoke('license:deactivate', { sessionToken }),
    getInfo: () => ipcRenderer.invoke('license:getInfo'),
    needsRevalidation: () => ipcRenderer.invoke('license:needsRevalidation'),
    clear: (sessionToken?: string) => ipcRenderer.invoke('license:clear', { sessionToken }),
    getMachineId: () => ipcRenderer.invoke('license:getMachineId')
  },
  // Users
  users: {
    getAll: () => ipcRenderer.invoke('db:users:getAll'),
    getById: (id: string) => ipcRenderer.invoke('db:users:getById', id),
    authenticate: (username: string, password: string) =>
      ipcRenderer.invoke('db:users:authenticate', { username, password }),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('db:users:create', data),
    update: (id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:users:update', { id, data }),
    delete: (id: string) => ipcRenderer.invoke('db:users:delete', id),
    changePassword: (userId: string, currentPassword: string, newPassword: string) =>
      ipcRenderer.invoke('db:users:changePassword', { userId, currentPassword, newPassword }),
    resetPassword: (userId: string, newPassword: string, adminId: string) =>
      ipcRenderer.invoke('db:users:resetPassword', { userId, newPassword, adminId })
  },
  // Categories
  categories: {
    getAll: () => ipcRenderer.invoke('db:categories:getAll'),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('db:categories:create', data),
    update: (id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:categories:update', { id, data }),
    delete: (id: string) => ipcRenderer.invoke('db:categories:delete', id)
  },
  // Units
  units: {
    getAll: () => ipcRenderer.invoke('db:units:getAll'),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('db:units:create', data),
    update: (id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:units:update', { id, data }),
    delete: (id: string) => ipcRenderer.invoke('db:units:delete', id)
  },
  // Suppliers
  suppliers: {
    getAll: () => ipcRenderer.invoke('db:suppliers:getAll'),
    getPaginated: (params: { page?: number; limit?: number; search?: string }) =>
      ipcRenderer.invoke('db:suppliers:getPaginated', params),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('db:suppliers:create', data),
    update: (id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:suppliers:update', { id, data }),
    delete: (id: string) => ipcRenderer.invoke('db:suppliers:delete', id)
  },
  // Supplier Payments
  supplierPayments: {
    create: (data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:supplierPayments:create', data),
    getBySupplierId: (supplierId: string, startDate?: string, endDate?: string) =>
      ipcRenderer.invoke('db:supplierPayments:getBySupplierId', { supplierId, startDate, endDate })
  },
  // Supplier Ledger
  supplierLedger: {
    getEntries: (supplierId: string, startDate?: string, endDate?: string) =>
      ipcRenderer.invoke('db:supplierLedger:getEntries', { supplierId, startDate, endDate }),
    createEntry: (data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:supplierLedger:createEntry', data)
  },
  // Bank Accounts
  bankAccounts: {
    getAll: () => ipcRenderer.invoke('db:bankAccounts:getAll'),
    getPaginated: (params: { page?: number; limit?: number; search?: string }) =>
      ipcRenderer.invoke('db:bankAccounts:getPaginated', params),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('db:bankAccounts:create', data),
    update: (id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:bankAccounts:update', { id, data }),
    delete: (id: string) => ipcRenderer.invoke('db:bankAccounts:delete', id),
    updateBalance: (
      id: string,
      amount: number,
      type: 'debit' | 'credit',
      userId: string | null,
      username: string | null
    ) => ipcRenderer.invoke('db:bankAccounts:updateBalance', { id, amount, type, userId, username })
  },
  // Products
  products: {
    getAll: (search?: string) => ipcRenderer.invoke('db:products:getAll', search),
    getPaginated: (params: { page?: number; limit?: number; search?: string }) =>
      ipcRenderer.invoke('db:products:getPaginated', params),
    getById: (id: string) => ipcRenderer.invoke('db:products:getById', id),
    getByBarcode: (barcode: string) => ipcRenderer.invoke('db:products:getByBarcode', barcode),
    search: (search: string) => ipcRenderer.invoke('db:products:search', search),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('db:products:create', data),
    update: (id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:products:update', { id, data }),
    delete: (id: string) => ipcRenderer.invoke('db:products:delete', id)
  },
  // Inventory
  inventory: {
    getAll: () => ipcRenderer.invoke('db:inventory:getAll'),
    getPaginated: (params: { page?: number; limit?: number; search?: string }) =>
      ipcRenderer.invoke('db:inventory:getPaginated', params),
    getPaginatedWithBatches: (params: { page?: number; limit?: number; search?: string }) =>
      ipcRenderer.invoke('db:inventory:getPaginatedWithBatches', params),
    getLowStock: () => ipcRenderer.invoke('db:inventory:getLowStock'),
    getLowStockWithBatches: () => ipcRenderer.invoke('db:inventory:getLowStockWithBatches'),
    updateQuantity: (
      productId: string,
      quantity: number,
      options?: { userId?: string; username?: string; version?: number }
    ) =>
      ipcRenderer.invoke('db:inventory:updateQuantity', {
        productId,
        quantity,
        userId: options?.userId,
        username: options?.username,
        version: options?.version
      })
  },
  // Batches
  batches: {
    create: (data: {
      productId: string
      batchNumber: string
      quantity: number
      expiryDate: string
      manufactureDate?: string
      unitCost?: number
      purchaseId?: string
    }) => ipcRenderer.invoke('batch:create', data),
    getByProduct: (productId: string) => ipcRenderer.invoke('batch:getByProduct', productId),
    selectForSale: (productId: string, quantity: number) =>
      ipcRenderer.invoke('batch:selectForSale', productId, quantity),
    update: (data: { id: string; quantity: number; version: number; reason?: string }) =>
      ipcRenderer.invoke('batch:update', data),
    delete: (batchId: string) => ipcRenderer.invoke('batch:delete', batchId),
    getExpiring: (days?: number) => ipcRenderer.invoke('batch:getExpiring', days),
    getAll: (options?: { page?: number; limit?: number; productId?: string }) =>
      ipcRenderer.invoke('batch:getAll', options),
    deductQuantity: (batchId: string, quantity: number, version: number) =>
      ipcRenderer.invoke('batch:deductQuantity', batchId, quantity, version),
    dispose: (input: { batchId: string; reason: string; userId?: string }) =>
      ipcRenderer.invoke('batch:dispose', input)
  },
  // Customers
  customers: {
    getAll: (search?: string) => ipcRenderer.invoke('db:customers:getAll', search),
    getPaginated: (params: { page?: number; limit?: number; search?: string }) =>
      ipcRenderer.invoke('db:customers:getPaginated', params),
    getById: (id: string) => ipcRenderer.invoke('db:customers:getById', id),
    getByPhone: (phone: string) => ipcRenderer.invoke('db:customers:getByPhone', phone),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('db:customers:create', data),
    update: (id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:customers:update', { id, data }),
    delete: (id: string) => ipcRenderer.invoke('db:customers:delete', id),
    recalculateStats: () => ipcRenderer.invoke('db:customers:recalculateStats')
  },
  // Prescriptions
  prescriptions: {
    getAll: (customerId?: string) => ipcRenderer.invoke('db:prescriptions:getAll', customerId),
    getPaginated: (params: {
      page?: number
      limit?: number
      search?: string
      customerId?: string
    }) => ipcRenderer.invoke('db:prescriptions:getPaginated', params),
    getById: (id: string) => ipcRenderer.invoke('db:prescriptions:getById', id),
    getByCustomer: (customerId: string) =>
      ipcRenderer.invoke('db:prescriptions:getByCustomer', customerId),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('db:prescriptions:create', data),
    update: (id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:prescriptions:update', { id, data }),
    delete: (id: string) => ipcRenderer.invoke('db:prescriptions:delete', id),
    search: (searchTerm: string) => ipcRenderer.invoke('db:prescriptions:search', searchTerm),
    getStats: () => ipcRenderer.invoke('db:prescriptions:getStats')
  },
  // Sales
  sales: {
    create: (sale: Record<string, unknown>, items: Record<string, unknown>[]) =>
      ipcRenderer.invoke('db:sales:create', { sale, items }),
    getAll: (startDate?: string, endDate?: string) =>
      ipcRenderer.invoke('db:sales:getAll', { startDate, endDate }),
    getPaginated: (params: {
      page?: number
      limit?: number
      startDate?: string
      endDate?: string
      search?: string
    }) => ipcRenderer.invoke('db:sales:getPaginated', params),
    getById: (id: string) => ipcRenderer.invoke('db:sales:getById', id),
    getByCustomer: (customerId: string) => ipcRenderer.invoke('db:sales:getByCustomer', customerId)
  },
  // Sales Returns
  salesReturns: {
    create: (salesReturn: Record<string, unknown>, items: Record<string, unknown>[]) =>
      ipcRenderer.invoke('db:salesReturns:create', { salesReturn, items }),
    getAll: (startDate?: string, endDate?: string) =>
      ipcRenderer.invoke('db:salesReturns:getAll', { startDate, endDate }),
    getPaginated: (params: {
      page?: number
      limit?: number
      search?: string
      startDate?: string
      endDate?: string
    }) => ipcRenderer.invoke('db:salesReturns:getPaginated', params),
    getById: (id: string) => ipcRenderer.invoke('db:salesReturns:getById', id)
  },
  // Purchases
  purchases: {
    create: (purchase: Record<string, unknown>, items: Record<string, unknown>[]) =>
      ipcRenderer.invoke('db:purchases:create', { purchase, items }),
    getAll: (startDate?: string, endDate?: string) =>
      ipcRenderer.invoke('db:purchases:getAll', { startDate, endDate }),
    getPaginated: (params: {
      page?: number
      limit?: number
      startDate?: string
      endDate?: string
      search?: string
    }) => ipcRenderer.invoke('db:purchases:getPaginated', params),
    getById: (id: string) => ipcRenderer.invoke('db:purchases:getById', id),
    delete: (id: string, userId: string) =>
      ipcRenderer.invoke('db:purchases:delete', { id, userId })
  },
  // Purchase Returns
  purchaseReturns: {
    create: (purchaseReturn: Record<string, unknown>, items: Record<string, unknown>[]) =>
      ipcRenderer.invoke('db:purchaseReturns:create', { purchaseReturn, items }),
    getAll: (startDate?: string, endDate?: string) =>
      ipcRenderer.invoke('db:purchaseReturns:getAll', { startDate, endDate }),
    getPaginated: (params: {
      page?: number
      limit?: number
      search?: string
      startDate?: string
      endDate?: string
    }) => ipcRenderer.invoke('db:purchaseReturns:getPaginated', params),
    getById: (id: string) => ipcRenderer.invoke('db:purchaseReturns:getById', id)
  },
  // Damaged Items
  damagedItems: {
    getAll: () => ipcRenderer.invoke('db:damagedItems:getAll'),
    getPaginated: (params: {
      page?: number
      limit?: number
      search?: string
      startDate?: string
      endDate?: string
    }) => ipcRenderer.invoke('db:damagedItems:getPaginated', params),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('db:damagedItems:create', data)
  },
  // Expenses
  expenses: {
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('db:expenses:create', data),
    getAll: (startDate?: string, endDate?: string) =>
      ipcRenderer.invoke('db:expenses:getAll', { startDate, endDate }),
    getPaginated: (params: {
      page?: number
      limit?: number
      search?: string
      startDate?: string
      endDate?: string
    }) => ipcRenderer.invoke('db:expenses:getPaginated', params)
  },
  // Settings
  settings: {
    getAll: () => ipcRenderer.invoke('db:settings:getAll'),
    get: (key: string) => ipcRenderer.invoke('db:settings:get', key),
    update: (key: string, value: string, userId?: string | null, username?: string | null) =>
      ipcRenderer.invoke('db:settings:update', { key, value, userId, username })
  },
  // Reports
  reports: {
    salesSummary: (startDate: string, endDate: string) =>
      ipcRenderer.invoke('db:reports:salesSummary', { startDate, endDate }),
    topProducts: (startDate: string, endDate: string, limit?: number) =>
      ipcRenderer.invoke('db:reports:topProducts', { startDate, endDate, limit }),
    profitMargin: (startDate: string, endDate: string) =>
      ipcRenderer.invoke('db:reports:profitMargin', { startDate, endDate }),
    vendorPerformance: (startDate: string, endDate: string) =>
      ipcRenderer.invoke('db:reports:vendorPerformance', { startDate, endDate }),
    employeePerformance: (startDate: string, endDate: string) =>
      ipcRenderer.invoke('db:reports:employeePerformance', { startDate, endDate }),
    slowMovingStock: (startDate: string, endDate: string) =>
      ipcRenderer.invoke('db:reports:slowMovingStock', { startDate, endDate }),
    paymentMethodAnalysis: (startDate: string, endDate: string) =>
      ipcRenderer.invoke('db:reports:paymentMethodAnalysis', { startDate, endDate }),
    peakHoursAnalysis: (startDate: string, endDate: string) =>
      ipcRenderer.invoke('db:reports:peakHoursAnalysis', { startDate, endDate }),
    customerRFMAnalysis: () => ipcRenderer.invoke('db:reports:customerRFMAnalysis'),
    yearOverYear: () => ipcRenderer.invoke('db:reports:yearOverYear')
  },
  // Audit Logs
  auditLogs: {
    getAll: (filters?: Record<string, unknown>) =>
      ipcRenderer.invoke('db:auditLogs:getAll', filters),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('db:auditLogs:create', data),
    getStats: () => ipcRenderer.invoke('db:auditLogs:getStats')
  },
  // Attendance
  attendance: {
    getAll: (filters?: Record<string, unknown>) =>
      ipcRenderer.invoke('db:attendance:getAll', filters),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('db:attendance:create', data),
    update: (id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:attendance:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('db:attendance:delete', id)
  },
  // Salaries
  salaries: {
    getAll: (userId?: string) => ipcRenderer.invoke('db:salaries:getAll', userId),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('db:salaries:create', data),
    update: (id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:salaries:update', id, data)
  },
  // Salary Payments
  salaryPayments: {
    getAll: (userId?: string) => ipcRenderer.invoke('db:salaryPayments:getAll', userId),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('db:salaryPayments:create', data)
  },
  // Leave Requests
  leaveRequests: {
    getAll: (filters?: Record<string, unknown>) =>
      ipcRenderer.invoke('db:leaveRequests:getAll', filters),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('db:leaveRequests:create', data),
    update: (id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:leaveRequests:update', id, data)
  },
  // Notifications
  notifications: {
    create: (input: {
      userId?: string | null
      title: string
      message: string
      type: 'info' | 'success' | 'warning' | 'error' | 'low_stock' | 'expiry' | 'sale' | 'purchase'
      category?: 'system' | 'inventory' | 'sales' | 'general' | 'alert'
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      actionUrl?: string
      actionText?: string
      metadata?: Record<string, unknown>
      expiresAt?: string
    }) => ipcRenderer.invoke('notifications:create', input),
    getByUser: (userId: string | null, limit?: number, offset?: number) =>
      ipcRenderer.invoke('notifications:getByUser', userId, limit, offset),
    getUnreadCount: (userId: string | null) =>
      ipcRenderer.invoke('notifications:getUnreadCount', userId),
    markAsRead: (notificationId: string) =>
      ipcRenderer.invoke('notifications:markAsRead', notificationId),
    delete: (notificationId: string) => ipcRenderer.invoke('notifications:delete', notificationId),
    createSystem: (title: string, message: string, type?: string, priority?: string) =>
      ipcRenderer.invoke('notifications:createSystem', title, message, type, priority)
  },
  // Feature Licensing
  featureLicensing: {
    initialize: () => ipcRenderer.invoke('feature-licensing:initialize'),
    getTier: () => ipcRenderer.invoke('feature-licensing:get-tier'),
    isFeatureEnabled: (featureId: string) =>
      ipcRenderer.invoke('feature-licensing:is-feature-enabled', featureId),
    canAccessPage: (route: string) =>
      ipcRenderer.invoke('feature-licensing:can-access-page', route),
    canRenderComponent: (componentName: string) =>
      ipcRenderer.invoke('feature-licensing:can-render-component', componentName),
    getFeatureLimitations: (featureId: string) =>
      ipcRenderer.invoke('feature-licensing:get-feature-limitations', featureId),
    checkFeatureLimits: (featureId: string, currentUsage: number) =>
      ipcRenderer.invoke('feature-licensing:check-feature-limits', featureId, currentUsage),
    getAvailableFeatures: () => ipcRenderer.invoke('feature-licensing:get-available-features'),
    getBlockedFeatures: () => ipcRenderer.invoke('feature-licensing:get-blocked-features'),
    getUpgradeSuggestions: (featureId: string) =>
      ipcRenderer.invoke('feature-licensing:get-upgrade-suggestions', featureId),
    validatePageAccess: (route: string) =>
      ipcRenderer.invoke('feature-licensing:validate-page-access', route),
    getLicenseStatus: () => ipcRenderer.invoke('feature-licensing:get-license-status'),
    forceRefresh: () => ipcRenderer.invoke('feature-licensing:force-refresh'),
    refreshStatus: () => ipcRenderer.invoke('feature-licensing:refresh-status')
  },
  // Initial Setup
  setup: {
    getInitialCredentials: () => ipcRenderer.invoke('setup:getInitialCredentials'),
    clearInitialCredentials: () => ipcRenderer.invoke('setup:clearInitialCredentials'),
    isOnboardingComplete: () => ipcRenderer.invoke('setup:isOnboardingComplete'),
    markOnboardingComplete: () => ipcRenderer.invoke('setup:markOnboardingComplete')
  },
  auth: {
    invalidateSession: (token: string | null | undefined) =>
      ipcRenderer.invoke('auth:invalidateSession', token)
  },
  // Auto Update
  autoUpdate: {
    checkForUpdates: () => ipcRenderer.invoke('auto-update:check'),
    downloadUpdate: () => ipcRenderer.invoke('auto-update:download'),
    installUpdate: () => ipcRenderer.invoke('auto-update:install'),
    getVersion: () => ipcRenderer.invoke('auto-update:get-version'),
    getStatus: () => ipcRenderer.invoke('auto-update:get-status'),
    onStatusChange: (callback: (event: string, data: Record<string, unknown>) => void) => {
      ipcRenderer.on('auto-update-status', (_event, payload) => {
        callback(payload.event, payload.data)
      })
    },
    removeStatusListener: () => {
      ipcRenderer.removeAllListeners('auto-update-status')
    }
  },
  // Barcode Scanner
  barcode: {
    validate: (barcode: string) => ipcRenderer.invoke('barcode:validate', barcode),
    searchProduct: (barcode: string) => ipcRenderer.invoke('barcode:searchProduct', barcode),
    getSettings: () => ipcRenderer.invoke('barcode:getSettings'),
    updateSettings: (settings: Record<string, string>) =>
      ipcRenderer.invoke('barcode:updateSettings', settings),
    test: (testBarcode: string) => ipcRenderer.invoke('barcode:test', testBarcode),
    getHistory: () => ipcRenderer.invoke('barcode:getHistory'),
    bulkValidate: (barcodes: string[]) => ipcRenderer.invoke('barcode:bulkValidate', barcodes)
  },

  // Cash Drawer
  cashDrawer: {
    listPorts: () => ipcRenderer.invoke('cash-drawer:list-ports'),
    connect: (portPath: string, baudRate?: number) =>
      ipcRenderer.invoke('cash-drawer:connect', portPath, baudRate),
    disconnect: () => ipcRenderer.invoke('cash-drawer:disconnect'),
    open: (commandType?: 'STANDARD' | 'ALTERNATIVE' | 'EPSON' | 'STAR') =>
      ipcRenderer.invoke('cash-drawer:open', commandType),
    test: () => ipcRenderer.invoke('cash-drawer:test'),
    getStatus: () => ipcRenderer.invoke('cash-drawer:get-status'),
    autoConnect: () => ipcRenderer.invoke('cash-drawer:auto-connect'),
    reconnect: () => ipcRenderer.invoke('cash-drawer:reconnect')
  },

  // Receipt Printer
  printer: {
    list: () => ipcRenderer.invoke('printer:list'),
    saveConfig: (config: Record<string, unknown>) =>
      ipcRenderer.invoke('printer:save-config', config),
    getConfigs: () => ipcRenderer.invoke('printer:get-configs'),
    getDefault: () => ipcRenderer.invoke('printer:get-default'),
    deleteConfig: (id: string) => ipcRenderer.invoke('printer:delete-config', id),
    test: (printerId: string) => ipcRenderer.invoke('printer:test', printerId),
    printReceipt: (saleId: string, printerId?: string) =>
      ipcRenderer.invoke('printer:print-receipt', saleId, printerId),
    reprintLast: () => ipcRenderer.invoke('printer:reprint-last'),
    getQueue: (limit?: number) => ipcRenderer.invoke('printer:get-queue', limit)
  },

  // Bulk Operations
  bulk: {
    importProducts: (data: {
      products: Record<string, unknown>[]
      userId: string
      username: string
    }) => ipcRenderer.invoke('bulk:import:products', data),
    importCustomers: (data: { customers: Record<string, unknown>[]; userId: string }) =>
      ipcRenderer.invoke('bulk:import:customers', data),
    updatePrices: (data: {
      productIds: string[]
      priceType: 'purchase' | 'sale'
      adjustmentType: 'percentage' | 'fixed'
      adjustmentValue: number
      userId: string
      username: string
    }) => ipcRenderer.invoke('bulk:update:prices', data),
    assignCategories: (data: { productIds: string[]; categoryId: string }) =>
      ipcRenderer.invoke('bulk:assign:categories', data),
    activate: (data: { entityType: 'products' | 'customers'; entityIds: string[] }) =>
      ipcRenderer.invoke('bulk:activate', data),
    deactivate: (data: { entityType: 'products' | 'customers'; entityIds: string[] }) =>
      ipcRenderer.invoke('bulk:deactivate', data),
    deleteEntities: (data: { entityType: 'products' | 'customers'; entityIds: string[] }) =>
      ipcRenderer.invoke('bulk:delete', data),
    validateImport: (data: {
      entityType: 'products' | 'customers'
      data: Record<string, unknown>[]
    }) => ipcRenderer.invoke('bulk:validate:import', data)
  },

  // Export Data
  export: {
    products: (options: {
      format: 'csv' | 'xlsx' | 'json'
      startDate?: string
      endDate?: string
      filters?: Record<string, unknown>
    }) => ipcRenderer.invoke('db:export:products', options),
    customers: (options: {
      format: 'csv' | 'xlsx' | 'json'
      startDate?: string
      endDate?: string
      filters?: Record<string, unknown>
    }) => ipcRenderer.invoke('db:export:customers', options),
    suppliers: (options: {
      format: 'csv' | 'xlsx' | 'json'
      startDate?: string
      endDate?: string
      filters?: Record<string, unknown>
    }) => ipcRenderer.invoke('db:export:suppliers', options),
    inventory: (options: {
      format: 'csv' | 'xlsx' | 'json'
      startDate?: string
      endDate?: string
      filters?: Record<string, unknown>
    }) => ipcRenderer.invoke('db:export:inventory', options),
    sales: (options: {
      format: 'csv' | 'xlsx' | 'json'
      startDate?: string
      endDate?: string
      filters?: Record<string, unknown>
    }) => ipcRenderer.invoke('db:export:sales', options),
    purchases: (options: {
      format: 'csv' | 'xlsx' | 'json'
      startDate?: string
      endDate?: string
      filters?: Record<string, unknown>
    }) => ipcRenderer.invoke('db:export:purchases', options)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Error exposing APIs:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
