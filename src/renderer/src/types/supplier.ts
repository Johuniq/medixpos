/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

export interface Supplier {
  id: string
  name: string
  code: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  taxNumber?: string
  openingBalance?: number
  currentBalance?: number
  totalPurchases?: number
  totalPayments?: number
  creditLimit?: number
  creditDays?: number
  isActive: boolean
  version: number // Optimistic locking version
}

export interface BankAccount {
  id: string
  name: string
  accountType: string
  currentBalance: number
}

export interface SupplierFormData {
  name: string
  code: string
  contactPerson: string
  phone: string
  email: string
  address: string
  taxNumber: string
  openingBalance: string
  creditLimit: string
  creditDays: string
}

export interface PaymentFormData {
  amount: string
  accountId: string
  paymentDate: string
  notes: string
}

export interface PaymentReceipt {
  referenceNumber: string
  amount: number
  accountName: string
  paymentDate: string
  notes: string
}
