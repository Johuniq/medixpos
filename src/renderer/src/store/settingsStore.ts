/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SettingPrimitive = string | number | boolean

interface SettingsValues {
  // Basic settings
  storeName: string
  storePhone: string
  storeEmail: string
  storeAddress: string
  taxRate: number
  currency: string
  receiptFooter: string
  lowStockThreshold: number

  // Business Info
  businessLicenseNumber: string
  businessTaxId: string
  businessYearEstablished: string
  businessWebsite: string
  businessFacebook: string
  businessInstagram: string

  // Invoice/Receipt Settings
  invoiceNumberFormat: string
  invoicePrefix: string
  receiptShowLogo: boolean
  receiptShowBarcode: boolean
  receiptShowTaxBreakdown: boolean
  receiptShowDiscountDetails: boolean
  receiptPaperSize: string
  receiptFontSize: string
  receiptHeaderText: string
  receiptTermsConditions: string
  receiptReturnPolicy: string
  receiptAutoPrint: boolean

  // Inventory & Stock
  stockEnableBatchTracking: boolean
  stockExpiryAlertDays: string
  stockCriticalLevel: number
  stockEnableAutoReorder: boolean
  stockReorderLeadTimeDays: number
  stockShowExpiryOnSale: boolean
  stockAlertNearExpiry: boolean
  stockNegativeStockAllowed: boolean

  // Pricing & Discounts
  pricingDefaultMarkupPercentage: number
  pricingRoundToNearest: number
  discountMaxPercentageCashier: number
  discountMaxPercentageManager: number
  discountMaxPercentageAdmin: number
  discountRequireReason: boolean
  discountReasonThreshold: number
  loyaltyPointsEnabled: boolean
  loyaltyPointsPerCurrency: number
  loyaltyPointsRedemptionValue: number

  // Security
  securitySessionTimeoutMinutes: number
  securityPasswordMinLength: number
  securityPasswordRequireUppercase: boolean
  securityPasswordRequireNumbers: boolean
  securityPasswordRequireSpecialChars: boolean
  securityMaxFailedLogins: number
  securityLockoutDurationMinutes: number
  securityRequireDeletionReason: boolean
  securityEnableAuditLog: boolean
  securityAuditLogRetentionDays: number

  // POS Settings
  posShowProductImages: boolean
  posEnableQuickActions: boolean
  posAllowSplitPayment: boolean
  posShowStockQuantity: boolean
  posAlertLowStock: boolean
  posEnableHoldInvoice: boolean
  posMaxHoldInvoices: number

  // Customer Settings
  enableCustomerCreditSales: boolean
  maxCreditLimit: number
  creditDueDays: number
  enablePrescriptionTracking: boolean
  enableBirthdayReminders: boolean

  // Notification Settings
  enableEmailNotifications: boolean
  enableSmsNotifications: boolean
  enableDesktopNotifications: boolean

  // Hardware Settings
  enableBarcodeScanner: boolean
  barcodeScannerType: string
  barcodeScannerPort: string
  enableReceiptPrinter: boolean
  receiptPrinterName: string
  receiptPrinterPaperWidth: string
  enableCashDrawer: boolean
}

interface SettingsState extends SettingsValues {
  loadSettings: () => Promise<void>
  updateSetting: (key: string, value: string) => void
  getSetting: (key: string) => SettingPrimitive | undefined
}

