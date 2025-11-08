/**
 * Copyright (c) 2025 Johuniq(https://johuniq.tech). All rights reserved.
 * Licensed under Proprietary License - See LICENSE file
 * Unauthorized use, copying, or distribution is strictly prohibited.
 */

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  dateOfBirth?: string
  loyaltyPoints: number
  totalPurchases: number
  status: string
  version: number // Optimistic locking version
  createdAt: string
}

export interface CustomerFormData {
  name: string
  phone: string
  email: string
  address: string
  dateOfBirth: string
  status: string
}
