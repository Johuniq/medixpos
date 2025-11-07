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
    getLowStock: () => ipcRenderer.invoke('db:inventory:getLowStock'),
    updateQuantity: (productId: string, quantity: number) =>
      ipcRenderer.invoke('db:inventory:updateQuantity', { productId, quantity })
  },
  // Customers
  customers: {
    getAll: (search?: string) => ipcRenderer.invoke('db:customers:getAll', search),
    getByPhone: (phone: string) => ipcRenderer.invoke('db:customers:getByPhone', phone),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('db:customers:create', data),
    update: (id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:customers:update', { id, data }),
    recalculateStats: () => ipcRenderer.invoke('db:customers:recalculateStats')
  },
  // Sales
  sales: {
    create: (sale: Record<string, unknown>, items: Record<string, unknown>[]) =>
      ipcRenderer.invoke('db:sales:create', { sale, items }),
    getAll: (startDate?: string, endDate?: string) =>
      ipcRenderer.invoke('db:sales:getAll', { startDate, endDate }),
    getById: (id: string) => ipcRenderer.invoke('db:sales:getById', id)
  },
  // Sales Returns
  salesReturns: {
    create: (salesReturn: Record<string, unknown>, items: Record<string, unknown>[]) =>
      ipcRenderer.invoke('db:salesReturns:create', { salesReturn, items }),
    getAll: (startDate?: string, endDate?: string) =>
      ipcRenderer.invoke('db:salesReturns:getAll', { startDate, endDate }),
    getById: (id: string) => ipcRenderer.invoke('db:salesReturns:getById', id)
  },
  // Purchases
  purchases: {
    create: (purchase: Record<string, unknown>, items: Record<string, unknown>[]) =>
      ipcRenderer.invoke('db:purchases:create', { purchase, items }),
    getAll: (startDate?: string, endDate?: string) =>
      ipcRenderer.invoke('db:purchases:getAll', { startDate, endDate }),
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
    getById: (id: string) => ipcRenderer.invoke('db:purchaseReturns:getById', id)
  },
  // Damaged Items
  damagedItems: {
    getAll: () => ipcRenderer.invoke('db:damagedItems:getAll'),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('db:damagedItems:create', data)
  },
  // Expenses
  expenses: {
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('db:expenses:create', data),
    getAll: (startDate?: string, endDate?: string) =>
      ipcRenderer.invoke('db:expenses:getAll', { startDate, endDate })
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
      ipcRenderer.invoke('db:reports:topProducts', { startDate, endDate, limit })
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
  // Initial Setup
  setup: {
    getInitialCredentials: () => ipcRenderer.invoke('setup:getInitialCredentials'),
    clearInitialCredentials: () => ipcRenderer.invoke('setup:clearInitialCredentials')
  },
  auth: {
    invalidateSession: (token: string | null | undefined) =>
      ipcRenderer.invoke('auth:invalidateSession', token)
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
