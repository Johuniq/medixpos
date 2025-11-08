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
    getPaginated: (params: { page?: number; limit?: number; search?: string }) => Promise<{
      data: Record<string, unknown>[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>
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
    getPaginated: (params: { page?: number; limit?: number; search?: string }) => Promise<{
      data: Record<string, unknown>[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>
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
    getPaginated: (params: { page?: number; limit?: number; search?: string }) => Promise<{
      data: Record<string, unknown>[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>
    getById: (id: string) => Promise<Record<string, unknown>>
    getByBarcode: (barcode: string) => Promise<Record<string, unknown>>
    search: (search: string) => Promise<Record<string, unknown>[]>
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
    update: (id: string, data: Record<string, unknown>) => Promise<Record<string, unknown>>
    delete: (id: string) => Promise<void>
  }
  inventory: {
    getAll: () => Promise<Record<string, unknown>[]>
    getPaginated: (params: { page?: number; limit?: number; search?: string }) => Promise<{
      data: Record<string, unknown>[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>
    getPaginatedWithBatches: (params: {
      page?: number
      limit?: number
      search?: string
    }) => Promise<{
      data: Record<string, unknown>[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>
    getLowStock: () => Promise<Record<string, unknown>[]>
    getLowStockWithBatches: () => Promise<Record<string, unknown>[]>
    updateQuantity: (
      productId: string,
      quantity: number,
      options?: { userId?: string; username?: string; version?: number }
    ) => Promise<Record<string, unknown>>
  }
  batches: {
    create: (data: {
      productId: string
      batchNumber: string
      quantity: number
      expiryDate: string
      manufactureDate?: string
      unitCost?: number
      purchaseId?: string
    }) => Promise<{ success: boolean; id?: string; error?: string }>
    getByProduct: (productId: string) => Promise<{
      success: boolean
      batches?: Array<{
        id: string
        batchNumber: string
        quantity: number
        expiryDate: string
        manufactureDate?: string
        unitCost?: number
        version: number
        createdAt: string
        isExpired: boolean
        daysUntilExpiry: number
        expiryStatus: 'expired' | 'critical' | 'warning' | 'alert' | 'good'
      }>
      error?: string
    }>
    selectForSale: (
      productId: string,
      quantity: number
    ) => Promise<{
      success: boolean
      batches?: Array<{
        id: string
        batchNumber: string
        expiryDate: string
        quantityAvailable: number
        quantityToUse: number
        unitCost: number
        version: number
      }>
      totalQuantity?: number
      warning?: string
      error?: string
    }>
    update: (data: {
      id: string
      quantity: number
      version: number
      reason?: string
    }) => Promise<{ success: boolean; error?: string }>
    delete: (batchId: string) => Promise<{ success: boolean; error?: string }>
    getExpiring: (days?: number) => Promise<{
      success: boolean
      batches?: Array<{
        id: string
        batchNumber: string
        quantity: number
        expiryDate: string
        unitCost?: number
        productId: string
        productName?: string
        productSku?: string
        daysUntilExpiry: number
        valueAtRisk: number
        urgency: 'critical' | 'high' | 'medium'
      }>
      error?: string
    }>
    getAll: (options?: { page?: number; limit?: number; productId?: string }) => Promise<{
      success: boolean
      batches?: Record<string, unknown>[]
      pagination?: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
      error?: string
    }>
    deductQuantity: (
      batchId: string,
      quantity: number,
      version: number
    ) => Promise<{ success: boolean; newQuantity?: number; error?: string }>
  }
  customers: {
    getAll: (search?: string) => Promise<Record<string, unknown>[]>
    getPaginated: (params: { page?: number; limit?: number; search?: string }) => Promise<{
      data: Record<string, unknown>[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>
    getById: (id: string) => Promise<Record<string, unknown>>
    getByPhone: (phone: string) => Promise<Record<string, unknown>>
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
    update: (id: string, data: Record<string, unknown>) => Promise<Record<string, unknown>>
    delete: (id: string) => Promise<Record<string, unknown>>
    recalculateStats: () => Promise<{ success: boolean; message: string }>
  }
  prescriptions: {
    getAll: (customerId?: string) => Promise<Record<string, unknown>[]>
    getPaginated: (params: {
      page?: number
      limit?: number
      search?: string
      customerId?: string
    }) => Promise<{
      data: Record<string, unknown>[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>
    getById: (id: string) => Promise<Record<string, unknown>>
    getByCustomer: (customerId: string) => Promise<Record<string, unknown>[]>
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
    update: (id: string, data: Record<string, unknown>) => Promise<Record<string, unknown>>
    delete: (id: string) => Promise<{ success: boolean }>
    search: (searchTerm: string) => Promise<Record<string, unknown>[]>
    getStats: () => Promise<{
      total: number
      thisMonth: number
      withSales: number
    }>
  }
  sales: {
    create: (
      sale: Record<string, unknown>,
      items: Record<string, unknown>[]
    ) => Promise<Record<string, unknown>>
    getAll: (startDate?: string, endDate?: string) => Promise<Record<string, unknown>[]>
    getPaginated: (params: {
      page?: number
      limit?: number
      startDate?: string
      endDate?: string
      search?: string
    }) => Promise<{
      data: Record<string, unknown>[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>
    getById: (id: string) => Promise<Record<string, unknown>>
    getByCustomer: (customerId: string) => Promise<Record<string, unknown>[]>
  }
  salesReturns: {
    create: (
      salesReturn: Record<string, unknown>,
      items: Record<string, unknown>[]
    ) => Promise<Record<string, unknown>>
    getAll: (startDate?: string, endDate?: string) => Promise<Record<string, unknown>[]>
    getPaginated: (params: {
      page?: number
      limit?: number
      search?: string
      startDate?: string
      endDate?: string
    }) => Promise<{
      data: Record<string, unknown>[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>
    getById: (id: string) => Promise<Record<string, unknown>>
  }
  purchases: {
    create: (
      purchase: Record<string, unknown>,
      items: Record<string, unknown>[]
    ) => Promise<Record<string, unknown>>
    getAll: (startDate?: string, endDate?: string) => Promise<Record<string, unknown>[]>
    getPaginated: (params: {
      page?: number
      limit?: number
      startDate?: string
      endDate?: string
      search?: string
    }) => Promise<{
      data: Record<string, unknown>[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>
    getById: (id: string) => Promise<Record<string, unknown>>
    delete: (id: string, userId: string) => Promise<{ success: boolean; message: string }>
  }
  purchaseReturns: {
    create: (
      purchaseReturn: Record<string, unknown>,
      items: Record<string, unknown>[]
    ) => Promise<Record<string, unknown>>
    getAll: (startDate?: string, endDate?: string) => Promise<Record<string, unknown>[]>
    getPaginated: (params: {
      page?: number
      limit?: number
      search?: string
      startDate?: string
      endDate?: string
    }) => Promise<{
      data: Record<string, unknown>[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>
    getById: (id: string) => Promise<Record<string, unknown>>
  }
  damagedItems: {
    getAll: () => Promise<Record<string, unknown>[]>
    getPaginated: (params: {
      page?: number
      limit?: number
      search?: string
      startDate?: string
      endDate?: string
    }) => Promise<{
      data: Record<string, unknown>[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
  }
  expenses: {
    create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
    getAll: (startDate?: string, endDate?: string) => Promise<Record<string, unknown>[]>
    getPaginated: (params: {
      page?: number
      limit?: number
      search?: string
      startDate?: string
      endDate?: string
    }) => Promise<{
      data: Record<string, unknown>[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>
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
    profitMargin: (startDate: string, endDate: string) => Promise<Record<string, unknown>[]>
    vendorPerformance: (startDate: string, endDate: string) => Promise<Record<string, unknown>[]>
    employeePerformance: (startDate: string, endDate: string) => Promise<Record<string, unknown>[]>
    slowMovingStock: (startDate: string, endDate: string) => Promise<Record<string, unknown>[]>
    paymentMethodAnalysis: (
      startDate: string,
      endDate: string
    ) => Promise<Record<string, unknown>[]>
    peakHoursAnalysis: (startDate: string, endDate: string) => Promise<Record<string, unknown>[]>
    customerRFMAnalysis: () => Promise<Record<string, unknown>[]>
    yearOverYear: () => Promise<Record<string, unknown>>
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
    }) => Promise<{
      success: boolean
      data?: Record<string, unknown>
      error?: string
    }>
    getByUser: (
      userId: string | null,
      limit?: number,
      offset?: number
    ) => Promise<{
      success: boolean
      data?: Record<string, unknown>[]
      error?: string
    }>
    getUnreadCount: (userId: string | null) => Promise<{
      success: boolean
      data?: number
      error?: string
    }>
    markAsRead: (notificationId: string) => Promise<{
      success: boolean
      data?: Record<string, unknown>
      error?: string
    }>
    delete: (notificationId: string) => Promise<{
      success: boolean
      data?: Record<string, unknown>
      error?: string
    }>
    createSystem: (
      title: string,
      message: string,
      type?: string,
      priority?: string
    ) => Promise<{
      success: boolean
      data?: Record<string, unknown>
      error?: string
    }>
  }
  featureLicensing: {
    initialize: () => Promise<{ success: boolean; error?: string }>
    getTier: () => Promise<{
      success: boolean
      tier?: string
      tierInfo?: {
        name: string
        description: string
        color: string
        features: string[]
        limitations: string[]
        price?: string
      }
      error?: string
    }>
    isFeatureEnabled: (featureId: string) => Promise<{
      success: boolean
      enabled?: boolean
      error?: string
    }>
    canAccessPage: (route: string) => Promise<{
      success: boolean
      accessible?: boolean
      error?: string
    }>
    canRenderComponent: (componentName: string) => Promise<{
      success: boolean
      canRender?: boolean
      error?: string
    }>
    getFeatureLimitations: (featureId: string) => Promise<{
      success: boolean
      limitations?: {
        maxProducts?: number
        maxCustomers?: number
        maxUsers?: number
        maxSalesPerDay?: number
        maxBankAccounts?: number
        dataRetentionDays?: number
        reportsAccess?: 'basic' | 'advanced' | 'full'
        backupFrequency?: 'none' | 'weekly' | 'daily' | 'realtime'
        supportLevel?: 'community' | 'email' | 'priority' | 'dedicated'
      }
      error?: string
    }>
    checkFeatureLimits: (
      featureId: string,
      currentUsage: number
    ) => Promise<{
      success: boolean
      result?: {
        withinLimits: boolean
        limit?: number
        usage: number
        message?: string
      }
      error?: string
    }>
    getAvailableFeatures: () => Promise<{
      success: boolean
      features?: Array<{
        id: string
        name: string
        description: string
        category: string
        requiredTier: string
        isCore?: boolean
        limitations?: Record<string, unknown>
      }>
      error?: string
    }>
    getBlockedFeatures: () => Promise<{
      success: boolean
      features?: Array<{
        id: string
        name: string
        description: string
        category: string
        requiredTier: string
        isCore?: boolean
        limitations?: Record<string, unknown>
      }>
      error?: string
    }>
    getUpgradeSuggestions: (featureId: string) => Promise<{
      success: boolean
      suggestions?: {
        requiredTier: string
        tierInfo: {
          name: string
          description: string
          color: string
          features: string[]
          limitations: string[]
          price?: string
        }
        benefits: string[]
      }
      error?: string
    }>
    validatePageAccess: (route: string) => Promise<{
      success: boolean
      result?: {
        allowed: boolean
        redirectTo?: string
        message?: string
        upgradeInfo?: {
          requiredTier: string
          tierInfo: {
            name: string
            description: string
            color: string
            features: string[]
            limitations: string[]
            price?: string
          }
          benefits: string[]
        }
      }
      error?: string
    }>
    getLicenseStatus: () => Promise<{
      success: boolean
      status?: {
        isActive: boolean
        tier: string
        tierInfo: {
          name: string
          description: string
          color: string
          features: string[]
          limitations: string[]
          price?: string
        }
        expiresAt?: string
        daysRemaining?: number
      }
      error?: string
    }>
    forceRefresh: () => Promise<{ success: boolean; error?: string }>
    refreshStatus: () => Promise<{ success: boolean; error?: string }>
  }
  setup: {
    getInitialCredentials: () => Promise<{
      username: string
      password: string
      createdAt: string
      isFirstSetup: boolean
    } | null>
    clearInitialCredentials: () => Promise<{ success: boolean }>
    isOnboardingComplete: () => Promise<boolean>
    markOnboardingComplete: () => Promise<{ success: boolean }>
  }
  auth: {
    invalidateSession: (token: string | null | undefined) => Promise<{ success: boolean }>
  }
  autoUpdate: {
    checkForUpdates: () => Promise<{ success: boolean; error?: string }>
    downloadUpdate: () => Promise<{ success: boolean; error?: string }>
    installUpdate: () => Promise<{ success: boolean; error?: string }>
    getVersion: () => Promise<{ success: boolean; version: string }>
    getStatus: () => Promise<{
      success: boolean
      status: {
        isChecking: boolean
        isDownloading: boolean
        currentVersion: string
      }
    }>
    onStatusChange: (callback: (event: string, data: Record<string, unknown>) => void) => void
    removeStatusListener: () => void
  }
  barcode: {
    validate: (barcode: string) => Promise<{
      success: boolean
      data?: {
        isValid: boolean
        format?: string
        cleaned?: string
        error?: string
      }
      error?: string
    }>
    searchProduct: (barcode: string) => Promise<{
      success: boolean
      data?: {
        product: Record<string, unknown>
        inventory?: Record<string, unknown>
        barcode: string
        format: string
      }
      error?: string
      barcode?: string
      format?: string
    }>
    getSettings: () => Promise<{
      success: boolean
      data?: Record<string, string>
      error?: string
    }>
    updateSettings: (settings: Record<string, string>) => Promise<{
      success: boolean
      error?: string
    }>
    test: (testBarcode: string) => Promise<{
      success: boolean
      data?: {
        validation: {
          isValid: boolean
          format?: string
          cleaned?: string
          error?: string
        }
        searchResult?: Record<string, unknown>
        timestamp: string
      }
      error?: string
    }>
    getHistory: () => Promise<{
      success: boolean
      data?: Array<Record<string, unknown>>
      error?: string
    }>
    bulkValidate: (barcodes: string[]) => Promise<{
      success: boolean
      data?: Array<{
        barcode: string
        isValid: boolean
        format?: string
        cleaned?: string
        error?: string
      }>
      error?: string
    }>
  }

  cashDrawer: {
    listPorts: () => Promise<{
      success: boolean
      ports?: Array<{ path: string; manufacturer?: string }>
      error?: string
    }>
    connect: (
      portPath: string,
      baudRate?: number
    ) => Promise<{
      success: boolean
      message?: string
      error?: string
    }>
    disconnect: () => Promise<{
      success: boolean
      message?: string
      error?: string
    }>
    open: (commandType?: 'STANDARD' | 'ALTERNATIVE' | 'EPSON' | 'STAR') => Promise<{
      success: boolean
      message?: string
      error?: string
    }>
    test: () => Promise<{
      success: boolean
      message?: string
      error?: string
    }>
    getStatus: () => Promise<{
      success: boolean
      status?: {
        isConnected: boolean
        portPath: string | null
        baudRate: number
      }
      error?: string
    }>
    autoConnect: () => Promise<{
      success: boolean
      message?: string
      error?: string
    }>
    reconnect: () => Promise<{
      success: boolean
      message?: string
      error?: string
    }>
  }

  printer: {
    list: () => Promise<{
      success: boolean
      printers?: Array<{
        name: string
        type: string
        path: string
        status: string
      }>
      error?: string
    }>
    saveConfig: (config: Record<string, unknown>) => Promise<{
      success: boolean
      error?: string
    }>
    getConfigs: () => Promise<{
      success: boolean
      configs?: Array<Record<string, unknown>>
      error?: string
    }>
    getDefault: () => Promise<{
      success: boolean
      config?: Record<string, unknown> | null
      error?: string
    }>
    deleteConfig: (id: string) => Promise<{
      success: boolean
      error?: string
    }>
    test: (printerId: string) => Promise<{
      success: boolean
      error?: string
    }>
    printReceipt: (
      saleId: string,
      printerId?: string
    ) => Promise<{
      success: boolean
      error?: string
    }>
    reprintLast: () => Promise<{
      success: boolean
      error?: string
    }>
    getQueue: (limit?: number) => Promise<{
      success: boolean
      queue?: Array<Record<string, unknown>>
      error?: string
    }>
  }

  bulk: {
    importProducts: (data: {
      products: Record<string, unknown>[]
      userId: string
      username: string
    }) => Promise<{
      success: boolean
      imported: number
      failed: number
      errors: Array<{ row: number; field?: string; message: string }>
    }>
    importCustomers: (data: { customers: Record<string, unknown>[]; userId: string }) => Promise<{
      success: boolean
      imported: number
      failed: number
      errors: Array<{ row: number; field?: string; message: string }>
    }>
    updatePrices: (data: {
      productIds: string[]
      priceType: 'purchase' | 'sale'
      adjustmentType: 'percentage' | 'fixed'
      adjustmentValue: number
      userId: string
      username: string
    }) => Promise<{
      success: boolean
      updated: number
      errors: Array<{ id: string; message: string }>
    }>
    assignCategories: (data: { productIds: string[]; categoryId: string }) => Promise<{
      success: boolean
      updated: number
      errors: Array<{ id: string; message: string }>
    }>
    activate: (data: { entityType: 'products' | 'customers'; entityIds: string[] }) => Promise<{
      success: boolean
      updated: number
      errors: Array<{ id: string; message: string }>
    }>
    deactivate: (data: { entityType: 'products' | 'customers'; entityIds: string[] }) => Promise<{
      success: boolean
      updated: number
      errors: Array<{ id: string; message: string }>
    }>
    deleteEntities: (data: {
      entityType: 'products' | 'customers'
      entityIds: string[]
    }) => Promise<{
      success: boolean
      deleted: number
      errors: Array<{ id: string; message: string }>
    }>
    validateImport: (data: {
      entityType: 'products' | 'customers'
      data: Record<string, unknown>[]
    }) => Promise<{
      success: boolean
      valid: number
      invalid: number
      errors: Array<{ row: number; field?: string; message: string }>
    }>
  }

  export: {
    products: (options: {
      format: 'csv' | 'xlsx' | 'json'
      startDate?: string
      endDate?: string
      filters?: Record<string, unknown>
    }) => Promise<{
      success: boolean
      filePath?: string
      error?: string
      recordCount?: number
    }>
    customers: (options: {
      format: 'csv' | 'xlsx' | 'json'
      startDate?: string
      endDate?: string
      filters?: Record<string, unknown>
    }) => Promise<{
      success: boolean
      filePath?: string
      error?: string
      recordCount?: number
    }>
    suppliers: (options: {
      format: 'csv' | 'xlsx' | 'json'
      startDate?: string
      endDate?: string
      filters?: Record<string, unknown>
    }) => Promise<{
      success: boolean
      filePath?: string
      error?: string
      recordCount?: number
    }>
    inventory: (options: {
      format: 'csv' | 'xlsx' | 'json'
      startDate?: string
      endDate?: string
      filters?: Record<string, unknown>
    }) => Promise<{
      success: boolean
      filePath?: string
      error?: string
      recordCount?: number
    }>
    sales: (options: {
      format: 'csv' | 'xlsx' | 'json'
      startDate?: string
      endDate?: string
      filters?: Record<string, unknown>
    }) => Promise<{
      success: boolean
      filePath?: string
      error?: string
      recordCount?: number
    }>
    purchases: (options: {
      format: 'csv' | 'xlsx' | 'json'
      startDate?: string
      endDate?: string
      filters?: Record<string, unknown>
    }) => Promise<{
      success: boolean
      filePath?: string
      error?: string
      recordCount?: number
    }>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
