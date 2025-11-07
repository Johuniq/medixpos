import { ElectronAPI } from '@electron-toolkit/preload'

interface User {
  id: string
  username: string
  password?: string
  fullName: string
  email?: string
  phone?: string
  role: 'super_admin' | 'admin' | 'manager' | 'cashier' | 'pharmacist'
  createdBy?: string
  isActive?: boolean
  mustChangePassword?: boolean
}

interface API {
  license: {
    validate: (
      licenseKey?: string,
      activationId?: string
    ) => Promise<{
      valid: boolean
      status: 'active' | 'expired' | 'invalid' | 'inactive'
      expiresAt?: string
      usage?: number
      limitUsage?: number
      message?: string
      details?: Record<string, unknown>
    }>
    activate: (
      licenseKey: string,
      label?: string,
      sessionToken?: string
    ) => Promise<{ success: boolean; activationId?: string; message?: string }>
    deactivate: (sessionToken?: string) => Promise<{ success: boolean; message?: string }>
    getInfo: () => Promise<{
      isLicensed: boolean
      status?: string
      expiresAt?: string
      lastValidated?: string
      usage?: number
      limitUsage?: number
    }>
    needsRevalidation: () => Promise<boolean>
    clear: (sessionToken?: string) => Promise<{ success: boolean; message?: string }>
  }
  users: {
    getAll: () => Promise<User[]>
    getById: (id: string) => Promise<User | undefined>
    authenticate: (
      username: string,
      password: string
    ) => Promise<(User & { sessionToken: string; mustChangePassword?: boolean }) | null>
    create: (data: Partial<User>) => Promise<User>
    update: (id: string, data: Partial<User>) => Promise<User>
    delete: (id: string) => Promise<void>
    changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<User>
    resetPassword: (userId: string, newPassword: string, adminId: string) => Promise<User>
  }
  categories: {
    getAll: () => Promise<Record<string, unknown>[]>
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
    update: (id: string, data: Record<string, unknown>) => Promise<Record<string, unknown>>
    delete: (id: string) => Promise<void>
  }
  units: {
    getAll: () => Promise<Record<string, unknown>[]>
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
    update: (id: string, data: Record<string, unknown>) => Promise<Record<string, unknown>>
    delete: (id: string) => Promise<void>
  }
  suppliers: {
    getAll: () => Promise<Record<string, unknown>[]>
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
    update: (id: string, data: Record<string, unknown>) => Promise<Record<string, unknown>>
    delete: (id: string) => Promise<void>
  }
  supplierPayments: {
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
    getBySupplierId: (
      supplierId: string,
      startDate?: string,
      endDate?: string
    ) => Promise<Record<string, unknown>[]>
  }
  supplierLedger: {
    getEntries: (
      supplierId: string,
      startDate?: string,
      endDate?: string
    ) => Promise<Record<string, unknown>[]>
    createEntry: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
  }
  bankAccounts: {
    getAll: () => Promise<Record<string, unknown>[]>
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
    update: (id: string, data: Record<string, unknown>) => Promise<Record<string, unknown>>
    delete: (id: string) => Promise<void>
    updateBalance: (
      id: string,
      amount: number,
      type: 'debit' | 'credit',
      userId: string | null,
      username: string | null
    ) => Promise<Record<string, unknown>>
  }
  products: {
    getAll: (search?: string) => Promise<Record<string, unknown>[]>
    getById: (id: string) => Promise<Record<string, unknown>>
    getByBarcode: (barcode: string) => Promise<Record<string, unknown>>
    search: (search: string) => Promise<Record<string, unknown>[]>
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
    update: (id: string, data: Record<string, unknown>) => Promise<Record<string, unknown>>
    delete: (id: string) => Promise<void>
  }
  inventory: {
    getAll: () => Promise<Record<string, unknown>[]>
    getLowStock: () => Promise<Record<string, unknown>[]>
    updateQuantity: (productId: string, quantity: number) => Promise<Record<string, unknown>>
  }
  customers: {
    getAll: (search?: string) => Promise<Record<string, unknown>[]>
    getByPhone: (phone: string) => Promise<Record<string, unknown>>
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
    update: (id: string, data: Record<string, unknown>) => Promise<Record<string, unknown>>
    recalculateStats: () => Promise<{ success: boolean; message: string }>
  }
  sales: {
    create: (
      sale: Record<string, unknown>,
      items: Record<string, unknown>[]
    ) => Promise<Record<string, unknown>>
    getAll: (startDate?: string, endDate?: string) => Promise<Record<string, unknown>[]>
    getById: (id: string) => Promise<Record<string, unknown>>
  }
  salesReturns: {
    create: (
      salesReturn: Record<string, unknown>,
      items: Record<string, unknown>[]
    ) => Promise<Record<string, unknown>>
    getAll: (startDate?: string, endDate?: string) => Promise<Record<string, unknown>[]>
    getById: (id: string) => Promise<Record<string, unknown>>
  }
  purchases: {
    create: (
      purchase: Record<string, unknown>,
      items: Record<string, unknown>[]
    ) => Promise<Record<string, unknown>>
    getAll: (startDate?: string, endDate?: string) => Promise<Record<string, unknown>[]>
    getById: (id: string) => Promise<Record<string, unknown>>
    delete: (id: string, userId: string) => Promise<{ success: boolean; message: string }>
  }
  purchaseReturns: {
    create: (
      purchaseReturn: Record<string, unknown>,
      items: Record<string, unknown>[]
    ) => Promise<Record<string, unknown>>
    getAll: (startDate?: string, endDate?: string) => Promise<Record<string, unknown>[]>
    getById: (id: string) => Promise<Record<string, unknown>>
  }
  damagedItems: {
    getAll: () => Promise<Record<string, unknown>[]>
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
  }
  expenses: {
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
    getAll: (startDate?: string, endDate?: string) => Promise<Record<string, unknown>[]>
  }
  settings: {
    getAll: () => Promise<Record<string, unknown>[]>
    get: (key: string) => Promise<Record<string, unknown>>
    update: (
      key: string,
      value: string,
      userId?: string | null,
      username?: string | null
    ) => Promise<Record<string, unknown>>
  }
  reports: {
    salesSummary: (startDate: string, endDate: string) => Promise<Record<string, unknown>>
    topProducts: (
      startDate: string,
      endDate: string,
      limit?: number
    ) => Promise<Record<string, unknown>[]>
  }
  auditLogs: {
    getAll: (filters?: {
      startDate?: string
      endDate?: string
      action?: string
      entityType?: string
      userId?: string
    }) => Promise<Record<string, unknown>[]>
    create: (data: {
      userId?: string
      username?: string
      action: string
      entityType: string
      entityId?: string
      entityName?: string
      changes?: object
      ipAddress?: string
      userAgent?: string
    }) => Promise<{ success: boolean; id?: string; error?: string }>
    getStats: () => Promise<{
      totalLogs: number
      recentActivity: Record<string, unknown>[]
      userActivity: Record<string, unknown>[]
    }>
  }
  attendance: {
    getAll: (filters?: {
      userId?: string
      startDate?: string
      endDate?: string
    }) => Promise<Record<string, unknown>[]>
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
    update: (id: string, data: Record<string, unknown>) => Promise<Record<string, unknown>>
    delete: (id: string) => Promise<void>
  }
  salaries: {
    getAll: (userId?: string) => Promise<Record<string, unknown>[]>
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
    update: (id: string, data: Record<string, unknown>) => Promise<Record<string, unknown>>
  }
  salaryPayments: {
    getAll: (userId?: string) => Promise<Record<string, unknown>[]>
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
  }
  leaveRequests: {
    getAll: (filters?: { userId?: string; status?: string }) => Promise<Record<string, unknown>[]>
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
    update: (id: string, data: Record<string, unknown>) => Promise<Record<string, unknown>>
  }
  setup: {
    getInitialCredentials: () => Promise<{
      username: string
      password: string
      isFirstSetup: boolean
    } | null>
    clearInitialCredentials: () => Promise<{ success: boolean }>
  }
  auth: {
    invalidateSession: (token: string | null | undefined) => Promise<{ success: boolean }>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