const defaultSettings: SettingsValues = {
  // Basic settings
  storeName: '',
  storePhone: '',
  storeEmail: '',
  storeAddress: '',
  taxRate: 0,
  currency: 'USD',
  receiptFooter: '',
  lowStockThreshold: 10,

  // Business Info
  businessLicenseNumber: '',
  businessTaxId: '',
  businessYearEstablished: '',
  businessWebsite: '',
  businessFacebook: '',
  businessInstagram: '',

  // Invoice/Receipt Settings
  invoiceNumberFormat: 'INV-{YYYY}{MM}{DD}-{####}',
  invoicePrefix: 'INV',
  receiptShowLogo: true,
  receiptShowBarcode: true,
  receiptShowTaxBreakdown: true,
  receiptShowDiscountDetails: true,
  receiptPaperSize: '80mm',
  receiptFontSize: 'medium',
  receiptHeaderText: '',
  receiptTermsConditions: '',
  receiptReturnPolicy: '',
  receiptAutoPrint: true,

  // Inventory & Stock
  stockEnableBatchTracking: true,
  stockExpiryAlertDays: '90,60,30',
  stockCriticalLevel: 5,
  stockEnableAutoReorder: false,
  stockReorderLeadTimeDays: 7,
  stockShowExpiryOnSale: true,
  stockAlertNearExpiry: true,
  stockNegativeStockAllowed: false,

  // Pricing & Discounts
  pricingDefaultMarkupPercentage: 25,
  pricingRoundToNearest: 0.5,
  discountMaxPercentageCashier: 5,
  discountMaxPercentageManager: 15,
  discountMaxPercentageAdmin: 25,
  discountRequireReason: true,
  discountReasonThreshold: 10,
  loyaltyPointsEnabled: true,
  loyaltyPointsPerCurrency: 1,
  loyaltyPointsRedemptionValue: 0.1,

  // Security
  securitySessionTimeoutMinutes: 30,
  securityPasswordMinLength: 8,
  securityPasswordRequireUppercase: true,
  securityPasswordRequireNumbers: true,
  securityPasswordRequireSpecialChars: false,
  securityMaxFailedLogins: 5,
  securityLockoutDurationMinutes: 15,
  securityRequireDeletionReason: true,
  securityEnableAuditLog: true,
  securityAuditLogRetentionDays: 90,

  // POS Settings
  posShowProductImages: true,
  posEnableQuickActions: true,
  posAllowSplitPayment: false,
  posShowStockQuantity: true,
  posAlertLowStock: true,
  posEnableHoldInvoice: true,
  posMaxHoldInvoices: 5,

  // Customer Settings
  enableCustomerCreditSales: true,
  maxCreditLimit: 50000,
  creditDueDays: 30,
  enablePrescriptionTracking: true,
  enableBirthdayReminders: true,

  // Notification Settings
  enableEmailNotifications: false,
  enableSmsNotifications: false,
  enableDesktopNotifications: true,

  // Hardware Settings
  enableBarcodeScanner: false,
  barcodeScannerType: 'usb',
  barcodeScannerPort: '',
  enableReceiptPrinter: true,
  receiptPrinterName: '',
  receiptPrinterPaperWidth: '80',
  enableCashDrawer: false
}

type SettingType = 'string' | 'number' | 'boolean'

interface SettingConfig<T extends keyof SettingsValues = keyof SettingsValues> {
  keys: string[]
  stateKey: T
  type: SettingType
}

const settingsConfig = [
  { keys: ['store_name'], stateKey: 'storeName', type: 'string' },
  { keys: ['store_phone'], stateKey: 'storePhone', type: 'string' },
  { keys: ['store_email'], stateKey: 'storeEmail', type: 'string' },
  { keys: ['store_address'], stateKey: 'storeAddress', type: 'string' },
  { keys: ['tax_rate'], stateKey: 'taxRate', type: 'number' },
  { keys: ['currency'], stateKey: 'currency', type: 'string' },
  { keys: ['receipt_footer'], stateKey: 'receiptFooter', type: 'string' },
  { keys: ['low_stock_threshold'], stateKey: 'lowStockThreshold', type: 'number' },

  { keys: ['business_license_number'], stateKey: 'businessLicenseNumber', type: 'string' },
  { keys: ['business_tax_id'], stateKey: 'businessTaxId', type: 'string' },
  {
    keys: ['business_established_year', 'business_year_established'],
    stateKey: 'businessYearEstablished',
    type: 'string'
  },
  { keys: ['business_website'], stateKey: 'businessWebsite', type: 'string' },
  { keys: ['business_facebook'], stateKey: 'businessFacebook', type: 'string' },
  { keys: ['business_instagram'], stateKey: 'businessInstagram', type: 'string' },

  { keys: ['invoice_number_format'], stateKey: 'invoiceNumberFormat', type: 'string' },
  { keys: ['invoice_prefix'], stateKey: 'invoicePrefix', type: 'string' },
  { keys: ['receipt_show_logo'], stateKey: 'receiptShowLogo', type: 'boolean' },
  { keys: ['receipt_show_barcode'], stateKey: 'receiptShowBarcode', type: 'boolean' },
  { keys: ['receipt_show_tax_breakdown'], stateKey: 'receiptShowTaxBreakdown', type: 'boolean' },
  {
    keys: ['receipt_show_discount_details'],
    stateKey: 'receiptShowDiscountDetails',
    type: 'boolean'
  },
  { keys: ['receipt_paper_size'], stateKey: 'receiptPaperSize', type: 'string' },
  { keys: ['receipt_font_size'], stateKey: 'receiptFontSize', type: 'string' },
  { keys: ['receipt_header_text'], stateKey: 'receiptHeaderText', type: 'string' },
  { keys: ['receipt_terms_conditions'], stateKey: 'receiptTermsConditions', type: 'string' },
  { keys: ['receipt_return_policy'], stateKey: 'receiptReturnPolicy', type: 'string' },
  { keys: ['receipt_auto_print'], stateKey: 'receiptAutoPrint', type: 'boolean' },

  { keys: ['stock_enable_batch_tracking'], stateKey: 'stockEnableBatchTracking', type: 'boolean' },
  { keys: ['stock_expiry_alert_days'], stateKey: 'stockExpiryAlertDays', type: 'string' },
  { keys: ['stock_critical_level'], stateKey: 'stockCriticalLevel', type: 'number' },
  { keys: ['stock_enable_auto_reorder'], stateKey: 'stockEnableAutoReorder', type: 'boolean' },
  { keys: ['stock_reorder_lead_time_days'], stateKey: 'stockReorderLeadTimeDays', type: 'number' },
  { keys: ['stock_show_expiry_on_sale'], stateKey: 'stockShowExpiryOnSale', type: 'boolean' },
  { keys: ['stock_alert_near_expiry'], stateKey: 'stockAlertNearExpiry', type: 'boolean' },
  {
    keys: ['stock_negative_stock_allowed'],
    stateKey: 'stockNegativeStockAllowed',
    type: 'boolean'
  },

  {
    keys: ['pricing_default_markup_percentage'],
    stateKey: 'pricingDefaultMarkupPercentage',
    type: 'number'
  },
  { keys: ['pricing_round_to_nearest'], stateKey: 'pricingRoundToNearest', type: 'number' },
  {
    keys: ['discount_max_percentage_cashier'],
    stateKey: 'discountMaxPercentageCashier',
    type: 'number'
  },
  {
    keys: ['discount_max_percentage_manager'],
    stateKey: 'discountMaxPercentageManager',
    type: 'number'
  },
  {
    keys: ['discount_max_percentage_admin'],
    stateKey: 'discountMaxPercentageAdmin',
    type: 'number'
  },
  { keys: ['discount_require_reason'], stateKey: 'discountRequireReason', type: 'boolean' },
  { keys: ['discount_reason_threshold'], stateKey: 'discountReasonThreshold', type: 'number' },
  { keys: ['loyalty_points_enabled'], stateKey: 'loyaltyPointsEnabled', type: 'boolean' },
  { keys: ['loyalty_points_per_currency'], stateKey: 'loyaltyPointsPerCurrency', type: 'number' },
  {
    keys: ['loyalty_points_redemption_rate', 'loyalty_points_redemption_value'],
    stateKey: 'loyaltyPointsRedemptionValue',
    type: 'number'
  },

  {
    keys: ['security_session_timeout_minutes'],
    stateKey: 'securitySessionTimeoutMinutes',
    type: 'number'
  },
  {
    keys: ['security_password_min_length'],
    stateKey: 'securityPasswordMinLength',
    type: 'number'
  },
  {
    keys: ['security_password_require_uppercase'],
    stateKey: 'securityPasswordRequireUppercase',
    type: 'boolean'
  },
  {
    keys: ['security_password_require_numbers'],
    stateKey: 'securityPasswordRequireNumbers',
    type: 'boolean'
  },
  {
    keys: ['security_password_require_special', 'security_password_require_special_chars'],
    stateKey: 'securityPasswordRequireSpecialChars',
    type: 'boolean'
  },
  {
    keys: ['security_max_login_attempts', 'security_max_failed_logins'],
    stateKey: 'securityMaxFailedLogins',
    type: 'number'
  },
  {
    keys: ['security_lockout_duration_minutes'],
    stateKey: 'securityLockoutDurationMinutes',
    type: 'number'
  },
  {
    keys: ['security_require_deletion_reason'],
    stateKey: 'securityRequireDeletionReason',
    type: 'boolean'
  },
  {
    keys: ['security_enable_audit_log'],
    stateKey: 'securityEnableAuditLog',
    type: 'boolean'
  },
  {
    keys: ['security_audit_retention_days', 'security_audit_log_retention_days'],
    stateKey: 'securityAuditLogRetentionDays',
    type: 'number'
  },

  { keys: ['pos_show_product_images'], stateKey: 'posShowProductImages', type: 'boolean' },
  { keys: ['pos_enable_quick_actions'], stateKey: 'posEnableQuickActions', type: 'boolean' },
  { keys: ['pos_allow_split_payment'], stateKey: 'posAllowSplitPayment', type: 'boolean' },
  { keys: ['pos_show_stock_quantity'], stateKey: 'posShowStockQuantity', type: 'boolean' },
  { keys: ['pos_alert_low_stock'], stateKey: 'posAlertLowStock', type: 'boolean' },
  { keys: ['pos_enable_hold_invoice'], stateKey: 'posEnableHoldInvoice', type: 'boolean' },
  { keys: ['pos_max_hold_invoices'], stateKey: 'posMaxHoldInvoices', type: 'number' },

  {
    keys: ['enable_customer_credit_sales'],
    stateKey: 'enableCustomerCreditSales',
    type: 'boolean'
  },
  { keys: ['max_credit_limit'], stateKey: 'maxCreditLimit', type: 'number' },
  { keys: ['credit_due_days'], stateKey: 'creditDueDays', type: 'number' },
  {
    keys: ['enable_prescription_tracking'],
    stateKey: 'enablePrescriptionTracking',
    type: 'boolean'
  },
  {
    keys: ['enable_birthday_reminders'],
    stateKey: 'enableBirthdayReminders',
    type: 'boolean'
  },

  {
    keys: ['enable_email_notifications'],
    stateKey: 'enableEmailNotifications',
    type: 'boolean'
  },
  {
    keys: ['enable_sms_notifications'],
    stateKey: 'enableSmsNotifications',
    type: 'boolean'
  },
  {
    keys: ['enable_desktop_notifications', 'notification_desktop_alerts'],
    stateKey: 'enableDesktopNotifications',
    type: 'boolean'
  },

  {
    keys: ['enable_barcode_scanner'],
    stateKey: 'enableBarcodeScanner',
    type: 'boolean'
  },
  { keys: ['barcode_scanner_type'], stateKey: 'barcodeScannerType', type: 'string' },
  { keys: ['barcode_scanner_port'], stateKey: 'barcodeScannerPort', type: 'string' },
  {
    keys: ['enable_receipt_printer'],
    stateKey: 'enableReceiptPrinter',
    type: 'boolean'
  },
  { keys: ['receipt_printer_name'], stateKey: 'receiptPrinterName', type: 'string' },
  {
    keys: ['receipt_printer_paper_width'],
    stateKey: 'receiptPrinterPaperWidth',
    type: 'string'
  },
  { keys: ['enable_cash_drawer'], stateKey: 'enableCashDrawer', type: 'boolean' }
] satisfies ReadonlyArray<SettingConfig<keyof SettingsValues>>

const keyToConfig = settingsConfig.reduce<Record<string, SettingConfig<keyof SettingsValues>>>(
  (acc, config) => {
    config.keys.forEach((key) => {
      acc[key] = config
    })
    return acc
  },
  {}
)

const parseSettingValue = <T extends keyof SettingsValues>(
  config: SettingConfig<T>,
  rawValue: string | undefined,
  fallback: SettingsValues[T]
): SettingsValues[T] => {
  if (rawValue === undefined || rawValue === null) {
    return fallback
  }

  switch (config.type) {
    case 'boolean':
      if (rawValue === 'true') return true as SettingsValues[T]
      if (rawValue === 'false') return false as SettingsValues[T]
      return fallback
    case 'number': {
      const parsed = Number(rawValue)
      return Number.isFinite(parsed) ? (parsed as SettingsValues[T]) : fallback
    }
    case 'string':
    default:
      return rawValue as SettingsValues[T]
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      loadSettings: async () => {
        try {
          if (!window.api) {
            console.error('window.api not available in loadSettings')
            return
          }

          const settings = await window.api.settings.getAll()
          const typedSettings = settings as Array<{ key: string; value: string }>
          const settingsMap: Record<string, string> = {}

          typedSettings.forEach((setting) => {
            settingsMap[setting.key] = setting.value
          })

          const currentState = get()
          const updates: Record<string, SettingPrimitive> = {}

          settingsConfig.forEach((config) => {
            const rawValue = config.keys
              .map((key) => settingsMap[key])
              .find((value) => value !== undefined)

            const fallback = (currentState[config.stateKey] ??
              defaultSettings[config.stateKey]) as SettingsValues[typeof config.stateKey]

            const parsedValue = parseSettingValue(config, rawValue, fallback)
            updates[config.stateKey] = parsedValue
          })

          set(updates as Partial<SettingsValues>)
        } catch (error) {
          console.error('Error loading settings:', error)
        }
      },
      updateSetting: (key: string, value: string) => {
        const config = keyToConfig[key]
        if (!config) {
          return
        }

        const currentState = get()
        const fallback = (currentState[config.stateKey] ??
          defaultSettings[config.stateKey]) as SettingsValues[typeof config.stateKey]

        const parsedValue = parseSettingValue(config, value, fallback)
        set({ [config.stateKey]: parsedValue } as Partial<SettingsValues>)
      },
      getSetting: (key: string) => {
        const config = keyToConfig[key]
        if (!config) {
          return undefined
        }
        const state = get()
        return state[config.stateKey]
      }
    }),
    {
      name: 'settings-storage'
    }
  )
)
